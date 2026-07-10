# Trawel Transactional Email Provider Decision

Documento del bloque 93 para decidir proveedor de email transaccional sin activar gasto, secrets ni envio real.

## Estado Actual

- `contacto@trawel.net` existe como identidad de marca en Hostinger.
- Trawel ya tiene `email_notification_queue` para preparar notificaciones internas.
- No hay proveedor transaccional activo.
- No hay API key, SMTP password ni secret de email en el repositorio.
- No se envian emails reales desde frontend ni Edge Function.

## Opcion 1: Hostinger SMTP

Pros:

- Ya existe email de dominio.
- Mantiene la identidad `@trawel.net`.
- Puede ser suficiente para volumen bajo si los limites del plan lo permiten.

Contras:

- Supabase Edge Functions corren en Deno y SMTP puede requerir libreria compatible o un servicio intermedio.
- Hay que confirmar limites, reputacion, SPF, DKIM, DMARC y politicas antiabuso.
- Requiere credenciales SMTP, que deben vivir solo como secrets de backend.

Secrets futuros posibles:

- `EMAIL_PROVIDER=smtp`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`

## Opcion 2: Resend O Brevo

Pros:

- API HTTP sencilla para Edge Function.
- Mejor encaje tecnico con Deno que SMTP directo.
- Paneles pensados para email transaccional, logs y errores.

Contras:

- Servicio externo.
- Revisar free tier, limites, coste, reputacion y condiciones vigentes antes de activar.
- Puede requerir verificar dominio y configurar SPF/DKIM/DMARC.

Secrets futuros posibles:

- `EMAIL_PROVIDER=resend` o `EMAIL_PROVIDER=brevo`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `EMAIL_API_KEY`

## Opcion 3: Otro Proveedor Transaccional

Podria usarse Mailgun, Postmark u otro proveedor si Octavio ya tiene preferencia o cuenta existente. La condicion tecnica es la misma: API segura desde backend, secrets en Supabase y nunca en frontend.

## Decision Recomendada Ahora

Mantener la cola interna y no enviar emails reales hasta elegir proveedor.

Cuando se elija proveedor:

- Guardar secrets solo en Supabase.
- No crear variables `VITE_` para claves.
- No meter secrets en Git.
- Probar primero con una fila controlada de `email_notification_queue`.
- Registrar errores en la cola antes de marcar cualquier fila como `sent`.

Variables seguras futuras:

- `EMAIL_PROVIDER`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `EMAIL_API_KEY` o `SMTP_*` segun proveedor.

## Regla De Activacion

La activacion requiere decision explicita de Octavio sobre proveedor y coste. Hasta entonces, `email_notification_queue` es solo cola interna y cualquier procesador debe permanecer desactivado.

## Stub Seguro

Desde el bloque 94 existe `process-email-notifications` como Edge Function de preparacion. Su comportamiento actual es intencionadamente conservador:

- Lee `EMAIL_PROVIDER`.
- Si falta o vale `disabled`, responde `email_provider_not_configured`.
- No lee ni procesa `email_notification_queue`.
- No envia emails reales.
- No marca notificaciones como `sent`.

Para activar envio real en el futuro haran falta proveedor elegido, secrets en Supabase y una implementacion nueva revisada.
