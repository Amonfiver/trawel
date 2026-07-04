# Trawel Anti-Abuse Decision

Decision tecnica recomendada para proteger formularios publicos y futura subida real de fotos.

No implementa captcha, no crea cuentas externas y no introduce credenciales.

## Recomendacion Inicial

Metodo recomendado:

- Cloudflare Turnstile para captcha amable.
- Verificacion del token en backend o Supabase Edge Function.
- Rate limit por IP/email.
- Logs de abuso y errores.
- Activacion antes de subida real de fotos.

## Motivo

Turnstile o un sistema equivalente permite reducir bots sin degradar demasiado la experiencia de usuarios reales.

La verificacion debe ocurrir fuera del frontend porque el navegador no puede custodiar secretos ni decidir por si solo si un token es valido.

## Reglas De Implementacion

- No bloquear en exceso a usuarios reales.
- No guardar secretos como variables `VITE_`.
- No verificar tokens solo en el cliente.
- No enviar formularios sensibles si la verificacion backend falla.
- No activar subida real de fotos sin esta capa o equivalente.

## Flujo Recomendado

```text
usuario completa formulario
↓
Turnstile genera token publico
↓
frontend envia token junto al formulario
↓
Edge Function/backend verifica token con secreto
↓
backend aplica rate limit
↓
si pasa, inserta en cola privada
```

## Aplicacion Inicial

Proteger:

- `/contacto`.
- `/compartir`.
- Reportes de contenido.

Despues, proteger:

- Subida real de fotos.
- Registro de `user_photo_submissions`.

## Decision

Decision tecnica: recomendada.

Decision operativa: pendiente de credenciales externas y alta/configuracion por parte del usuario.

No implementar todavia si requiere claves que no existen.

## Pendiente Para Implementar

- Crear o elegir cuenta/proveedor antiabuso.
- Obtener site key publica.
- Obtener secret key privada.
- Guardar secret key solo en backend/Edge Function.
- Definir limites por IP/email.
- Implementar verificacion en backend.
- Probar formularios reales.
- Mantener fallback UX claro si el proveedor falla.
