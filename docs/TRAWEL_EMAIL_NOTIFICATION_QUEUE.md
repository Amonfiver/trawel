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

`protected-public-submit` no envia emails directamente. Solo crea cola.

Desde el bloque 102, `process-email-notifications` puede procesar la cola con Hostinger SMTP si todos los secrets estan configurados. Por seguridad, `EMAIL_DRY_RUN` esta activo por defecto salvo que se configure exactamente como `false`.

Si falta algun secret obligatorio, responde:

```json
{
  "ok": false,
  "reason": "email_provider_not_configured"
}
```

En dry-run no envia emails ni cambia estados; solo informa que filas procesaria.

En envio real, procesa un lote pequeno (`limit` por defecto 5, maximo 10):

- Lee `status='pending'`.
- Respeta `scheduled_for <= now` o `scheduled_for is null`.
- Marca envio correcto como `sent`.
- Marca fallo como `failed` con `error_message` seguro.
- Usa `provider='hostinger_smtp'`.

## Seguridad

- No hay SELECT publico.
- No hay INSERT/UPDATE/DELETE publico desde `anon` ni `authenticated`.
- La Edge Function usa `service_role` solo en backend para insertar.
- No guardar API keys, SMTP passwords ni secrets en `metadata`.
- No usar la cola como newsletter.

## Integracion Futura

Investighost debe poder revisar `email_notification_queue` junto a `user_messages`, aprobar cambios de estado y activar avisos solo cuando exista proveedor transaccional elegido y configurado con secrets seguros en Supabase.

## Secrets SMTP Hostinger

Configurar secrets en Supabase:

```bash
npx supabase secrets set SMTP_HOST="smtp.hostinger.com" --project-ref pjqisqzxajdfkimtrcby
npx supabase secrets set SMTP_PORT="465" --project-ref pjqisqzxajdfkimtrcby
npx supabase secrets set SMTP_SECURE="true" --project-ref pjqisqzxajdfkimtrcby
npx supabase secrets set SMTP_USER="contacto@trawel.net" --project-ref pjqisqzxajdfkimtrcby
npx supabase secrets set SMTP_PASSWORD="PEGAR_PASSWORD_DEL_BUZON_HOSTINGER" --project-ref pjqisqzxajdfkimtrcby
npx supabase secrets set SMTP_FROM="contacto@trawel.net" --project-ref pjqisqzxajdfkimtrcby
npx supabase secrets set SMTP_REPLY_TO="contacto@trawel.net" --project-ref pjqisqzxajdfkimtrcby
npx supabase secrets set EMAIL_DRY_RUN="true" --project-ref pjqisqzxajdfkimtrcby
```

Fallback documentado si `465` falla:

```bash
npx supabase secrets set SMTP_PORT="587" --project-ref pjqisqzxajdfkimtrcby
npx supabase secrets set SMTP_SECURE="false" --project-ref pjqisqzxajdfkimtrcby
```

Para activar envio real despues de probar:

```bash
npx supabase secrets set EMAIL_DRY_RUN="false" --project-ref pjqisqzxajdfkimtrcby
```

## Operacion

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

Invocar dry-run con lote pequeno:

```bash
npx supabase functions invoke process-email-notifications --project-ref pjqisqzxajdfkimtrcby --body '{"limit":1}'
```

Cuando `EMAIL_DRY_RUN=false`, el mismo comando intentara envio real para filas pendientes.
