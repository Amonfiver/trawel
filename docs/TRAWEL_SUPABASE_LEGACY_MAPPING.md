# Mapeo Supabase legacy a modelo futuro de Trawel

## 1. Proposito del documento

Este documento define el mapeo tecnico entre el Supabase actual de Trawel (`trawel-prod`) y el modelo data-driven futuro descrito en `docs/TRAWEL_DATA_CONTRACTS.md` y `docs/TRAWEL_SUPABASE_MODEL.md`.

El objetivo es evitar reconstruir desde cero lo que ya funciona. Trawel debe conservar los sistemas vivos, adaptar lo necesario por capas y preparar una transicion segura hacia una arquitectura donde Investighost alimenta contenido estructurado y Trawel lo renderiza mediante fachadas y plantillas genericas.

Este documento no crea migraciones, no contiene SQL ejecutable y no modifica Supabase real.

## 2. Principio rector

**Reutilizar `trawel-prod`, no reconstruir desde cero.**

Implicaciones:

- No tocar tablas vivas sin entender quien las consume.
- No sustituir `cities` y `destinations` de golpe; pueden funcionar como legacy temporal.
- No mezclar la migracion editorial con el subsistema tecnico de mapas.
- No romper el flujo comunitario de aventuras, privacidad y retirada.
- Crear nuevas tablas en paralelo cuando el modelo futuro lo requiera.
- Usar repositorios/fachadas puente antes de cambiar paginas o datos productivos.

## 3. Inventario de tablas actuales detectadas

### `countries`

Tabla base de paises legacy. La consume `supabaseTravelData.source.ts` para alimentar la interfaz `TravelDataSource`.

Campos principales detectados: `id`, `slug`, `name_es`, `emoji`, `capital_es`, `continent_es`, `description_es`, `status`, `featured`, `created_at`, `updated_at`.

Estados: `active`, `comingSoon`, `disabled`.

### `cities`

Tabla legacy de ciudades o zonas simples dentro de un pais. La consume `supabaseTravelData.source.ts` filtrando `status = active`.

Campos principales detectados: `id`, `country_id`, `slug`, `name_es`, `short_description_es`, `adventure_content_es`, `student_content_es`, `lat`, `lng`, `recommended_duration`, `best_season_es`, `sleeping_advice_es`, `food_advice_es`, `pending_verification`, `status`, `featured`, `created_at`, `updated_at`.

Estados: `active`, `comingSoon`, `disabled`.

### `destinations`

Tabla legacy de destinos, atracciones o lugares concretos. La consume `supabaseTravelData.source.ts` filtrando `status = published`.

Campos principales detectados: `id`, `country_id`, `city_id`, `slug`, `title_es`, `summary_es`, `adventure_content_es`, `student_content_es`, `type`, `tags`, `estimated_visit_time`, `price`, `opening_hours`, `practical_tip_es`, `verification_status`, `status`, `featured`, `pending_verification`, `created_at`, `updated_at`.

Estados: `draft`, `published`, `comingSoon`, `disabled`.

### `destination_sources`

Tabla legacy de fuentes asociadas a `destinations`. La migracion inicial define RLS para leer fuentes solo si el destino esta publicado. El codigo actual no las carga todavia; en `supabaseTravelData.source.ts` aparece como TODO.

Campos principales detectados: `id`, `destination_id`, `title`, `url`, `type`, `supports`, `created_at`.

### `country_map_assets`

Tabla tecnica para metadatos de mapas internos generados bajo demanda. La consume `countryMapAssets.service.ts`, la Edge Function `request-country-map` y el worker `scripts/process-country-map-queue.ts`.

Campos principales detectados: `id`, `country_slug`, `country_name`, `iso_alpha2`, `iso_alpha3`, `admin_level`, `status`, `storage_bucket`, `storage_path`, `source`, `license`, `attribution`, `feature_count`, `size_bytes`, `requested_count`, `last_requested_at`, `generated_at`, `error_message`, `created_at`, `updated_at`.

Estados: `missing`, `queued`, `generating`, `ready`, `failed`.

Nota: la migracion `006` permite multiples assets por pais mediante `country_slug + admin_level`.

### `traveler_adventures`

Tabla comunitaria para aventuras enviadas por viajeros. La consume `adventures.service.ts` y la Edge Function `withdraw-traveler-adventure`.

Campos principales detectados: `id`, `country_slug`, `zone_slug`, `zone_name`, `title`, `story`, `practical_tips`, `author_name`, `author_email`, `photo_path`, `status`, `moderation_notes`, `privacy_accepted_at`, `privacy_version`, `marketing_consent`, `marketing_consent_at`, `withdrawal_token_hash`, `withdrawal_token_created_at`, `withdrawn_at`, `created_at`, `updated_at`, `approved_at`.

Estados: `pending`, `approved`, `rejected`, `withdrawn`.

## 4. Inventario de Storage actual

### `map-assets`

Bucket publico para TopoJSON de mapas internos. Lo usa el subsistema de mapas:

- `countryMapAssets.service.ts` obtiene URL publica con `supabase.storage.from(asset.storageBucket).getPublicUrl(asset.storagePath)`.
- `scripts/process-country-map-queue.ts` sube assets generados con `SUPABASE_SERVICE_ROLE_KEY`.

Decision recomendada: conservar como Storage tecnico independiente de `image_assets`.

### `traveler-adventure-photos`

Bucket privado reservado para fotos de aventuras de viajeros. La migracion `003` lo crea como privado y sin lectura/escritura publica directa.

Decision recomendada: conservar como base futura para `CommunityPhoto`, sin abrirlo publicamente hasta tener Edge Function, permisos, moderacion, creditos y retirada.

## 5. Inventario de Edge Functions actuales

### `request-country-map`

Edge Function para solicitar generacion de mapas internos. Usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en backend. Escribe o actualiza `country_map_assets` y gestiona estados `queued`, `generating`, `ready` y `failed` de forma segura, sin exponer service role al frontend.

Decision recomendada: no tocar dentro de la migracion editorial.

### `withdraw-traveler-adventure`

Edge Function para retirar aventuras pendientes mediante token privado. Calcula SHA-256 del token, busca `withdrawal_token_hash` y marca `status = withdrawn` solo si la aventura sigue `pending`.

Decision recomendada: conservar como parte del flujo comunitario vivo.

## 6. Correspondencia legacy -> futuro

| Nombre actual | Uso actual | Servicio/componente consumidor | Entidad futura equivalente | Decision | Riesgo de tocarla | Prioridad |
|---|---|---|---|---|---|---|
| `countries` | Paises legacy para navegacion y datos base | `supabaseTravelData.source.ts`, `travelData.service.ts`, paginas via `TravelDataSource` | `Country` | adaptar | Alto: puede romper Home, CountryPage y cualquier modo `VITE_TRAVEL_DATA_SOURCE=supabase` | Alta |
| `cities` | Ciudades o zonas simples por pais | `supabaseTravelData.source.ts`, `travelData.service.ts`, City/Country flows legacy | `Zone` | migrar por capas | Alto: hoy representa contenido visible y no cubre regiones/provincias flexibles | Alta |
| `destinations` | Lugares o atracciones dentro de una ciudad | `supabaseTravelData.source.ts`, `travelData.service.ts`, AdventurePage legacy | `Place` | migrar por capas | Medio/alto: cambiarlo sin puente rompe lugares publicados | Media |
| `destination_sources` | Fuentes de destinos publicados | RLS existe; carga en codigo marcada como TODO | sources de `Place` o `EditorialContent` | adaptar | Medio: poco usado en UI, pero relevante para trazabilidad editorial | Media |
| `country_map_assets` | Estado, Storage y demanda parcial de mapas internos | `countryMapAssets.service.ts`, `CountryPage`, Edge Function, worker | Subsistema tecnico de mapas + senal parcial de demanda | conservar / no tocar | Muy alto: mezcla frontend, Storage, worker y Edge Function | Alta |
| `traveler_adventures` | Aventuras comunitarias con moderacion, privacidad y retirada | `adventures.service.ts`, `CountryZonePage`, `WithdrawAdventurePage`, Edge Function | `Adventure` | conservar y adaptar mas adelante | Alto: contiene datos privados y RLS sensible | Alta |
| `map-assets` | Storage publico de TopoJSON | `countryMapAssets.service.ts`, worker | Storage tecnico de mapas | conservar / no tocar | Muy alto: romperia mapas remotos listos | Alta |
| `traveler-adventure-photos` | Storage privado reservado a fotos comunitarias | Futuro backend/Edge Function de fotos | `CommunityPhoto` Storage | conservar | Alto: permisos y privacidad sensibles | Media |

## 7. Campos faltantes frente al modelo futuro

### En `countries`

Faltan o estan incompletos:

- `iso_alpha2`: hoy `supabaseTravelData.source.ts` lo deriva del slug como fallback.
- `iso_alpha3`: hoy se deriva del slug como fallback.
- `un_m49`: no existe; la fuente usa `000`.
- `hero_image_id`.
- SEO: `seo_title`, `seo_description`, `canonical_slug`.
- `published_at`.
- `review_state`.
- `summary` separado de `description_es` si se decide normalizar.
- Relacion formal con `image_assets`.
- Relacion formal con `editorial_contents`.

### En `cities`

Faltan o estan incompletos:

- Relacion flexible `Zone`: `type`, `parent_zone_id`, `map_name`, `sort_order`.
- `hero_image_id`.
- SEO.
- `published_at`.
- `review_state`.
- Separacion editorial: hoy `adventure_content_es` y `student_content_es` viven en la tabla.
- Relacion formal con `places`, `routes`, `plans`, `image_assets` y `editorial_contents`.

### En `destinations`

Faltan o estan incompletos:

- Modelo `Place` con `zone_id` futuro en vez de depender solo de `city_id`.
- `hero_image_id`.
- `official_url`.
- SEO.
- `published_at`.
- `review_state`.
- Relacion con `routes` y `plans`.
- Separacion editorial: hoy `adventure_content_es`, `student_content_es` y `practical_tip_es` viven en la tabla.

### Tablas futuras no existentes

No existen aun:

- `zones`.
- `places`.
- `routes`.
- `plans`.
- `editorial_contents`.
- `image_assets`.
- `community_photos`.
- `demand_signals`.
- `static_pages`.

## 8. Decisiones recomendadas

- Conservar `country_map_assets` como subsistema tecnico de mapas.
- Conservar `traveler_adventures` como base comunitaria viva.
- No tocar mapas todavia: ni tabla, ni Storage, ni worker, ni Edge Function.
- No migrar todo de golpe.
- Crear nuevas tablas en paralelo cuando toque, especialmente `editorial_contents`, `image_assets`, `static_pages` y quiza `zones`.
- Usar `cities` y `destinations` como legacy temporal mientras existan paginas o contenidos que dependan de ellos.
- Crear una capa puente antes de migrar: repositorios/fachadas que devuelvan `CountryScreenData` y `ZoneScreenData` desde mock, legacy Supabase o modelo futuro.
- Mantener fallback premium cuando falte contenido publicado, imagen o relacion nueva.
- No exponer campos privados de comunidad (`author_email`, `withdrawal_token_hash`, `moderation_notes`) en lecturas publicas.

## 9. Estados legacy vs estados futuros

### Estados legacy actuales

- `active`: visible en tablas legacy como `countries` y `cities`.
- `comingSoon`: no es contenido editorial publicado; representa preparacion o demanda futura.
- `disabled`: interno/no visible.
- `published`: visible en `destinations`.
- `draft`: borrador de `destinations`, no visible.
- `pending`: aventura comunitaria enviada, no visible publicamente.
- `approved`: aventura comunitaria aprobada, visible.
- `rejected`: aventura comunitaria rechazada, no visible.
- `withdrawn`: aventura comunitaria retirada por el usuario antes de revision.

### Estados futuros recomendados

- `draft`: creado, no visible.
- `review`: pendiente de revision editorial, factual, legal o permisos.
- `published`: aprobado y visible.
- `archived`: retirado de la vista publica, conservado por trazabilidad.

### Convivencia temporal recomendada

Durante la transicion, los estados legacy deben convivir con los futuros mediante una capa de lectura, no mediante cambios bruscos en base de datos.

Mapeo recomendado para lectura publica:

| Legacy | Semantica temporal | Futuro aproximado |
|---|---|---|
| `active` | Entidad visible en legacy | `published` |
| `comingSoon` | Preparacion/demanda, no contenido publicado | estado publico de fallback, no `published` |
| `disabled` | Interno/no visible | `archived` o no publico |
| `published` | Contenido visible | `published` |
| `draft` | Borrador interno | `draft` |
| `pending` | Comunidad pendiente | `review` comunitario |
| `approved` | Comunidad visible | `published` comunitario |
| `rejected` | Comunidad descartada | `archived` o rechazado interno |
| `withdrawn` | Comunidad retirada | `archived` con trazabilidad |

Regla clave: Trawel debe mostrar solo contenido equivalente a `published` y usar fallback premium cuando haya entidad sin contenido publicado.

## 10. Plan de transicion recomendado

### Fase A: documentar y proteger

- Documentar este mapping.
- Congelar sistemas vivos antes de cambios estructurales.
- No tocar mapas/comunidad.
- No modificar RLS, Storage ni Edge Functions sin bloque especifico.

### Fase B: crear repositorios puente

- Crear repositorios/fachadas que puedan leer desde local/mock, legacy Supabase o futuro Supabase.
- Conectar la fachada data-driven local/legacy sin cambiar visualmente paginas.
- Mantener `cities` y `destinations` como fuente temporal mientras se normalizan datos.

### Fase C: anadir tablas nuevas en paralelo

Cuando el mapping este aprobado, crear nuevas tablas en paralelo, no sustituyendo de golpe:

- `editorial_contents`.
- `image_assets`.
- `static_pages`.
- quiza `zones` si se decide separar ya de `cities`.

### Fase D: migrar por capas

- Migrar `Country` por campos faltantes y compatibilidad con `countries`.
- Migrar `Zone` desde `cities` o nueva `zones` segun decision.
- Extraer `EditorialContent` de columnas legacy y archivos TypeScript.
- Asociar heroes e imagenes mediante `image_assets`.

### Fase E: conectar Investighost

- Permitir que Investighost cree, revise y publique datos siguiendo contratos.
- Mantener Trawel como lector publico de contenido aprobado.
- Alimentar demanda editorial con `demand_signals` cuando exista.

## 11. Checklist antes de escribir migraciones reales

- [ ] Mapping aprobado.
- [ ] Tablas vivas protegidas.
- [ ] Consumidores actuales identificados.
- [ ] RLS revisado.
- [ ] Storage revisado.
- [ ] Edge Functions revisadas.
- [ ] Fallback premium garantizado.
- [ ] Servicios legacy identificados.
- [ ] Plan de rollback claro.
- [ ] Estrategia de convivencia de estados definida.
- [ ] Orden de migracion por fases aprobado.

---

*Documento base v1.0 - Mapeo Supabase legacy a modelo futuro de Trawel*
