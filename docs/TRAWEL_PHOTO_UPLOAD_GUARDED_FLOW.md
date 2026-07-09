# Trawel Photo Upload Guarded Flow

Fecha: 2026-07-09.
Bloque: 88.

## Estado Actual

La subida real de fotos sigue desactivada.

En `/compartir`, el usuario puede seleccionar fotos y Trawel puede estandarizarlas localmente a WebP, pero no se suben a Storage. Si hay fotos adjuntas, el mensaje queda marcado con:

```text
photo_upload_pending=true
```

Esto significa que la colaboracion incluye fotos pendientes de flujo futuro, no que los archivos se hayan almacenado.

Flag global actual:

```text
photo_uploads_enabled=false
```

## Objetivo Del Flujo Futuro

Permitir subida real de fotos solo cuando exista un flujo cerrado de coste, seguridad, moderacion y caducidad.

El futuro flujo debe aceptar fotos de usuario sin abrir buckets privados, sin `service_role` en frontend y sin permitir almacenamiento infinito.

## Flujo Futuro Propuesto

1. Usuario selecciona hasta 3 fotos en `/compartir`.
2. Frontend valida:
   - Formato JPG, PNG o WebP.
   - Tamano maximo antes de procesar segun `max_photo_upload_mb`.
   - Maximo de fotos segun `max_photos_per_submission`.
3. Frontend estandariza a WebP.
4. Usuario completa Turnstile.
5. Frontend envia texto y metadata.
6. Frontend llama una Edge Function futura:

```text
guarded-photo-upload
```

7. La Edge Function valida limites, registra eventos y sube solo si esta habilitado.

## Edge Function Futura

`guarded-photo-upload` debe:

- Verificar Turnstile o reutilizar una validacion segura equivalente.
- Leer `system_flags.photo_uploads_enabled`.
- Si `photo_uploads_enabled=false`, rechazar subida de archivos y permitir que el texto siga su flujo normal.
- Validar numero de fotos.
- Validar tamano final procesado.
- Validar limites diarios por `email_hash`.
- Hashear IP si hay cabecera fiable.
- Validar cuota mensual de storage pendiente con `monthly_pending_storage_soft_limit_mb`.
- Subir a bucket privado o generar signed upload controlada de vida corta.
- Registrar `storage_usage_events`.
- Crear o actualizar cola privada de revision.
- Programar caducidad en `moderation_cleanup_queue` si procede.

La funcion nunca debe imprimir tokens, emails en claro, claves o rutas sensibles innecesarias.

## Moderacion

Estados esperados:

- Pendiente: archivo en cuarentena privada.
- Aprobado: se mueve o replica a storage publico controlado o Cloudflare R2 futuro.
- Rechazado: se borra archivo privado y se conserva solo metadata minima necesaria.
- Caducado: se borra archivo privado y se registra limpieza.

El contenido aprobado debe terminar en tabla/catalogo publicado, no leerse desde cola pendiente.

## Storage

Reglas:

- Pendientes siempre en bucket privado.
- No bucket publico para pendientes.
- No subida directa anonima sin Edge Function.
- No `service_role` en frontend.
- No originales gigantes permanentes.
- No conservar fotos pendientes mas de 30 dias sin revision.

Para fotos publicas masivas, evaluar Cloudflare R2 o equivalente despues de moderacion.

## Flags Y Limites Existentes

Ya existen en `system_flags`:

- `photo_uploads_enabled=false`.
- `max_photos_per_submission=3`.
- `max_photo_upload_mb=5`.
- `max_processed_photo_mb=1.5`.
- `max_pending_photo_days=30`.
- `max_daily_photo_uploads_per_email=9`.
- `monthly_pending_storage_soft_limit_mb=2048`.

Ya existen tablas de soporte:

- `storage_usage_events`.
- `moderation_cleanup_queue`.
- `public_submission_events`.

No hace falta migracion adicional para este contrato mientras no se implemente la Edge Function futura.

## Comportamiento Si Se Supera Cuota

Si se supera cualquier limite de fotos:

- Rechazar subida de fotos.
- Mantener bloqueada la subida real si procede.
- Permitir que el texto se envie si `public_share_enabled=true`, Turnstile pasa y el rate limit de texto lo permite.
- Mostrar mensaje amable, sin detalles internos de cuota.

## Nunca Hacer

- Abrir bucket privado.
- Hacer bucket publico para pendientes.
- Subir desde frontend con `service_role`.
- Guardar originales pesados indefinidamente.
- Publicar fotos sin revision.
- Activar subida real sin decision explicita.
- Crear coste de almacenamiento sin caducidad.

