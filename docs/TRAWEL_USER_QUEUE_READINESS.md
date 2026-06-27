# Trawel User Queue Readiness

Auditoria final de preparacion para recibir contenido de usuarios en cola sin publicarlo directamente.

## Estado general

Trawel esta preparado para recibir mensajes, fotos y reportes como entradas privadas de revision. El SQL 008 ya fue aplicado en Supabase real `trawel-prod` mediante ejecucion manual del archivo, sin usar `db push` ni tocar el historial remoto de migrations.

No esta listo para activar formularios publicos hasta revisar el flujo visual, la estrategia antispam y el storage seguro para fotos.

## 1. Tablas preparadas en migration local

La migration local `supabase/migrations/008_create_user_content_queue_tables.sql` define:

- `user_messages`: contacto, sugerencias, colaboracion, reportes generales y solicitudes privadas.
- `user_photo_submissions`: fotos propuestas por usuarios, con derechos y consentimiento.
- `content_reports`: reportes de errores, abuso, derechos de imagen o solicitudes de retirada.

Las tres tablas tienen RLS activado, grants de `INSERT` controlado para `anon`/`authenticated` y no crean politicas publicas de `SELECT`, `UPDATE` ni `DELETE`.

Estado remoto validado en `trawel-prod`:

- Tablas creadas: `user_messages`, `user_photo_submissions`, `content_reports`.
- RLS activo en las tres.
- Policies existentes: `INSERT` para `anon`/`authenticated`.
- Sin policies publicas de `SELECT`.

## 2. Servicios frontend preparados

Servicios disponibles desde `src/features/travelData/productContent/` y exportados por `travelData`:

- `submitUserMessage(...)`: inserta mensajes en `user_messages`.
- `submitContactMessage(...)`: wrapper de contacto sobre `submitUserMessage(...)`.
- `submitCommunitySuggestion(...)`: wrapper de sugerencia sobre `submitUserMessage(...)`.
- `submitUserPhotoSubmission(...)`: inserta propuestas de fotos en `user_photo_submissions`.
- `submitContentReport(...)`: inserta reportes en `content_reports`.

Todos mantienen comportamiento seguro si Supabase no esta configurado y no hacen lecturas publicas.

## 3. Estados iniciales usados

- `user_messages`: `pending_review`.
- `user_photo_submissions`: `submitted`.
- `content_reports`: `pending_review`.

Ningun servicio usa `published`, `approved` ni estados publicables desde el lado publico.

## 4. Falta para activar formularios publicos

- Configurar storage seguro para fotos o decidir flujo alternativo de `image_url`.
- Preparar validacion de subida, tamano, MIME, rutas y limpieza de archivos no aprobados.
- Conectar formularios visuales de contacto, fotos y reportes.
- Preparar Investighost o backend interno para moderar, responder, aprobar, rechazar, archivar y resolver.
- Definir una estrategia antispam: rate limiting, captcha, Edge Function o filtro server-side si el volumen lo exige.

## 5. Riesgos principales

- Datos privados: emails, mensajes, reportes y notas internas no deben tener lectura publica.
- RLS remoto: cualquier error de grants/policies podria exponer colas privadas o permitir updates no deseados.
- Derechos de imagen: una foto con `rights_confirmed=true` aun necesita revision humana antes de publicarse.
- Spam y abuso: inserts publicos pueden recibir basura si no hay friccion o proteccion adicional.
- Storage: subir archivos sin backend/Edge Function puede dejar binarios privados sin moderar o dificiles de limpiar.
- Desalineacion de tipos: `submitContentReport(...)` mapea tipos publicos expresivos a los tipos compactos aceptados por la migration local.

## 6. Decision recomendada

No conectar formularios publicos todavia.

Antes de activar recepcion publica real, decidir el flujo seguro de storage para fotos, revisar UX de formularios y anadir proteccion antispam adecuada.

Siguiente bloque tecnico probable:

1. Preparar formulario de contacto contra `submitContactMessage(...)`.
2. Preparar estrategia de storage/upload seguro para fotos antes de conectar `submitUserPhotoSubmission(...)`.

En ambos caminos se mantiene la regla central: usuarios nunca publican directo; todo entra en cola y lo modera Investighost/backend.
