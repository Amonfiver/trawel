# Modelo Supabase futuro de Trawel

## 1. Proposito del modelo Supabase

Este documento define el diseno tecnico inicial del modelo Supabase futuro de Trawel, basado en `docs/TRAWEL_DATA_CONTRACTS.md`.

Su objetivo es preparar a Trawel para funcionar como frontend data-driven alimentado por Investighost, sin seguir ampliando contenido editorial dentro de componentes React, arrays locales o archivos TypeScript pensados para demo.

Este documento no es una migracion, no contiene SQL ejecutable y no modifica Supabase real. Es una referencia previa para validar nombres de tablas, relaciones, estados, visibilidad publica, Storage y Row Level Security antes de implementar migraciones.

## 2. Principio rector

**Supabase almacena, Investighost alimenta, Trawel renderiza.**

Implicaciones:

- Supabase sera la fuente de verdad para contenido publicado, borradores, imagenes, estados y senales.
- Investighost creara y revisara datos siguiendo contratos estables.
- Trawel solo leera contenido publico aprobado y lo mostrara mediante plantillas genericas.
- El frontend no debe contener contenido editorial masivo ni reglas particulares por pais/zona.

## 3. Lista inicial de tablas recomendadas

- `countries`
- `zones`
- `places`
- `routes`
- `plans`
- `adventures`
- `editorial_contents`
- `image_assets`
- `community_photos`
- `demand_signals`
- `static_pages`

## 4. Tablas propuestas

### `countries`

**Proposito:** almacenar paises navegables o preparables por Trawel.

**Campos recomendados:**

- `id`
- `slug`
- `name`
- `display_name`
- `iso_alpha2`
- `iso_alpha3`
- `un_m49`
- `continent`
- `capital`
- `summary`
- `featured`
- `sort_order`
- `hero_image_id`
- `status`
- `review_state`

**Relaciones:**

- Uno a muchos con `zones`.
- Uno a muchos con `places`.
- Uno a muchos con `routes`.
- Uno a muchos con `plans`.
- Polimorfica con `editorial_contents`.
- Polimorfica con `image_assets`.
- Puede recibir `demand_signals` por slug.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived`.
- `review_state`: revision interna opcional.

**Campos SEO:**

- `seo_title`
- `seo_description`
- `canonical_slug`

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 1.

### `zones`

**Proposito:** almacenar regiones, provincias, ciudades, islas, areas o zonas personalizadas dentro de un pais.

**Campos recomendados:**

- `id`
- `country_id`
- `parent_zone_id`
- `slug`
- `name`
- `type`
- `map_name`
- `summary`
- `coordinates`
- `sort_order`
- `hero_image_id`
- `status`
- `review_state`

**Relaciones:**

- Muchas `zones` pertenecen a un `country`.
- Una `zone` puede depender de otra `zone`.
- Una `zone` tiene muchos `places`.
- Una `zone` puede estar en muchas `routes` y `plans`.
- Una `zone` puede tener muchas `adventures`.
- Polimorfica con `editorial_contents`.
- Polimorfica con `image_assets`.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived`.
- `review_state`: revision interna opcional.

**Campos SEO:**

- `seo_title`
- `seo_description`
- `canonical_slug`

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 1.

### `places`

**Proposito:** almacenar lugares concretos visitables: monumentos, museos, playas, barrios, templos, parques, miradores o puntos de interes.

**Campos recomendados:**

- `id`
- `country_id`
- `zone_id`
- `slug`
- `name`
- `type`
- `summary`
- `coordinates`
- `estimated_visit_time`
- `price`
- `opening_hours`
- `official_url`
- `tags`
- `hero_image_id`
- `status`
- `review_state`

**Relaciones:**

- Muchos `places` pertenecen a un `country`.
- Muchos `places` pertenecen a una `zone`.
- Muchos `places` pueden aparecer en muchas `routes`.
- Muchos `places` pueden aparecer en muchos `plans`.
- Polimorfica con `editorial_contents`.
- Polimorfica con `image_assets`.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived`.
- `review_state`: revision factual, editorial o legal.

**Campos SEO:**

- `seo_title`
- `seo_description`
- `canonical_slug`

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 2.

### `routes`

**Proposito:** almacenar itinerarios estructurados con duracion, dia a dia, lugares, transporte, intensidad y variantes.

**Campos recomendados:**

- `id`
- `slug`
- `title`
- `country_id`
- `duration_days`
- `duration_label`
- `intensity`
- `traveler_type`
- `transport_mode`
- `day_by_day`
- `transport_tips`
- `variants`
- `best_season`
- `hero_image_id`
- `status`
- `review_state`

**Relaciones:**

- Una `route` pertenece normalmente a un `country`.
- Una `route` puede relacionarse con muchas `zones`.
- Una `route` puede incluir muchos `places`.
- Una `route` puede estar asociada a muchos `plans`.
- Polimorfica con `editorial_contents`.
- Polimorfica con `image_assets`.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived`.
- `review_state`: revision editorial y practica.

**Campos SEO:**

- `seo_title`
- `seo_description`
- `canonical_slug`

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 2.

### `plans`

**Proposito:** almacenar ideas de viaje, planes inspiradores o experiencias empaquetadas para Home, paises, zonas y paginas editoriales.

**Campos recomendados:**

- `id`
- `slug`
- `title`
- `type`
- `country_id`
- `zone_id`
- `route_id`
- `summary`
- `who_for`
- `best_season`
- `duration_label`
- `suggested_route`
- `featured`
- `hero_image_id`
- `status`
- `review_state`

**Relaciones:**

- Un `plan` pertenece a un `country`.
- Puede pertenecer a una `zone`.
- Puede basarse en una `route`.
- Puede relacionarse con muchos `places`.
- Polimorfica con `editorial_contents`.
- Polimorfica con `image_assets`.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived`.
- `review_state`: revision editorial/comercial.

**Campos SEO:**

- `seo_title`
- `seo_description`
- `canonical_slug`

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 2.

### `adventures`

**Proposito:** almacenar historias o experiencias reales enviadas por viajeros, moderadas antes de su publicacion.

**Campos recomendados:**

- `id`
- `country_id`
- `zone_id`
- `place_id`
- `title`
- `story`
- `practical_tips`
- `author_name`
- `author_email`
- `privacy_accepted_at`
- `privacy_version`
- `marketing_consent`
- `marketing_consent_at`
- `withdrawal_token_hash`
- `withdrawal_token_created_at`
- `withdrawn_at`
- `status`
- `review_state`

**Relaciones:**

- Una `adventure` pertenece a un `country`.
- Una `adventure` pertenece a una `zone`.
- Puede relacionarse con un `place`.
- Puede tener muchas `community_photos`.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived` o equivalentes comunitarios futuros.
- Para comunidad puede mantenerse una capa especifica: `pending`, `approved`, `rejected`, `withdrawn`.

**Campos SEO:**

- No prioritarios en fase inicial. Si se publican como paginas indexables, anadir `seo_title`, `seo_description`, `canonical_slug`.

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 3.

### `editorial_contents`

**Proposito:** almacenar textos editoriales por entidad y modo Aventura/Estudiante, separados de la presentacion visual.

**Campos recomendados:**

- `id`
- `entity_type`
- `entity_id`
- `mode`
- `headline`
- `intro`
- `what_makes_special`
- `highlights`
- `suggested_route`
- `practical_tips`
- `sections`
- `sources`
- `status`
- `review_state`

**Relaciones:**

- Relacion polimorfica con `countries`, `zones`, `places`, `routes` y `plans`.
- Puede referenciar `image_assets` desde `sections` si se decide.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived`.
- `review_state`: factual, editorial, legal o permisos.

**Campos SEO:**

- Normalmente la entidad principal gestiona SEO. Puede incluir `seo_notes` si Investighost necesita recomendaciones.

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 1.

### `image_assets`

**Proposito:** almacenar metadatos de imagenes aprobadas y su relacion con entidades, mientras los binarios viven en Supabase Storage u otro storage.

**Campos recomendados:**

- `id`
- `entity_type`
- `entity_id`
- `storage_path`
- `public_url`
- `alt`
- `caption`
- `credit`
- `license`
- `source`
- `usage_type`
- `focal_point`
- `width`
- `height`
- `status`
- `review_state`

**Relaciones:**

- Relacion polimorfica con cualquier entidad editorial.
- Puede ser hero/card/gallery/inline.
- Puede complementarse con `community_photos` para aportes de usuarios.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived`.
- `review_state`: permisos, calidad, credito, moderacion.

**Campos SEO:**

- `alt` es obligatorio para accesibilidad y SEO.
- `caption` y `credit` ayudan a confianza y trazabilidad.

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 1.

### `community_photos`

**Proposito:** almacenar fotos enviadas por usuarios, con permisos, moderacion, credito y posible retirada.

**Campos recomendados:**

- `id`
- `adventure_id`
- `entity_type`
- `entity_id`
- `storage_path`
- `author_name`
- `credit_name`
- `permission_status`
- `moderation_status`
- `license_accepted_at`
- `takedown_token_hash`
- `approved_at`
- `removed_at`
- `status`
- `review_state`

**Relaciones:**

- Puede pertenecer a una `adventure`.
- Puede asociarse a `countries`, `zones`, `places`, `routes` o `plans`.
- Puede transformarse en `image_assets` si se aprueba para uso editorial general.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived`.
- `moderation_status`: pendiente, aprobada, rechazada o retirada.
- `permission_status`: pendiente, aceptado, revocado.

**Campos SEO:**

- No prioritarios. Si una foto pasa a uso editorial, debe tener `alt`, `caption` y `credit` en `image_assets`.

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 3.

### `demand_signals`

**Proposito:** registrar interes de usuarios en paises, zonas, busquedas, mapas o entidades no disponibles para priorizar trabajo editorial.

**Campos recomendados:**

- `id`
- `signal_type`
- `query`
- `normalized_query`
- `country_slug`
- `zone_slug`
- `entity_type`
- `entity_slug`
- `source_page`
- `action`
- `count`
- `last_seen_at`
- `metadata`
- `status`

**Relaciones:**

- Puede apuntar a slugs sin entidad existente.
- Puede relacionarse con entidades existentes mediante `entity_type` y `entity_slug`.
- Puede alimentar colas editoriales de Investighost.

**Campos de estado editorial:**

- `status`: abierto, revisado, convertido, descartado o archivado. Si se unifica con estados globales, mapear a `draft`, `review`, `published`, `archived` solo cuando tenga sentido.

**Campos SEO:**

- No aplica.

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at` normalmente no aplica
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 3.

### `static_pages`

**Proposito:** almacenar paginas estaticas de confianza, legales, contacto, creditos y politica editorial.

**Campos recomendados:**

- `id`
- `slug`
- `type`
- `title`
- `summary`
- `body`
- `version`
- `status`
- `review_state`

**Relaciones:**

- Puede enlazarse desde footer, formularios y navegacion.
- Puede referenciar `image_assets` si alguna pagina necesita medios.

**Campos de estado editorial:**

- `status`: `draft`, `review`, `published`, `archived`.
- `review_state`: legal, editorial o pendiente de aprobacion humana.

**Campos SEO:**

- `seo_title`
- `seo_description`
- `canonical_slug`
- `noindex` opcional para paginas que no deban indexarse.

**Campos de auditoria:**

- `created_at`
- `updated_at`
- `published_at`
- `created_by` opcional
- `updated_by` opcional

**Prioridad:** fase 1.

## 5. Relaciones principales

- `countries` -> `zones`: un pais contiene muchas zonas.
- `zones` -> `places`: una zona contiene muchos lugares.
- `countries` / `zones` / `places` / `routes` / `plans` -> `editorial_contents`: contenido por entidad y modo.
- Cualquier entidad -> `image_assets`: imagenes aprobadas con metadatos.
- `routes` -> `places`: una ruta incluye muchos lugares.
- `plans` -> `places` / `routes` / `zones`: un plan puede agrupar lugares, apoyarse en una ruta o centrarse en una zona.
- `demand_signals` -> slugs o entidades: puede apuntar a algo existente o a demanda aun no modelada.
- `static_pages` -> paginas legales/confianza: contenido independiente enlazado desde el sitio.

Nota: para relaciones muchos-a-muchos como `routes` -> `places` o `plans` -> `places`, el modelo real probablemente necesitara tablas puente. Este documento no las define como SQL todavia; solo deja constancia de la relacion.

## 6. Estados recomendados

- `draft`: creado, no visible publicamente.
- `review`: pendiente de revision editorial, factual, legal o de permisos.
- `published`: aprobado y visible para Trawel.
- `archived`: retirado de la vista publica, conservado por trazabilidad.

Estos estados deben aplicarse de forma coherente a entidades y contenidos. Si una tabla necesita estados comunitarios especificos, deben mapearse a una semantica publica equivalente.

## 7. Reglas de visibilidad publica

- Trawel solo debe mostrar contenido `published`.
- Si falta contenido, Trawel debe usar fallback premium.
- Si una entidad existe pero no esta publicada, no debe romper la navegacion.
- Si un pais o zona es solicitado pero no existe, debe registrarse como demanda futura.
- Las paginas deben poder renderizar estados amables de preparacion sin exponer borradores.
- Los datos privados de comunidad, emails, tokens o moderacion no deben exponerse al cliente publico.

## 8. Consideraciones Supabase

### Row Level Security

- Activar RLS en tablas publicas.
- Permitir lectura publica solo de registros `published` y campos seguros.
- Restringir escritura a Investighost, admin o funciones backend.
- Separar permisos de lectura publica, moderacion y administracion.

### Storage para imagenes

- Guardar binarios en Supabase Storage u otro storage compatible.
- Guardar metadatos, permisos, creditos y relacion de entidad en `image_assets`.
- Evitar que el frontend dependa de rutas locales como solucion final.
- Considerar buckets separados para imagen editorial aprobada y aportes comunitarios pendientes.

### Contenido editorial

- Evitar guardar contenido editorial dentro de componentes React.
- Evitar duplicar estructuras por pais o zona.
- Centralizar textos por modo en `editorial_contents`.
- Trawel debe recibir datos normalizados y renderizarlos con plantillas.

### Seguridad y privacidad

- Emails, tokens, notas de moderacion y datos privados no deben ser publicos.
- Community photos requieren permisos claros, credito y retirada.
- Las Edge Functions pueden encargarse de operaciones sensibles como retirada, moderacion o subida privada.

## 9. Fases recomendadas de implementacion

### Fase 1

- `countries`
- `zones`
- `editorial_contents`
- `image_assets`
- `static_pages`

Objetivo: que Trawel pueda renderizar paises, zonas, contenido editorial, imagenes y paginas de confianza sin hardcodear contenido nuevo.

### Fase 2

- `places`
- `routes`
- `plans`

Objetivo: dar profundidad real a la experiencia editorial y permitir que Investighost cree lugares, itinerarios y planes sin tocar frontend.

### Fase 3

- `community_photos`
- `adventures`
- `demand_signals`

Objetivo: ampliar comunidad, moderacion y senales de demanda para priorizar contenido.

## 10. Checklist antes de crear migraciones reales

- [ ] Contratos revisados.
- [ ] Campos minimos validados.
- [ ] Nombres de tablas aprobados.
- [ ] Relaciones aprobadas.
- [ ] Tablas puente necesarias identificadas.
- [ ] Estrategia de fallback definida.
- [ ] Estrategia de RLS definida.
- [ ] Estrategia de Storage definida.
- [ ] Campos privados y publicos separados.
- [ ] Politica de estados editoriales acordada.
- [ ] Orden de migracion validado.

---

*Documento base v1.0 - Modelo Supabase futuro de Trawel*
