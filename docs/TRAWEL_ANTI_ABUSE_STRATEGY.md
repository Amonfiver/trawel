# Trawel Anti-Abuse Strategy

Estrategia previa a abrir subida real de fotos y formularios publicos con mas volumen.

## Objetivo

Reducir abuso en formularios, colas privadas y futura subida de fotos sin romper la experiencia de usuarios reales.

## Riesgos

- Bots enviando formularios.
- Spam en `user_messages`.
- Reportes falsos o masivos en `content_reports`.
- Saturacion de Storage.
- Miles de fotos basura.
- Intentos de subir archivos falsos.
- Archivos con MIME manipulado.
- Abuso por IP.
- Abuso por email.
- Costes inesperados por procesamiento de imagenes o almacenamiento.
- Intentos de descubrir rutas privadas de Storage.

## Medidas Recomendadas

### Captcha Amable

- Cloudflare Turnstile o equivalente.
- Evitar friccion excesiva para usuarios reales.
- Verificar siempre el token en backend o Edge Function.

### Rate Limit

- Limitar envios por IP.
- Limitar envios por email.
- Limitar intentos fallidos.
- Registrar eventos sospechosos.

### Limites De Fotos

- Maximo 3 fotos por envio.
- Limite de peso por archivo.
- Limite de peso total por envio.
- Validacion real de MIME y extension.
- Rechazar archivos no imagen.

### Storage Seguro

- Mantener `traveler-adventure-photos` privado.
- No abrir lectura publica.
- No permitir upload anon directo inseguro.
- Subida real por Edge Function o signed upload URL corta.
- No usar `service_role` en frontend.

### Cola De Revision

- Todo entra en cola.
- Nada se publica automaticamente.
- Investighost revisa, aprueba, rechaza o retira.
- Contenido reportado puede quedar oculto hasta resolucion.

### Logs De Abuso

- Registrar IP o hash de IP cuando sea legalmente viable.
- Registrar email, tipo de accion, frecuencia y errores.
- Registrar rechazos de MIME/peso.
- Registrar token antiabuso invalido.

## Aplicacion Por Entrada

### `/contacto`

- Captcha o Turnstile antes de aceptar envios.
- Rate limit por IP/email.
- Mantener `pending_review`.

### `/compartir`

- Captcha o Turnstile antes de aceptar colaboraciones.
- Rate limit por IP/email.
- Validacion de pais/zona/tipo.
- Fotos solo se suben cuando exista via segura.

### Reportes

- Captcha o Turnstile para evitar reportes masivos.
- Rate limit por IP/email.
- Mantener revision interna.

### Fotos Reales Futuras

- Validar token antiabuso antes de procesar o subir.
- Validar MIME real en backend.
- Rechazar archivos grandes.
- Guardar en bucket privado.
- Insertar registros en `user_photo_submissions`.

## Reglas Innegociables

- No `service_role` en frontend.
- No abrir bucket privado al publico.
- No publicar contenido pendiente.
- No confiar solo en validacion del navegador.
- No depender de ocultar botones como medida de seguridad.

## Orden Recomendado

1. Elegir metodo antiabuso.
2. Crear credenciales externas si aplica.
3. Verificar token en backend o Edge Function.
4. Proteger `/contacto`, `/compartir` y reportes.
5. Solo despues activar subida real de fotos.
