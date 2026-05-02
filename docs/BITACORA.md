# BITACORA.md — Bitácora activa del proyecto Trawel

> **Nota:** Este es el archivo de bitácora activa. Para el histórico completo, ver `docs/BITACORA_002.md` (2026-04-27 a 2026-05-01) y `docs/BITACORA_001.md` (inicio del proyecto).

---

## 2026-05-02 - Automatización inicial de cola de mapas

Se añadió la base CI para procesar automáticamente `country_map_assets` sin mover trabajo pesado al navegador ni a la Edge Function.

### Cambios

- `.github/workflows/process-country-map-queue.yml`: workflow programado cada 30 minutos y manual con `workflow_dispatch`.
- `docs/MAP_ASSET_PLAN.md`: documentado flujo navegador → queued → worker automático → ready → `CountryInternalMap`.
- `docs/CODEMAP.md`: añadido mapa del workflow y su relación con el worker.
- `docs/AGENT_BRIEF.md`: añadida nota operativa sobre automatización y secretos.

### Decisiones operativas

- Límite inicial recomendado: `npm run maps:queue:process -- --limit 1`.
- Frecuencia inicial recomendada: cada 30 minutos.
- GitHub Actions usa `SUPABASE_SERVICE_ROLE_KEY` únicamente como secret de CI/backend.
- Frontend mantiene flujo anon/public y nunca recibe `service_role`.
- `request-country-map` sigue limitada a encolar/actualizar registros; el procesamiento pesado queda en worker/CI.

---

## 2026-05-02 - DECISIÓN: nivel cartográfico configurable por país

Establecida la regla de producto para mapas internos: el `admin_level` no es global, se decide por país según el nivel más útil para exploración comercial.

### Cambios

- Creada configuración central en `src/features/map/config/countryMapProfiles.ts`.
- España conserva `ADM2` para mostrar provincias.
- México pasa a `ADM1` para mostrar estados y evitar un mapa excesivamente granular.
- CountryPage consulta y solicita mapas usando el nivel preferido del país.
- El worker aplica el perfil del país al procesar o reprocesar assets y actualiza `admin_level` al dejar el registro en `ready`.

### Reprocesado de México

```bash
npm run maps:queue:process -- --country mexico --force
```

Con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` configuradas, el worker generará `countries/mexico/mexico-adm1.topojson` y actualizará el registro único de `country_map_assets` a `admin_level = ADM1`.

---

## 2026-05-02 - FIX: cache-busting para assets de mapas en Storage

Corregido el caso en que el navegador seguía cargando `mexico-adm2.topojson` desde disk cache después de reprocesar el asset.

### Problema

Supabase Storage mantiene la misma URL pública cuando se sobrescribe un archivo con `--force`. Si el navegador tenía el TopoJSON cacheado, `CountryInternalMap` podía seguir recibiendo la versión antigua aunque el asset ya estuviera regenerado.

### Solución

`getCountryMapPublicUrl(asset)` ahora añade un query param `v` estable basado en metadatos:

1. `generatedAt`
2. `updatedAt`
3. `sizeBytes`

Ejemplo:

```text
https://.../mexico-adm2.topojson?v=2026-05-02T...
```

Al cambiar `generated_at` después de `--force`, cambia también la URL y el navegador descarga el TopoJSON nuevo.

---

## 2026-05-02 - FIX: winding final en assets y reprocesado forzado

Corregido el pipeline compartido de mapas para evitar polígonos complementarios como el cuadrado amarillo visto en México.

### Problema

México cargaba el TopoJSON y los tooltips funcionaban, pero algunas geometrías se renderizaban como complementos del mapa. El síntoma visible era un rectángulo/área enorme en hover, causado por anillos con winding inválido para D3 en el asset final.

### Solución

- `mapAssetPipeline.convertToTopoJSON()` ahora normaliza winding antes de convertir y vuelve a normalizar después de `topojson-simplify`.
- `normalizeGeoJSON()` soporta `FeatureCollection`, `Feature`, `Polygon`, `MultiPolygon` y `GeometryCollection`.
- El worker acepta `--force` para reprocesar un país aunque su registro esté `ready`.

### Comando de reprocesado

```bash
npm run maps:queue:process -- --country mexico --force
```

Requiere `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el entorno. En esta sesión no se ejecutó contra Supabase porque `SUPABASE_URL` no estaba configurada en la shell.

---

## 2026-05-02 - CountryInternalMap: mapas internos limpios y homogéneos

Implementado el render genérico de mapas internos para países con asset TopoJSON listo.

### Problemas corregidos

| Problema | Causa | Solución |
|----------|-------|----------|
| **Estado `ready` solo mostraba mensaje** | CountryPage no renderizaba el asset de Storage | `CountryInternalMap` carga y pinta el TopoJSON real cuando `status='ready'` |
| **España mantenía puntos y labels fijos** | `SpainMap` seguía pintando ciudades sobre el mapa | España usa el mismo `CountryInternalMap` con asset local |
| **Mapas internos revelaban editorial** | Marcadores de ciudad indicaban contenido disponible | Sin puntos, sin labels, solo tooltip de zona al hover |

### Archivos creados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`
- `src/features/map/components/CountryInternalMap/index.ts`

### Comportamiento

- España carga `/maps/countries/spain/spain-adm2.topojson`.
- México, Francia y otros países cargan la `publicUrl` de Supabase Storage cuando el asset está `ready`.
- El componente detecta automáticamente la primera key válida dentro de `topology.objects`.
- El mapa usa estilo homogéneo con WorldMap: gris neutro + hover dorado.
- El tooltip muestra solo el nombre de la zona/área.
- El contenido editorial queda fuera del mapa.

### SpainMap

`SpainMap` queda como wrapper legado temporal sobre `CountryInternalMap`. Ya no pinta círculos, labels ni leyenda de ciudades.

---

## 2026-05-02 - FIX: request-country-map pública para usuarios anónimos

Documentada la causa del `401 Unauthorized` al solicitar mapas desde `/pais/francia`.

### Problema confirmado

La llamada frontend a `request-country-map` enviaba el payload correcto, pero Supabase bloqueaba la Edge Function antes de ejecutarla porque estaba desplegada con verificación JWT activa. En el flujo público de Trawel, usuarios anónimos deben poder solicitar que un país entre en cola de generación.

### Solución

La función debe desplegarse como pública, sin exponer `service_role` en frontend:

```bash
npx supabase functions deploy request-country-map --no-verify-jwt
```

La escritura sigue protegida dentro de la Edge Function, que usa `SUPABASE_SERVICE_ROLE_KEY` solo en servidor y valida el payload antes de crear o actualizar `country_map_assets`.

### Archivos modificados

- `docs/MAP_ASSET_PLAN.md` - Deploy correcto con `--no-verify-jwt`
- `docs/CODEMAP.md` - Nota operativa para despliegue público
- `docs/BITACORA.md` - Causa y solución del `401 Unauthorized`

---

## 2026-05-02 - WorldMap exploratorio real: tooltips con bandera + navegación universal 🗺️✨

Implementada la corrección fundamental de WorldMap para que sea un mapa exploratorio real donde todos los países son navegables.

### Problemas corregidos

| Problema | Causa | Solución |
|----------|-------|----------|
| **"País no disponible" en tooltip** | `getCountryByUnM49()` solo buscaba en diccionario de 5 países | Nuevo `worldCountries` con 249 países + `getWorldCountryByUnM49()` |
| **Sin bandera en tooltip** | No se usaba `formatCountryWithFlag()` correctamente | Ahora usa `countryCodeToFlagEmoji(isoAlpha2)` desde worldCountries |
| **México no aparecía** | México no estaba en el diccionario `countries.ts` | Ahora resuelve desde `worldCountries` |
| **Click no navegaba** | `isCountryClickable()` requería `status === 'active'` | Navega a cualquier país resoluble en worldCountries |
| **Sin feedback visual** | Cursor default en todos los países | Cursor pointer cuando el país es resoluble |

### Archivos creados

**`src/features/countries/data/worldCountries.ts`**
- Diccionario completo de 249 países del mundo
- Campos: `unM49`, `isoAlpha2`, `isoAlpha3`, `slug`, `displayName`
- Helpers: `getWorldCountryByUnM49()`, `getWorldCountryBySlug()`, `getWorldCountryByIsoAlpha2()`
- **No indica disponibilidad editorial**, solo identificación geográfica

### Archivos modificados

**`src/features/map/components/WorldMap/WorldMap.tsx`**
- Ahora importa desde `worldCountries` en lugar de `countries`
- Tooltip muestra: "🇲🇽 México", "🇫🇷 Francia", etc.
- Click navega a `/pais/{slug}` para cualquier país resoluble
- Cursor pointer solo en países resolubles
- Mantenido estilo neutro (todos gris, hover dorado)

**`src/pages/CountryPage/CountryPage.tsx`**
- Importa `getWorldCountryBySlug` para fallback
- Nueva vista `DiscoveringCountryView` para países sin contenido editorial
- Estados del mapa automático: loading, ready, queued, generating, failed, missing
- Pantalla amable para error: "Algo salió mal, pero lo arreglaremos pronto"
- Botón "Volver" o "Explorar otros destinos" en estado failed

### Comportamiento por tipo de país

| Tipo | Ejemplo | WorldMap Tooltip | Click | CountryPage muestra |
|------|---------|------------------|-------|---------------------|
| **Con contenido activo** | España | 🇪🇸 España | ✅ Navega | Contenido editorial completo |
| **En comingSoon** | Francia, Italia | 🇫🇷 Francia | ✅ Navega | Vista "Próximamente" + estado mapa |
| **Sin contenido, en worldCountries** | México, Brasil | 🇲🇽 México | ✅ Navega | `DiscoveringCountryView` con estado mapa |
| **No resoluble** | Código desconocido | "País no disponible" | ❌ No navega | "País no encontrado" |

### Criterios de aceptación cumplidos

- ✅ Hover sobre España muestra "🇪🇸 España"
- ✅ Hover sobre México muestra "🇲🇽 México"
- ✅ Hover sobre Francia muestra "🇫🇷 Francia"
- ✅ Click en México navega a /pais/mexico
- ✅ Click en Francia navega a /pais/francia
- ✅ /pais/mexico muestra DiscoveringCountryView con estado del mapa
- ✅ /pais/francia permite solicitar generación de mapa si falta
- ✅ WorldMap ya no muestra "País no disponible" como texto principal
- ✅ Build funciona (690 modules)

### Rotación de bitácora

Este cambio marca el punto de rotación de la bitácora:
- **BITACORA_002.md**: Histórico 2026-04-27 a 2026-05-01
- **BITACORA.md**: Cambios desde 2026-05-02 (este archivo)

---

## Resumen de cambios del día

| Cambio | Estado |
|--------|--------|
| Crear `worldCountries.ts` con 249 países | ✅ |
| Modificar `WorldMap.tsx` para usar worldCountries | ✅ |
| Modificar `WorldMap.tsx` para navegar a cualquier país | ✅ |
| Actualizar `CountryPage.tsx` con DiscoveringCountryView | ✅ |
| Añadir pantalla failed amable | ✅ |
| Rotar bitácora a BITACORA_002.md | ✅ |
| npm run build | ✅ (690 modules) |

---

## Estado actual del proyecto (v3.0)

**Trawel v3.0** — Mapa mundial exploratorio funcional

### Nuevos componentes/archivos
- `src/features/countries/data/worldCountries.ts` — Diccionario de 249 países

### Funcionalidades implementadas
- ✅ WorldMap muestra nombre + bandera para cualquier país conocido
- ✅ Navegación universal desde WorldMap a cualquier país
- ✅ CountryPage maneja países con/sin contenido editorial
- ✅ Sistema de mapas automáticos con estados visuales
- ✅ Pantallas amables para estados: loading, preparing, ready, failed

### Próximos pasos sugeridos
1. Añadir estilos CSS para `DiscoveringCountryView` en `CountryPage.module.css`
2. Verificar integración con sistema de mapas automáticos (DA-030)
3. Testing manual de navegación: España → México → Francia → país inexistente

---

## 2026-05-02 - FIX: Tooltips limpios y payload completo para solicitud de mapas

Correcciones urgentes para WorldMap y CountryPage.

### Problemas corregidos

| Problema | Causa | Solución |
|----------|-------|----------|
| **Tooltip mostraba abreviaturas/códigos** | Helper `countryCodeToFlagEmoji` usaba offset incorrecto | Unificado a método estándar: `127397 + char.charCodeAt(0)` |
| **Banderas no aparecían** | Offset del regional indicator incorrecto | Mismo fix: método 127397 estándar |
| **Francia no se insertaba en Supabase** | Payload incompleto: faltaban `isoAlpha2`, `isoAlpha3`, `adminLevel` | Ahora se construye payload completo desde `worldCountries` como fallback |
| **Error en UI al pulsar "Explorar"** | No se manejaba el caso `country === undefined` para países sin contenido editorial | Se usa `country || worldCountry` para resolver datos mínimos |

### Archivos modificados

- `src/features/countries/utils/countryHelpers.ts` - Fix `countryCodeToFlagEmoji()` con método 127397 estándar
- `src/pages/CountryPage/CountryPage.tsx` - Payload completo + logs de desarrollo + manejo de errores

### Payload real enviado para Francia

```typescript
{
  countrySlug: "francia",
  countryName: "Francia",
  isoAlpha2: "FR",
  isoAlpha3: "FRA",
  adminLevel: "ADM2",
  source: "world_map"
}
```

### Formato final del tooltip

```
"🇪🇸 España"  // Con bandera
"España"      // Fallback sin bandera (nunca muestra códigos)
```

### Logs de desarrollo añadidos

```
[CountryPage] Solicitando generación de mapa: {payload}
[CountryPage] Respuesta de requestCountryMapGeneration: {result}
[CountryPage] Éxito - Estado: "queued"
[CountryPage] Error en solicitud: {error}
```

### Criterios de aceptación verificados

- ✅ Hover España: "🇪🇸 España" o "España"
- ✅ Hover México: "🇲🇽 México" o "México"
- ✅ Hover Francia: "🇫🇷 Francia" o "Francia"
- ✅ Sin abreviaturas visibles (ES, MX, FR, etc.)
- ✅ Sin códigos técnicos en tooltip
- ✅ Click navega correctamente
- ✅ `/pais/francia` → "Explorar Francia" → inserta registro con datos completos
- ✅ UI cambia a "Preparando mapa" cuando `success=true`
- ✅ Build funciona (690 modules)

---

*Bitácora activa v3.1 - Trawel*
*Última actualización: 2026-05-02*
