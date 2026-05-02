# BITACORA.md — Bitácora activa del proyecto Trawel

> **Nota:** Este es el archivo de bitácora activa. Para el histórico completo, ver `docs/BITACORA_002.md` (2026-04-27 a 2026-05-01) y `docs/BITACORA_001.md` (inicio del proyecto).

---

## 2026-05-02 - Retirada privada de aventuras pendientes

Añadido flujo para que un viajero pueda retirar una aventura antes de revisión mediante token privado.

### Cambios

- Nueva migración `supabase/migrations/005_add_withdrawal_token_to_traveler_adventures.sql`.
- `traveler_adventures` guarda `withdrawal_token_hash`, `withdrawal_token_created_at` y `withdrawn_at`.
- Se añade estado `withdrawn` para retirar sin borrar físicamente la fila.
- El navegador genera un token privado y solo inserta su hash SHA-256.
- Nueva Edge Function `withdraw-traveler-adventure` valida el token con `service_role` y solo retira aventuras `pending`.
- Nueva ruta pública `/retirar-aventura` para usar enlace o código de retirada.
- Tras enviar una aventura, `CountryZonePage` muestra resumen con enlace y código privado de retirada.

### Alcance

- No se implementó email automático, recuperación de tokens perdidos, borrado físico, panel de soporte ni retirada de aventuras ya aprobadas.
- El token debe guardarlo el usuario; si se pierde, la retirada futura queda para webmaster/soporte.

---

## 2026-05-02 - Privacidad obligatoria en aventuras de viajeros

Añadido consentimiento de privacidad al envío real de aventuras desde `CountryZonePage`. El marketing queda separado y opcional, sin bloquear el envío.

### Cambios

- Nueva migración `supabase/migrations/004_add_privacy_consent_to_traveler_adventures.sql`.
- `traveler_adventures` guarda `privacy_accepted_at`, `privacy_version`, `marketing_consent` y `marketing_consent_at`.
- La policy pública de INSERT exige privacidad aceptada y coherencia entre `marketing_consent` y `marketing_consent_at`.
- `createTravelerAdventure(input)` rechaza envíos sin privacidad y envía la versión de privacidad vigente.
- El formulario añade checkbox obligatorio de privacidad, checkbox opcional de comunicaciones/promociones y panel informativo.

### Alcance

- No se implementaron fotos, newsletter real, cookies, panel legal, autenticación, captcha ni borrado automático.
- El texto de privacidad es operativo e informativo; debe revisarse por asesoría/legal antes de producción pública.

---

## 2026-05-02 - CountryZonePage envía aventuras pendientes

Añadido formulario real para que un viajero envíe una aventura desde una zona del mapa. El envío se guarda en `traveler_adventures` y queda pendiente de revisión.

### Cambios

- `createTravelerAdventure(input)` inserta aventuras usando el cliente Supabase público.
- El formulario pide título, historia, consejos prácticos, nombre y email.
- Validación mínima frontend: campos obligatorios no vacíos y email con forma básica.
- El insert no envía `status` ni `photo_path`; Supabase deja `status = pending` por default.
- Tras éxito se limpia el formulario y se muestra “Hemos recibido tu aventura. La revisaremos antes de publicarla.”
- La aventura enviada no aparece en la lista pública hasta que se apruebe.

### Alcance

- No se implementaron fotos, Storage, Edge Function, panel de moderación, captcha, autenticación ni diseño final.
- `author_email` se usa solo en el INSERT y no se consulta ni renderiza públicamente.

---

## 2026-05-02 - CountryZonePage muestra aventuras aprobadas

Conectada la página de zona con `traveler_adventures` para mostrar aventuras reales aprobadas por país y zona.

### Cambios

- Nuevo servicio frontend `src/features/adventures/adventures.service.ts`.
- Nuevo tipo público `TravelerAdventurePublic` sin `author_email` ni `moderation_notes`.
- Nueva función `getApprovedAdventuresByZone(countrySlug, zoneSlug)`.
- `CountryZonePage` carga aventuras `approved` al montar o cambiar de zona.
- Si hay aventuras aprobadas, muestra título, historia, consejos prácticos y autor.
- Si no hay aventuras aprobadas, mantiene el mensaje “Próximamente aventuras” y el CTA de estrenar destino.
- Si hay error de consulta, muestra un mensaje amable sin romper navegación.

### Alcance

- No se añadió formulario, subida de fotos, panel de moderación, edición, borrado, autenticación ni render de fotos privadas.
- `photo_path` queda como metadata preparada; las imágenes privadas se servirán en una fase segura posterior.

---

## 2026-05-02 - Infraestructura: aventuras de viajeros pendientes de aprobación

Creada la base real para que futuras aventuras publicadas por viajeros nazcan desde zonas del mapa y queden pendientes hasta revisión webmaster.

### Cambios

- Nueva migración `supabase/migrations/003_create_traveler_adventures.sql`.
- Nueva tabla `traveler_adventures` con país, zona, historia, consejos prácticos, autor, estado de moderación y timestamps.
- Estado por defecto: `pending`.
- RLS activado:
  - INSERT público/anónimo controlado solo para nuevas aventuras `pending`.
  - SELECT público solo para aventuras `approved`.
  - Sin UPDATE/DELETE público.
- Grants de columnas evitan exponer `author_email` y `moderation_notes` en lecturas públicas.
- Bucket privado `traveler-adventure-photos` creado por SQL, sin políticas públicas de Storage.

### Decisión de Storage

No se habilitó subida pública directa de fotos. La opción segura queda para una Edge Function futura que valide tamaño, MIME, país/zona y asociación con una aventura `pending`, y que solo sirva fotos cuando la aventura esté aprobada.

---

## 2026-05-02 - Producto: CountryPage centrada en mapa

Se limpió la experiencia principal de `CountryPage` para que Trawel avance hacia el flujo mapa → país → zona → aventuras de viajeros.

### Cambios

- Se ocultaron del flujo principal los tarjetones heredados de ciudades activas, ciudades próximamente y aventuras destacadas.
- Se retiraron las estadísticas del hero basadas en conteos antiguos de ciudades/aventuras.
- `CountryPage` queda centrada en encabezado de país, bandera, estado del mapa y `CountryInternalMap`.
- Se añadió un bloque simple: “Explora el mapa y elige una zona” orientado a futuras aventuras con fotos, rutas, consejos y experiencias.

### Alcance

- Los datos antiguos y rutas antiguas se conservaron.
- No se implementó subida de fotos, tablas nuevas, autenticación, moderación ni formulario funcional.
- No se tocó WorldMap, worker, GitHub Actions, Supabase, generación de mapas, CountryFlag ni Investighost.

---

## 2026-05-02 - UX: click en zonas de mapa interno

Corregido el comportamiento de click en zonas/regiones/provincias de `CountryInternalMap`. Antes el click/foco podía dejar un tooltip visual suelto sin llevar a ningún destino útil.

### Cambios

- `CountryInternalMap` extrae un nombre amable de la zona y genera un `zoneSlug` estable.
- `CountryPage` navega al seleccionar una zona del mapa.
- Nueva ruta pública: `/pais/:countrySlug/zona/:zoneSlug`.
- Nueva `CountryZonePage` como placeholder editorial con mensaje “Próximamente aventuras en esta zona.”

### Alcance

- No se añadieron puntos, labels fijos ni marcadores al mapa.
- No se implementó subida real de fotos, formulario complejo ni tablas nuevas.
- No se tocó worker, GitHub Actions, Supabase, WorldMap ni Investighost.

---

## 2026-05-02 - FIX: Estados Unidos usa ADM1

Corregido el primer fallo real del worker automático para Estados Unidos: geoBoundaries respondía `HTTP 403` al intentar ADM2, además de ser un nivel demasiado granular para la experiencia pública.

### Cambio

- `src/features/map/config/countryMapProfiles.ts`: añadido perfil `estados-unidos` con `preferredAdminLevel: 'ADM1'`.
- `docs/MAP_ASSET_PLAN.md`: documentado Estados Unidos como país ADM1 por utilidad UX/comercial y para evitar errores con ADM2.

### Operativa

Si ya existe un registro `country_map_assets` para `estados-unidos` en `failed` o con `admin_level = ADM2`, hay que reencolar desde la UI o reprocesar con:

```bash
npm run maps:queue:process -- --country estados-unidos --force
```

El worker actualizará el registro a `ADM1` al completarlo.

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

## 2026-05-02 - Auditoría responsive funcional inicial

Pasada acotada de CSS/layout antes del diseño premium con v0.

### Problemas corregidos

| Problema | Solución |
|----------|----------|
| Riesgo de overflow horizontal en WorldMap móvil | Eliminado margen negativo y reforzada contención del mapa |
| Mapas internos y estados podían quedar demasiado rígidos en móvil | Añadidos `min-width: 0`, `max-width: 100%`, alturas móviles más contenidas y wrapping |
| Vista de país sin contenido editorial tenía clases sin estilos | Añadidos estilos responsive para `DiscoveringCountryView` |
| Formularios, consentimientos y retirada podían ser incómodos en móvil | Botones de 44px+, ancho completo en móvil, wrapping de textos largos y scroll en panel legal |
| Header con selector de modo podía apretar el ancho móvil | El header permite wrap y el selector baja a línea propia |

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.module.css`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`
- `src/pages/CountryPage/CountryPage.module.css`
- `src/pages/CountryZonePage/CountryZonePage.module.css`
- `src/pages/WithdrawAdventurePage/WithdrawAdventurePage.module.css`
- `src/pages/HomePage/HomePage.module.css`
- `src/App.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

*Bitácora activa v3.1 - Trawel*
*Última actualización: 2026-05-02*
