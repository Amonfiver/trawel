# Trawel Turnstile Anti-Abuse Implementation

Implementacion del Bloque 81 para proteger formularios publicos con Cloudflare Turnstile.

## Alcance

Formularios protegidos:

- `/contacto`.
- `/compartir`.
- Reportes publicos de `TrustPage`.

## Variables

Frontend:

- `VITE_TURNSTILE_SITE_KEY`.
- Vive en `.env.local` para desarrollo.
- Puede ir al hosting porque es publica.

Backend Supabase Edge Function:

- `TURNSTILE_SECRET_KEY`.
- Vive en Supabase secrets.
- Nunca debe escribirse en frontend ni en Git.

## Edge Function

Funcion:

```text
supabase/functions/protected-public-submit
```

Responsabilidades:

- Recibir payload del formulario.
- Recibir token Turnstile.
- Validar token contra Cloudflare Siteverify.
- Rechazar si la validacion falla.
- Insertar en `user_messages` o `content_reports` solo si la validacion pasa.

La funcion usa `SUPABASE_SERVICE_ROLE_KEY` solo dentro de Supabase Edge Functions.

## Frontend

El frontend:

- Carga Turnstile con `VITE_TURNSTILE_SITE_KEY`.
- Exige token antes de enviar.
- Invoca `protected-public-submit`.
- Ya no inserta directamente en `user_messages` ni `content_reports` desde los formularios protegidos.

## Seguridad

- No hay `service_role` en frontend.
- No se abre ningun bucket privado.
- No se guarda `TURNSTILE_SECRET_KEY` en el repositorio.
- No se hace verificacion falsa solo en React.
- La validacion real ocurre en backend contra Siteverify.

## Validacion

- `npm run build` debe pasar.
- Sin token Turnstile, el frontend no permite enviar.
- Con token Turnstile valido, la Edge Function debe validar en Cloudflare y crear la fila en Supabase.

## Pendiente Operativo

Para entornos online o remotos:

- Confirmar que `VITE_TURNSTILE_SITE_KEY` esta configurada en el hosting.
- Confirmar que `TURNSTILE_SECRET_KEY` esta configurada en Supabase secrets.
- Desplegar o actualizar `protected-public-submit` en Supabase si no estuviera desplegada.
- Probar envio real y borrar filas test.
