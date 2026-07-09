# Trawel Cost Guardrails

Fecha: 2026-07-09.
Bloque: 85.

## Principio

Ningun usuario debe poder generar coste infinito en Trawel.

Los formularios publicos pueden recibir texto y propuestas, pero todo debe pasar por limites, flags de apagado rapido, colas privadas y politicas de caducidad. Nada enviado por usuarios se publica directamente.

## Flags Globales

La migracion `011_create_cost_guardrails.sql` crea `system_flags` como tabla de configuracion operativa.

Flags iniciales:

| Flag | Valor inicial | Publico | Uso |
|------|---------------|---------|-----|
| `public_contact_enabled` | `true` | Si | Apagar/encender contacto publico. |
| `public_share_enabled` | `true` | Si | Apagar/encender compartir. |
| `public_reports_enabled` | `true` | Si | Apagar/encender reportes publicos. |
| `photo_uploads_enabled` | `false` | Si | Mantener subida real de fotos desactivada. |
| `max_photos_per_submission` | `3` | Si | Limite futuro por envio. |
| `max_photo_upload_mb` | `5` | Si | Limite futuro por archivo antes de procesar. |
| `max_processed_photo_mb` | `1.5` | No | Limite interno recomendado para WebP final. |
| `max_pending_photo_days` | `30` | Si | Caducidad de fotos pendientes futuras. |
| `max_daily_submissions_per_email` | `10` | No | Limite diario de envios por email hash. |
| `max_hourly_submissions_per_email` | `3` | No | Limite horario de envios por email hash. |
| `max_daily_photo_uploads_per_email` | `9` | No | Limite diario de fotos futuras por email hash. |
| `monthly_pending_storage_soft_limit_mb` | `2048` | No | Limite blando mensual para storage pendiente. |
| `pending_user_message_retention_days` | `90` | No | Revision maxima recomendada para pendientes. |
| `rejected_user_message_retention_days` | `30` | No | Conservacion maxima de rechazados/spam. |

Los flags publicos pueden ser leidos por el frontend. Los flags privados son para Edge Functions, backend o SQL interno.

## Fotos Reales

Las fotos reales siguen desactivadas:

- `photo_uploads_enabled=false`.
- `/compartir` puede estandarizar imagenes localmente.
- No se suben archivos a Storage.
- `photo_upload_pending=true` solo indica que la subida real queda pendiente de flujo futuro.

Cuando se active una subida real, debe existir una Edge Function con limites cerrados antes de tocar Storage.

## Limites De Coste

Limites previstos:

- Maximo 3 fotos por envio.
- Maximo 5 MB por archivo antes de procesar.
- Maximo 1.5 MB por foto procesada.
- Maximo 9 fotos diarias por email hash.
- Maximo 3 envios publicos por email hash cada hora.
- Maximo 10 envios publicos por email hash cada dia.
- Limite blando mensual de 2048 MB para storage pendiente.

Si se supera una cuota de fotos, la subida de fotos debe desactivarse o rechazarse, pero el texto puede seguir entrando si los formularios de texto estan habilitados y dentro de limites.

## Eventos De Uso

`storage_usage_events` registra eventos internos relacionados con Storage y fotos:

- Tipo de evento.
- Bucket y ruta si aplica.
- Tamano en bytes.
- Hash de email o IP si aplica.
- Metadata segura.

No debe guardar emails en claro, tokens, claves ni datos sensibles innecesarios.

## Limpieza Y Caducidad

Las colas pendientes no son eternas:

- Mensajes pendientes: revisar en un maximo de 90 dias.
- Mensajes rechazados/spam: borrar en un maximo de 30 dias.
- Fotos pendientes futuras: borrar a los 30 dias.
- Fotos rechazadas: borrar lo antes posible.

`moderation_cleanup_queue` prepara una cola interna para programar limpieza. No borra nada por si sola.

## Storage

Reglas de Storage:

- Pendientes en bucket privado.
- Nada de buckets publicos para contenido pendiente.
- Nada de lectura publica de originales.
- Nada de `service_role` en frontend.
- Nada de subida directa anonima sin Edge Function.

Para fotos publicas masivas a futuro, evaluar Cloudflare R2 u otro storage optimizado para distribucion publica despues de moderacion.

## Seguridad

RLS inicial:

- `system_flags`: lectura publica solo de flags `is_public=true`.
- `storage_usage_events`: sin lectura ni escritura publica.
- `moderation_cleanup_queue`: sin lectura ni escritura publica.

La gestion interna debe hacerse desde Supabase SQL Editor, Edge Functions o Investighost con permisos seguros.

## Estado Actual

- Contacto publico: habilitado.
- Compartir publico: habilitado.
- Reportes publicos: habilitados.
- Fotos reales: desactivadas.
- Buckets privados: no abiertos.
- Publicacion directa de usuarios: no existe.
