# Trawel Private Photo Upload Decision

Decision tecnica para la subida privada de fotos de usuario desde Trawel.

## Resumen

No se conecta subida directa de fotos desde frontend anon en este bloque.

Motivo: el bucket correcto existe y es privado, pero el rol anon no tiene una policy segura de `INSERT` en `storage.objects` para `traveler-adventure-photos`. Abrir esa escritura desde frontend sin backend intermedio seria una ampliacion de permisos que requiere diseno explicito.

Trawel mantiene `/compartir` como esta:

- El usuario puede seleccionar hasta 3 fotos.
- Las fotos se estandarizan en navegador a WebP.
- Se muestran previews y tamanos.
- El envio textual entra en `user_messages`.
- La metadata mantiene `photo_upload_pending=true`.
- No se suben blobs.
- No se publica nada automaticamente.

## Auditoria Realizada

Fecha: 2026-07-04.

Bucket auditado:

| Bucket | Publico | Limite | MIME permitidos |
|--------|---------|--------|-----------------|
| `traveler-adventure-photos` | No | 5 MB | `image/jpeg`, `image/png`, `image/webp` |

Policies remotas de `storage.objects` consultadas mediante Supabase CLI:

| Policy | Comando | Rol | Condicion |
|--------|---------|-----|-----------|
| `Allow public read access to map-assets` | `SELECT` | `public` | `bucket_id = 'map-assets'` |

Resultado:

- No existe policy publica de `INSERT` para `traveler-adventure-photos`.
- No existe policy publica de `SELECT` para `traveler-adventure-photos`.
- El bucket sigue privado.

Prueba controlada de upload anon:

```text
bucket: traveler-adventure-photos
path: codex-audit/{timestamp}-anon-upload-test.webp
resultado: 403
mensaje: new row violates row-level security policy
```

No se creo ningun objeto, por lo que no hubo archivo que limpiar.

## Decision

No abrir permisos desde Trawel en este bloque.

No se debe:

- Hacer publico `traveler-adventure-photos`.
- Anadir `SUPABASE_SERVICE_ROLE_KEY` al frontend.
- Crear una policy publica amplia de `INSERT` en Storage.
- Guardar blobs en tablas Supabase.
- Publicar fotos desde `user_messages` o `user_photo_submissions`.

## Opciones Seguras

### 1. Edge Function Con Service Role

Crear una Edge Function controlada, por ejemplo `submit-user-photo-collaboration`, que:

- Reciba metadata validada: nombre, email, pais, zona, tipo de colaboracion, derechos y consentimiento.
- Reciba una o varias fotos ya estandarizadas a WebP o genere URLs firmadas internas.
- Valide tamano, MIME, limite de fotos, slugs y origen.
- Use `service_role` solo dentro del backend.
- Suba al bucket privado `traveler-adventure-photos`.
- Inserte una fila en `user_photo_submissions` por foto con `storage_path`.
- Mantenga `status` por default de Supabase.
- No devuelva URL publica ni firmada de lectura.

### 2. Signed Upload URL Corta

Crear un endpoint o Edge Function que:

- Valide la solicitud.
- Genere rutas privadas controladas.
- Entregue una signed upload URL de vida corta.
- Inserte o confirme despues una fila en `user_photo_submissions`.

Esta opcion reduce el paso de binarios por la funcion, pero exige manejar expiracion, confirmacion de subida y limpieza de objetos huerfanos.

## Recomendacion

Usar Edge Function controlada como primera implementacion.

Es la opcion mas clara para Trawel porque centraliza:

- Validacion de metadata.
- Generacion de rutas privadas.
- Escritura en Storage privado.
- Insercion en `user_photo_submissions`.
- Limpieza futura de envios rechazados o abandonados.

## Flujo Recomendado

```text
/compartir
  -> estandariza fotos en navegador
  -> envia metadata + fotos a Edge Function
  -> Edge Function valida
  -> Edge Function sube a traveler-adventure-photos
  -> Edge Function inserta user_photo_submissions
  -> Investighost revisa
  -> Trawel publica solo assets aprobados
```

## Estado Tras Este Bloque

- `/compartir` conserva previews WebP locales.
- `user_messages` puede recibir `photo_count` y `photo_upload_pending=true`.
- `user_photo_submissions` sigue preparada para registros futuros con `storage_path`.
- La subida real queda pendiente de Edge Function o signed upload URL.

