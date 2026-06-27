# Trawel User Content Queue Contract

Contrato minimo futuro para recibir contenido generado por usuarios en Supabase sin publicarlo directamente.

Este documento no es una migracion, no crea tablas y no conecta formularios. Define el acuerdo previo para que Trawel inserte en colas de revision e Investighost, en el futuro, modere, apruebe, rechace o publique.

## Principios

- Trawel solo inserta entradas en cola.
- Ningun mensaje, foto, sugerencia o reporte se publica directamente desde Trawel.
- Investighost sera el responsable de revisar y cambiar estados.
- La lectura publica nunca debe mostrar contenido pendiente, rechazado, archivado o con incidencia de derechos.
- RLS debe permitir inserts controlados desde el publico y lectura publica solo de contenido publicado.
- Las actualizaciones de estado, notas internas y referencias publicadas deben requerir rol interno o service role.

## user_messages

Cola para contacto, sugerencias, colaboracion, reportes generales y solicitudes privadas.

### Campos minimos

| Campo | Uso |
|-------|-----|
| `id` | Identificador unico. |
| `type` | Tipo de mensaje: contacto, sugerencia, colaboracion, reporte o solicitud privada. |
| `name` | Nombre declarado por la persona. |
| `email` | Email de contacto. |
| `subject` | Asunto breve. |
| `message` | Mensaje completo. |
| `country_slug` | Pais relacionado, si aplica. |
| `zone_slug` | Zona relacionada, si aplica. |
| `related_entity_type` | Tipo de entidad relacionada, si aplica. |
| `related_entity_slug` | Slug de entidad relacionada, si aplica. |
| `status` | Estado de revision. |
| `priority` | Prioridad operativa o marca de atencion. |
| `source_page` | Ruta o contexto desde donde se envio. |
| `user_agent` | Opcional; ayuda diagnostica y antifraude. |
| `created_at` | Fecha de entrada en cola. |
| `reviewed_at` | Fecha de revision. |
| `reviewed_by` | Usuario/rol interno que reviso. |
| `internal_notes` | Notas privadas de moderacion. |

### Estados permitidos

- `pending_review`
- `read`
- `responded`
- `archived`
- `rejected`
- `priority`

## user_photo_submissions

Cola para fotos enviadas por usuarios antes de cualquier uso publico.

### Campos minimos

| Campo | Uso |
|-------|-----|
| `id` | Identificador unico. |
| `author_name` | Nombre de la persona autora/remitente. |
| `author_email` | Email de contacto. |
| `country_slug` | Pais relacionado. |
| `zone_slug` | Zona relacionada, si aplica. |
| `title` | Titulo propuesto. |
| `description` | Descripcion o contexto de la foto. |
| `image_url` o `storage_path` | Referencia a la imagen enviada. |
| `credit_name` | Credito publico deseado si se publica. |
| `rights_confirmed` | Confirmacion de derechos de uso. |
| `consent_confirmed` | Confirmacion de consentimiento aplicable. |
| `status` | Estado de revision/publicacion. |
| `rejection_reason` | Motivo privado o semipublico de rechazo. |
| `created_at` | Fecha de envio. |
| `reviewed_at` | Fecha de revision. |
| `reviewed_by` | Usuario/rol interno que reviso. |
| `published_image_asset_id` | Referencia al asset publicado si Investighost lo aprueba. |

### Estados permitidos

- `submitted`
- `pending_review`
- `approved`
- `rejected`
- `published`
- `archived`
- `rights_issue`
- `removal_requested`

## content_reports

Cola para reportes de errores, abuso, derechos de imagen o solicitudes de retirada.

### Campos minimos

| Campo | Uso |
|-------|-----|
| `id` | Identificador unico. |
| `report_type` | Tipo de reporte: error, abuso, derechos de imagen o retirada. |
| `reporter_name` | Nombre declarado por quien reporta. |
| `reporter_email` | Email de contacto. |
| `target_entity_type` | Tipo de entidad reportada. |
| `target_entity_slug` | Slug de entidad reportada. |
| `message` | Detalle del reporte. |
| `status` | Estado de gestion. |
| `created_at` | Fecha de entrada. |
| `resolved_at` | Fecha de resolucion. |
| `internal_notes` | Notas privadas de gestion. |

### Estados minimos recomendados

- `pending_review`
- `in_review`
- `resolved`
- `rejected`
- `archived`
- `rights_issue`
- `removal_requested`

## RLS y publicacion

- Inserts publicos: permitidos solo con campos esperados, validaciones de longitud, consentimiento cuando aplique y estado inicial controlado.
- Lectura publica de colas: no permitida.
- Lectura publica de contenido derivado: solo desde tablas publicables y solo cuando `status = 'published'`.
- Estados `pending_review`, `submitted`, `read`, `responded`, `approved`, `rejected`, `archived`, `rights_issue` y `removal_requested` no deben aparecer en consultas publicas como contenido visible.
- Cambios de estado, `reviewed_at`, `reviewed_by`, `internal_notes`, `rejection_reason`, `resolved_at` y vinculaciones a assets publicados deben quedar reservados a Investighost o backend interno.

## Fuera de alcance de este bloque

- No crear migraciones.
- No tocar seeds.
- No conectar formularios.
- No tocar `src`.
- No ejecutar SQL contra Supabase.
