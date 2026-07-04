# Trawel Email Provider Decision

Documento de opciones tecnicas para enviar emails transaccionales de Trawel.

No contrata servicios, no elige proveedor definitivo y no implementa envio.

## Objetivo

Preparar una decision segura para enviar confirmaciones y avisos de participacion sin exponer credenciales en frontend.

## Reglas

- No meter claves de email en frontend.
- No usar variables `VITE_` para secretos de proveedor.
- No enviar emails directamente desde el navegador.
- No inventar precios ni condiciones comerciales no verificadas.
- No contratar servicios desde este repositorio.
- La decision final queda pendiente del usuario.

## Opciones Tecnicas

### Supabase Edge Function + Resend

- Edge Function recibe el evento validado.
- La clave del proveedor vive como secreto de backend.
- Buena opcion para emails transaccionales simples si el usuario decide usar ese proveedor.

### Supabase Edge Function + Brevo

- Edge Function centraliza la llamada.
- Permite mantener claves fuera del frontend.
- Opcion valida si el usuario prefiere Brevo por cuenta, panel o integraciones.

### Supabase Edge Function + Mailgun

- Edge Function centraliza el envio.
- Adecuado si el usuario ya usa Mailgun o quiere una solucion de email transaccional dedicada.

### SMTP Del Hosting

- Puede encajar si el hosting contratado ofrece SMTP fiable.
- Debe ejecutarse desde backend o funcion segura, nunca desde frontend.
- Requiere confirmar limites, reputacion y configuracion SPF/DKIM/DMARC.

### Investighost Como Emisor Futuro

- Investighost podria enviar emails al cambiar estados de revision.
- Encaja si se convierte en panel operativo de moderacion.
- Trawel seguiria siendo cliente publico sin secretos de email.

## Recomendacion Provisional

Recomendacion tecnica provisional:

- Supabase Edge Function + proveedor sencillo de email transaccional.
- Mantener todos los secretos como variables seguras de backend.
- Integrar primero confirmacion de recepcion.
- Integrar despues avisos de aprobacion/rechazo desde Investighost.

Proveedor final: pendiente del usuario.

## Pendiente Para Implementar

- Elegir proveedor.
- Crear cuenta o acceso.
- Configurar dominio/remitente.
- Configurar SPF/DKIM/DMARC si aplica.
- Crear secretos de backend.
- Implementar Edge Function o backend de envio.
- Registrar logs y errores.
- Probar envio real con filas test.
