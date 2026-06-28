# Trawel User Photo Storage Plan

Plan operativo para preparar fotos enviadas por usuarios sin conectar todavia un formulario visual ni abrir lectura publica.

## 1. Objetivo

- Recibir propuestas de fotos de usuarios de forma privada y revisable.
- Evitar que una foto enviada se publique o se pueda leer publicamente antes de moderacion.
- Reutilizar Supabase Storage sin crear buckets nuevos en esta fase.
- Conectar `user_photo_submissions.storage_path` con una ruta estable dentro de Storage.
- Dejar preparado el flujo futuro para Investighost o una Edge Function de subida segura.

## 2. Auditoria Actual

Consulta remota realizada contra `trawel-prod` (`pjqisqzxajdfkimtrcby`).

Buckets existentes:

| Bucket | Publico | Limite | MIME permitidos | Uso actual |
|--------|---------|--------|-----------------|------------|
| `map-assets` | Si | Sin limite configurado | Sin restriccion configurada | TopoJSON/mapas internos. |
| `traveler-adventure-photos` | No | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Fotos privadas de viajeros/comunidad. |

Policies de Storage detectadas:

- `storage.objects` solo tiene lectura publica para `bucket_id = 'map-assets'`.
- No hay policy publica para leer o escribir `traveler-adventure-photos`.

Cola `user_photo_submissions`:

- RLS activo.
- Policy publica solo de `INSERT`.
- Sin policy publica de `SELECT`.
- Grants publicos por columna para datos esperados.
- No hay grant publico para escribir `status`; la DB debe aplicar el default `submitted`.

Servicios existentes:

- `submitUserPhotoSubmission(...)` inserta en `user_photo_submissions`.
- No sube archivos a Storage.
- Exige `imageUrl` o `storagePath`, derechos confirmados y consentimiento confirmado.
- Estado previsto: `submitted`.

## 3. Estrategia Recomendada

Usar `traveler-adventure-photos` como bucket privado de cuarentena para fotos enviadas por usuarios.

No crear bucket nuevo ahora. El bucket existente ya encaja con la necesidad principal:

- Privado.
- Sin lectura publica.
- Sin escritura publica directa.
- Limite de 5 MB.
- MIME restringido a imagenes habituales.

La publicacion final no debe leer directamente desde esta cola privada. Una foto aprobada debe convertirse en asset publicado mediante proceso interno:

1. Usuario propone foto.
2. Backend/Edge Function sube binario al bucket privado.
3. Trawel inserta o recibe una fila en `user_photo_submissions` con `storage_path`.
4. Investighost revisa derechos, calidad, privacidad, credito y contexto.
5. Si se aprueba, backend interno crea o vincula un `image_assets` publicado.
6. Trawel solo muestra assets aprobados/publicados, nunca entradas pendientes.

## 4. Naming De Archivos

Ruta recomendada dentro de `traveler-adventure-photos`:

```text
submissions/{country_slug}/{zone_slug_or_general}/{yyyy}/{submission_id}/{safe_original_basename}-{random_suffix}.{ext}
```

Ejemplos:

```text
submissions/mexico/general/2026/3f2c.../mercado-oaxaca-a8k3.webp
submissions/espana/madrid/2026/91bd.../atardecer-retiro-x7p9.jpg
```

Reglas:

- `country_slug` obligatorio.
- `zone_slug_or_general` usa `general` si no hay zona.
- `submission_id` debe ser UUID de la fila o un UUID previo de subida.
- `safe_original_basename` debe normalizarse a minusculas, ASCII, guiones y sin datos personales.
- `random_suffix` evita colisiones y reduce enumeracion.
- Extension permitida: `.jpg`, `.jpeg`, `.png`, `.webp`.
- No incluir email, nombre real, telefono, fecha exacta local ni metadatos privados en la ruta.

## 5. Limites Conceptuales

Mantener limites coherentes con el bucket actual:

- Tamano maximo: 5 MB por archivo.
- MIME permitidos: `image/jpeg`, `image/png`, `image/webp`.
- Un envio inicial debe aceptar una foto por propuesta.
- Recomendar conversion futura a WebP para assets publicados, pero no exigirla en la subida pendiente.
- El backend debe eliminar o ignorar metadatos EXIF antes de cualquier publicacion.
- No aceptar SVG ni formatos ejecutables.
- No aceptar enlaces externos como publicacion directa; si se admite `image_url`, debe ser solo referencia para revision.

## 6. Relacion Con `user_photo_submissions`

Campos clave:

- `storage_path`: ruta privada dentro de `traveler-adventure-photos`.
- `image_url`: referencia externa opcional solo si no hay subida directa.
- `status`: debe quedar `submitted` por default de DB, no escrito desde cliente anon.
- `published_image_asset_id`: solo se rellena tras aprobacion interna.
- `rights_confirmed`: obligatorio.
- `consent_confirmed`: obligatorio.
- `credit_name`: credito publico deseado si se publica.

Decision importante:

- Antes de conectar formulario visual, revisar `submitUserPhotoSubmission(...)` para que no intente escribir `status`, igual que se hizo con `user_messages`.

## 7. Flujo Seguro Futuro

Fase recomendada para conectar fotos:

1. Crear Edge Function `request-user-photo-upload` o equivalente.
2. Validar payload: pais, zona opcional, nombre, email, derechos, consentimiento y tipo/tamano de archivo.
3. Generar `submission_id` y `storage_path`.
4. Subir con service role al bucket privado o entregar URL firmada de subida de vida corta.
5. Insertar fila en `user_photo_submissions` con `storage_path`.
6. Devolver solo estado de recepcion al usuario.
7. No devolver URL publica ni firmada de lectura.
8. Investighost revisa y publica mediante asset aprobado.

## 8. Lo Que No Debe Hacerse

- No abrir `traveler-adventure-photos` como bucket publico.
- No crear policy publica de `SELECT` en `storage.objects` para fotos de usuario.
- No crear policy publica de `INSERT` directa en Storage sin validacion backend.
- No renderizar `storage_path` pendiente en Trawel.
- No guardar fotos aprobadas solo en `user_photo_submissions`.
- No usar el bucket `map-assets` para fotos.
- No mezclar fotos pendientes con assets editoriales publicados.

## 9. Proxima Tarea Recomendada

Antes del formulario visual:

- Ajustar `submitUserPhotoSubmission(...)` para no enviar `status`.
- Definir Edge Function o subida firmada segura.
- Probar una subida privada controlada.
- Verificar que anon no puede leer ni listar objetos del bucket privado.
- Documentar limpieza de fotos rechazadas o abandonadas.
