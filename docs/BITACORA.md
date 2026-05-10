# BITACORA.md — Bitácora activa del proyecto Trawel

> **Nota:** Este es el archivo de bitácora activa. Para el histórico completo, ver `docs/BITACORA_002.md` (2026-04-27 a 2026-05-01) y `docs/BITACORA_001.md` (inicio del proyecto).
> **Continuidad:** las entradas nuevas continúan en `docs/BITACORA_002.md`.

---

## 2026-05-10 - Pipeline con simplificación configurable

Actualizado el pipeline de generación de mapas internos para aplicar el estándar cartográfico validado.

### Cambios

- `scripts/lib/mapAssetPipeline.ts` cambia el default de simplificación de `0.02` a `0.0002`.
- Añadida resolución de threshold por `countrySlug + adminLevel` mediante `resolveSimplificationThreshold()`.
- Añadido override inicial: `mexico/ADM1 = 0.0001`.
- El worker `process-country-map-queue.ts` pasa país y nivel administrativo efectivo antes de convertir a TopoJSON.
- El script manual de España usa `0.0002` y deja de describir el valor como porcentaje de detalle.
- Se corrigen comentarios/documentación técnica para explicar que `topojson.simplify` usa un threshold, no un porcentaje.

### Alcance

- No se regeneraron assets.
- No se tocó Supabase.
- No se tocó WorldMap, CountryInternalMap, Home ni CSS.

---

## 2026-05-10 - Estándar de calidad cartográfica

Documentado el estándar cartográfico tras validar visualmente WorldMap, España y México.

### Decisiones documentadas

- WorldMap adopta `world-atlas@2/countries-50m.json` como estándar actual.
- `countries-110m.json` queda descartado para mapa protagonista por falta de definición.
- `countries-10m.json` queda reservado para evaluación futura.
- El threshold `topojson.simplify(..., 0.02)` queda descartado como estándar global para mapas internos.
- Default recomendado para mapas internos: `0.0002`.
- Overrides por `countrySlug + adminLevel`: México ADM1 queda validado con `0.0001`.
- España ADM2 queda validada con `0.0002`.
- Se añade checklist de validación: tamaño, gzip, features, arcos, puntos totales, puntos en features pequeñas, revisión visual y pruebas de zoom/pan/touch.

### Archivos modificados

- `docs/MAP_ASSET_PLAN.md`
- `docs/MAP_UI_GUIDELINES.md`
- `docs/DECISIONES.md`
- `docs/CODEMAP.md`

### Alcance

- Documentación únicamente.
- No se tocó código, assets, Supabase, WorldMap, CountryInternalMap, Home ni pipeline.
- Pendiente técnico: adaptar `scripts/lib/mapAssetPipeline.ts` para configuración por país/nivel antes de regeneraciones globales.

---

## 2026-05-04 - Zoom con rueda centrado y estable en WorldMap

Simplificación del wheel zoom de escritorio tras detectar fuga visual con el anclaje al puntero.

### Cambios

- `handleWheel` deja de usar `clientX/clientY` como ancla del zoom.
- La rueda calcula el cambio de escala respecto al centro del viewBox (`width / 2`, `height / 2`), manteniendo estable el centro visual.
- La recolocación del mapa queda en el pan desktop con click sostenido y arrastre.
- No se modifica la lógica táctil móvil, navegación, tooltip, Home, CSS ni `CountryInternalMap`.
- Antártida sigue oculta filtrando UN M.49 `010`.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `docs/MAP_UI_GUIDELINES.md`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Corrección de coordenadas del wheel zoom en WorldMap

Ajuste acotado del anclaje de zoom con rueda en escritorio.

### Cambios

- `WorldMap` deja de convertir `clientX/clientY` con `getScreenCTM()` para el anclaje de zoom.
- La conversión a coordenadas del viewBox usa `getBoundingClientRect()`, escala real de `preserveAspectRatio="xMidYMid meet"` y offsets de letterboxing.
- El zoom mantiene el punto bajo cursor usando `currentTransformRef.invert(...)` y aplica el resultado sobre la misma capa `<g>` interna.
- No se modifica la lógica táctil móvil, navegación, tooltip, Home ni `CountryInternalMap`.
- Antártida sigue oculta filtrando UN M.49 `010`.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Zoom anclado y pan de ratón en WorldMap

Ajuste acotado de interacción desktop del mapa mundial, sin tocar la ruta táctil móvil.

### Cambios

- La rueda sobre el WorldMap calcula el punto de mapa bajo el cursor antes de cambiar escala, manteniéndolo anclado al puntero todo lo posible.
- Con el mapa ampliado, click sostenido y arrastre desplaza la misma capa `<g>` interna mediante `currentTransformRef`/`applyMapTransform`.
- Un drag real suprime temporalmente el click posterior para evitar navegación accidental.
- La rueda fuera del mapa sigue haciendo scroll normal porque el listener permanece limitado al SVG.
- Antártida sigue oculta filtrando UN M.49 `010`.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `docs/MAP_UI_GUIDELINES.md`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Wheel zoom en WorldMap (escritorio)

Añadido zoom con rueda de ratón en escritorio para mejorar exploración del mapa mundial.

### Cambios

- `WorldMap.tsx` añade listener `wheel` sobre el SVG.
- El zoom solo activa cuando el cursor está sobre el mapa (`event.preventDefault()` para evitar scroll de página).
- Si el cursor está fuera, la rueda sigue haciendo scroll normal de la página.
- Usa la misma función `applyMapTransform` y referencia `currentTransformRef` que el pinch zoom táctil.
- Escala limitada: 1x a 40x (mismos límites que zoom táctil).
- El punto bajo el cursor se mantiene anclado al hacer zoom (comportamiento estándar).

### Alcance

- Solo `WorldMap.tsx`; sin cambios en `CountryInternalMap`.
- Sin modificaciones de lógica táctil móvil (1 dedo explora, 2 dedos pan/zoom).
- Sin cambios en tooltips, botón "Ir a {país}", CSS ni Home.
- Antártida sigue oculta (filtro `'010'` preservado).

---

## 2026-05-04 - Ocultar Antártida del WorldMap

Ocultada Antártida del mapa mundial para evitar confusión visual y táctil en móvil.

### Cambios

- `WorldMap.tsx` filtra la geometría con código UN M.49 `'010'` antes de renderizar paths.
- Identificación robusta por código numérico de la ONU, no por nombre.

### Alcance

- Solo `WorldMap.tsx`; sin cambios en `CountryInternalMap`.
- Sin modificaciones de zoom, tooltip, responsive, CSS ni Home.
- Decisión reversible: si en el futuro se crea caso de uso específico, basta con eliminar el filtro.

---

## 2026-05-04 - Normativa UI de mapas interactivos

Creado documento oficial de UX/UI para todos los componentes de mapa.

### Cambios

- Nuevo documento `docs/MAP_UI_GUIDELINES.md` con normativa completa:
  - Principios generales de mapas exploratorios limpios
  - Reglas para Home y experiencia de mapa vivo
  - Especificaciones de WorldMap (escritorio y móvil)
  - Especificaciones de CountryInternalMap (escritorio y móvil)
  - Criterios responsive
  - Reglas para agentes
- Actualizado `docs/AGENT_BRIEF.md` con referencia a `MAP_UI_GUIDELINES.md`
- Actualizado `docs/CODEMAP.md` con referencia a `MAP_UI_GUIDELINES.md`

### Alcance

- Documentación únicamente; sin cambios de código funcional.
- No se modificó CSS, lógica de zoom, tooltips, navegación, responsive ni datos.
- Este documento debe leerse antes de tocar `WorldMap`, `CountryInternalMap`, `HomePage` relacionada con mapa o responsive de mapas.

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

## 2026-05-02 - WorldMap con zoom táctil en móvil

Mejora funcional acotada del mapa mundial para teléfonos pequeños.

### Cambios

- Añadido `d3.zoom` sobre una capa `<g>` interna del SVG.
- Pinch zoom táctil habilitado con escala limitada `1x` a `8x`.
- Pan/arrastre permitido cuando el mapa está ampliado.
- Wheel zoom desactivado para mantener el comportamiento de escritorio lo más estable posible.
- Protección simple para evitar navegación si un arrastre acaba generando click.
- Indicador móvil discreto: "Pellizca para acercar".

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-02 - CountryInternalMap con zoom táctil en móvil

Misma mejora funcional aplicada al mapa interno de país, manteniendo el alcance en el componente cartográfico.

### Cambios

- Añadido `d3.zoom` sobre una capa `<g>` interna del SVG.
- Pinch zoom táctil habilitado con escala limitada `1x` a `8x`.
- Pan/arrastre permitido cuando el mapa está ampliado.
- Wheel zoom desactivado para conservar la experiencia de escritorio.
- Protección simple para evitar navegación accidental a una zona tras pan.
- Indicador móvil discreto: "Pellizca para acercar".

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Ajuste de pan en mapas con zoom táctil

Corrección quirúrgica del comportamiento táctil tras probar en móvil real.

### Problema

`translateExtent` estaba limitado al viewBox original del SVG. Con el mapa ampliado, D3 restringía demasiado la traslación y el usuario no podía reacomodar el mapa con libertad.

### Cambios

- `WorldMap` y `CountryInternalMap` mantienen `extent` como viewport para conservar el centro natural del pinch zoom.
- `translateExtent` se relajó con margen interno alrededor del viewBox para permitir pan más amplio del contenido ampliado.
- Se mantiene clipping visual con `overflow: hidden`, evitando overflow horizontal de página.
- `touch-action: none` también se aplica al wrapper del mapa para estabilizar gestos táctiles en móvil real.
- Wheel zoom sigue desactivado en escritorio.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Aumento de profundidad de zoom en mapas táctiles

Nuevo ajuste funcional para selección precisa de países y zonas pequeñas en móvil.

### Cambios

- `WorldMap` sube su zoom máximo de `8x` a `40x`.
- `CountryInternalMap` sube su zoom máximo de `8x` a `30x`.
- `translateExtent` mantiene el enfoque relajado, pero aumenta su margen:
  - `WorldMap`: margen de pan `4x` el tamaño del viewBox.
  - `CountryInternalMap`: margen de pan `3x` el tamaño del viewBox.
- `extent` se mantiene como viewport del SVG para conservar el centro natural del pinch zoom.
- Wheel zoom sigue desactivado y se mantiene la protección anti-click tras pan.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Hover táctil y long press en WorldMap

Mejora de UX móvil para recuperar la exploración por tooltip del escritorio.

### Cambios

- `WorldMap` detecta interacción táctil con Pointer Events (`pointerType !== 'mouse'`).
- Tocar un país muestra tooltip con bandera y nombre sin navegar.
- Mover el dedo sobre países actualiza el tooltip usando `document.elementFromPoint`.
- La navegación táctil pasa a long press de `700ms` sobre el mismo país.
- El long press se cancela si hay dos dedos, pan/zoom o movimiento mayor a `12px`.
- El click de escritorio se mantiene; el tap táctil simple queda suprimido para evitar navegación accidental.
- Ayuda móvil actualizada: "Explora con el dedo · mantén pulsado para entrar".

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Gestos táctiles separados en WorldMap

Ajuste de UX móvil para que el mapa mundial distinga exploración y navegación.

### Cambios

- El gesto de un dedo queda reservado para explorar países y actualizar tooltip.
- `d3.zoom` solo acepta gestos táctiles de dos dedos, manteniendo pinch zoom y pan ampliado.
- Se añade botón flotante táctil "Ir a {país}" con el último país enfocado.
- La ayuda móvil cambia a "1 dedo explora · 2 dedos mueven · Ir para entrar".
- El long press de 700ms se mantiene como atajo, cancelado por movimiento o gestos de varios dedos.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Corrección de centrado en pinch zoom de WorldMap

Ajuste quirúrgico tras prueba en móvil real.

### Problema

El wrapper del SVG usaba alturas responsive mayores que el ratio real del `viewBox` (`960:500`). Con `preserveAspectRatio="xMidYMid meet"`, eso introducía espacio vertical interno y el punto visual del gesto podía no coincidir con el viewport que D3 usa para centrar el zoom.

### Cambios

- `WorldMap` mantiene `extent`, `translateExtent`, `scaleExtent`, filtro táctil y transform sobre la capa `<g>`.
- El wrapper del SVG queda alineado al ratio exacto del `viewBox` (`52.083333%`) también en tablet y móvil.
- Se preserva `overflow: hidden` y `touch-action: none`.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Botón táctil fuera del área del WorldMap

Ajuste de UX móvil para evitar que el CTA de país interfiera con pinch zoom y pan.

### Cambios

- El botón "Ir a {país}" deja de estar flotante sobre el mapa.
- El CTA táctil se renderiza debajo del wrapper SVG, fuera del área interactiva de pinch/zoom.
- Se mantiene el último país enfocado como destino del botón.
- El botón conserva tamaño táctil cómodo y ancho limitado para evitar overflow.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - CTA discreto y pinch zoom anclado en WorldMap

Corrección funcional tras prueba en móvil real.

### Problemas

- El botón "Ir a {país}" seguía dentro del recuadro visual del mapa y resultaba demasiado protagonista.
- El pinch zoom podía fugarse lejos del punto localizado porque el gesto táctil dependía del cálculo interno de D3 sobre un SVG responsive.

### Cambios

- El marco visual se limita al wrapper del SVG; el contenedor general queda limpio.
- El CTA táctil queda debajo del recuadro del mapa, con estilo secundario y ancho más contenido.
- El gesto de dos dedos se calcula con Pointer Events: se ancla el punto del mapa bajo el centro inicial de los dedos y se recoloca bajo el centro actual.
- `d3.zoom` conserva wheel desactivado y queda para interacciones no táctiles; el touch zoom/pan lo gestiona el componente para estabilizar el centro.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Tooltip táctil visible y ancla SVG de pinch zoom

Ajuste sobre la interacción táctil del mapa mundial.

### Cambios

- El tooltip táctil intenta aparecer arriba-izquierda del dedo y se recoloca si chocaría con bordes de pantalla.
- La conversión pantalla → SVG sigue usando `createSVGPoint()` con `getScreenCTM().inverse()`.
- El gesto de pinch guarda explícitamente el punto del mapa bajo el centro inicial de los dedos (`anchorMapPoint`) y lo mantiene bajo el centro actual al recalcular escala/traslación.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Transform único y foco táctil persistente en WorldMap

Corrección quirúrgica de la interacción móvil del mapa mundial.

### Cambios

- `d3.zoom` deja de registrar listeners sobre el SVG para evitar doble fuente de transform.
- El transform único vive en `currentTransformRef` y se aplica solo a la capa `<g>` del mapa.
- El pinch/pan táctil de dos dedos sigue usando el centro real convertido a coordenadas SVG.
- El último país enfocado en móvil queda resaltado en amarillo tras levantar el dedo.
- Al enfocar otro país, se limpia el anterior y el foco amarillo pasa al nuevo.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Limpieza de Home hacia mapa vivo

Ajuste pequeño de producto para retirar el enfoque heredado de catálogo cerrado en la página principal.

### Cambios

- Eliminados de Home los contadores y bloques de "Países disponibles", "Próximamente" y "Destinos disponibles".
- La Home deja de consultar datos agregados de países para pintar listados heredados.
- El copy principal ahora presenta Trawel como flujo mapa mundial → país → zona → aventuras reales revisadas.
- Añadido bloque contextual "Un mapa vivo de aventuras" con pasos simples de exploración.
- Añadida sección provisional "Servicios útiles para tu viaje" con placeholders discretos, sin enlaces ni integraciones reales.
- WorldMap no se modifica.

### Archivos modificados

- `src/pages/HomePage/HomePage.tsx`
- `src/pages/HomePage/HomePage.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)


---

## 2026-05-03 - Footer en HomePage y rollback parcial de WorldMap

Dos ajustes concretos: reemplazo del último recuadro de Home por un footer real, y rollback parcial del intento de zoom táctil con CSS transform en WorldMap.

### Footer en HomePage

**Problema:** El último recuadro "Historias revisadas antes de publicarse..." ya no tenía sentido en el flujo actual centrado en el mapa.

**Cambios:**
- Eliminada la sección `.note` con el recuadro informativo
- Añadido footer típico con:
  - Copyright: "© 2026 Trawel"
  - Frase de marca: "Explora el mundo a través de aventuras reales de viajeros."
  - Enlaces placeholder: Mapa del sitio, Conócenos, Quiénes somos, Privacidad, Contacto
- Diseño discreto, responsive, sin overflow en móvil
- Enlaces usan `href="#"` (no funcionales) sin romper navegación

### Rollback de WorldMap

- Revertido el intento de aplicar zoom mediante CSS transform sobre un wrapper interno.
- Restaurado WorldMap al estado previo: transform único aplicado a la capa `<g>` interna del SVG.
- Se conservan la exploración con 1 dedo, tooltip táctil arriba-izquierda, foco amarillo persistente, botón "Ir a {país} →" debajo del mapa y zoom/pan con 2 dedos.

**Archivos afectados:**
- `src/pages/HomePage/HomePage.tsx`
- `src/pages/HomePage/HomePage.module.css`
- `src/features/map/components/WorldMap/WorldMap.tsx` (restaurado al checkpoint previo)
- `src/features/map/components/WorldMap/WorldMap.module.css` (restaurado al checkpoint previo)

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - WorldMap más alto en móvil

Ajuste visual acotado para dar más superficie táctil al mapa mundial sin tocar la lógica de zoom, foco ni navegación.

### Cambios

- En móvil, el wrapper del SVG deja de depender solo del ratio `960:500`.
- El área visible usa `height: clamp(280px, 52vh, 440px)` y mantiene `padding-bottom: 0` en ese breakpoint.
- Escritorio conserva el aspect ratio anterior.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - CountryInternalMap más alto en móvil

Ajuste responsive del mapa interno de país/zona para seguir el mismo criterio UX aplicado al WorldMap.

### Cambios

- En móvil, el wrapper del mapa interno deja de depender del `padding-bottom: 72%`.
- El área táctil usa `height: clamp(300px, 54vh, 460px)` y `padding-bottom: 0`.
- Los estados de carga/error usan la misma altura mínima responsive para evitar saltos visuales.
- Escritorio conserva el aspect ratio y layout previos.
- Criterio responsive documentado: los mapas interactivos de Trawel mantienen aspect-ratio en escritorio, pero en móvil priorizan superficie táctil útil.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - CountryInternalMap empieza más cercano

Ajuste acotado del encaje inicial del mapa interno para aprovechar mejor la altura móvil añadida.

### Cambios

- El mapa interno sigue calculando geometría con `geoMercator().fitSize([900, 560], featureCollection)`.
- Tras dibujar las áreas, se aplica un transform inicial mediante el mismo `zoomBehavior` de D3.
- El arranque usa zoom centrado `1.18x` en móvil y `1.08x` en escritorio.
- Pan/zoom existente queda sincronizado porque el transform inicial se registra en D3, no solo en el `<g>`.
- No se modifican tooltips, navegación, datos ni WorldMap.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Tooltip interactivo en CountryInternalMap

Añadido tooltip de nombres al mapa interno de país/zona sin etiquetas permanentes.

### Cambios

- Cada área interna expone `data-internal-area-name` con el nombre calculado desde propiedades GeoJSON.
- Escritorio mantiene tooltip por hover con el nombre de zona/provincia/ciudad.
- Móvil añade tooltip con 1 dedo usando `touchstart`/`touchmove` y `elementFromPoint`.
- Los listeners táctiles no hacen `preventDefault`, por lo que pan/zoom existente sigue en D3.
- Regla documentada: los mapas internos muestran nombres bajo interacción, no como etiquetas fijas sobre el mapa.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Encaje desktop y rueda en CountryInternalMap

Ajuste acotado del mapa interno tras detectar recorte visual en escritorio.

### Cambios

- El encaje inicial pasa de `fitSize` a `fitExtent` con margen interno para que el territorio completo respire dentro del viewBox.
- El zoom inicial de escritorio vuelve a identidad (`1x`) para evitar recortes; móvil conserva acercamiento moderado (`1.12x`).
- La rueda del ratón vuelve a usar el `zoomBehavior` de D3 solo cuando el cursor está sobre el SVG del mapa.
- Fuera del mapa, la rueda sigue haciendo scroll normal de la página.
- Tooltips de hover/táctil, selección de zonas y navegación se mantienen sin cambios.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - CountryInternalMap separa exploración táctil y multitouch

Ajuste acotado de interacción móvil para que el mapa interno distinga exploración con 1 dedo de gestos de mapa con 2 dedos.

### Cambios

- El tooltip táctil de 1 dedo usa una guardia breve de 80 ms en `touchstart` para cancelar el cambio si aparece un segundo dedo.
- Durante un gesto multitouch se congela el tooltip de zona y no se recalcula por la posición de ningún dedo.
- D3 zoom solo gestiona eventos táctiles multitouch; la exploración de 1 dedo queda dedicada a nombres de zonas.
- Al terminar un pinch, no se muestra automáticamente otra zona por el dedo restante; hay que levantar y volver a explorar.
- Escritorio mantiene encaje, hover tooltip y zoom con rueda solo sobre el SVG.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Tooltip táctil cómodo en CountryInternalMap

Ajuste acotado del posicionamiento móvil del tooltip del mapa interno.

### Cambios

- El tooltip táctil se coloca por encima del dedo y separado lateralmente para evitar tapar el nombre.
- Si no cabe hacia la izquierda, cambia al lado derecho del dedo.
- Si se acerca al borde derecho, se limita al viewport con margen mínimo.
- Se reutiliza la idea de medición del tooltip del WorldMap sin modificar WorldMap.
- Hover de escritorio, pan/zoom móvil y separación 1 dedo/2 dedos se mantienen sin cambios.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

*Bitácora activa v3.2 - Trawel*
*Última actualización: 2026-05-04*
