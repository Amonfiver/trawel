# Trawel Email Notification Queue

Documento creado en el bloque 92 para definir la cola interna de emails transaccionales.

## Objetivo

`email_notification_queue` prepara avisos transaccionales sin enviar emails reales. La tabla permite a Investighost o a una Edge Function futura procesar comunicaciones relacionadas con aportaciones publicas.

## Tabla

Migracion: `supabase/migrations/014_create_email_notification_queue.sql`

Campos principales:

- `notification_type`: tipo de aviso.
- `recipient_email` y `recipient_name`: destinatario.
- `related_table` y `related_id`: fila relacionada, por ejemplo `user_messages`.
- `status`: estado interno de cola.
- `subject`, `body_text`, `body_html`: contenido preparado.
- `provider` y `provider_message_id`: se rellenaran solo cuando exista proveedor real.
- `metadata`: contexto no secreto.

## Estados

- `pending`: creado y pendiente de procesar.
- `queued`: tomado por un procesador futuro.
- `sent`: enviado por proveedor real.
- `failed`: intento fallido.
- `cancelled`: cancelado por decision interna.
- `skipped`: omitido por politica o falta de consentimiento.

## Tipos De Notificacion

- `submission_copy`: copia/confirmacion de propuesta recibida.
- `review_status`: actualizacion de revision.
- `publication_notice`: aviso de publicacion.
- `rejection_notice`: aviso cuidadoso de no publicacion, si la politica lo permite.
- `admin_alert`: aviso interno.

## Comportamiento Actual

Cuando `/compartir` envia una propuesta con `metadata.email_followup_consent = true`, `protected-public-submit` inserta una fila `pending` de tipo `submission_copy`.

Si no hay consentimiento, no se crea notificacion.

La cola no envia emails, no llama APIs externas y no marca filas como `sent`.

Desde el bloque 94 existe la Edge Function `process-email-notifications` como stub seguro. Si `EMAIL_PROVIDER` falta o vale `disabled`, responde:

```json
{
  "ok": false,
  "reason": "email_provider_not_configured"
}
```

Aunque `EMAIL_PROVIDER` tuviera otro valor, el stub responde `email_processor_stub_only`: no lee la cola, no consume APIs externas y no actualiza estados.

## Seguridad

- No hay SELECT publico.
- No hay INSERT/UPDATE/DELETE publico desde `anon` ni `authenticated`.
- La Edge Function usa `service_role` solo en backend para insertar.
- No guardar API keys, SMTP passwords ni secrets en `metadata`.
- No usar la cola como newsletter.

## Integracion Futura

Investighost debe poder revisar `email_notification_queue` junto a `user_messages`, aprobar cambios de estado y activar avisos solo cuando exista proveedor transaccional elegido y configurado con secrets seguros en Supabase.

## Pendientes Operativos

Aplicar migracion:

```bash
npx supabase db push --linked
```

Si se despliega la Edge Function ajustada:

```bash
npx supabase functions deploy protected-public-submit
```

Si se despliega el stub de procesamiento:

```bash
npx supabase functions deploy process-email-notifications
```
