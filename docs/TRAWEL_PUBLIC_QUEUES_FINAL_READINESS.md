# Trawel Public Queues Final Readiness

Auditoria final corta del estado de colas publicas de Trawel contra Supabase real.

El mapa operativo de entradas vive en `docs/TRAWEL_PUBLIC_INPUTS_MAP.md`.

## 1. Resumen Ejecutivo

Trawel ya puede recibir:

- Contacto desde `/contacto`.
- Sugerencias y propuestas desde `/compartir`.
- Futuras propuestas de fotos mediante `user_photo_submissions`.
- Reportes de contenido mediante `content_reports`.

Todo entra en cola privada de revision. Nada enviado por usuarios se publica automaticamente ni se muestra en la web publica.

## 2. Tablas Verificadas

- `user_messages`.
- `user_photo_submissions`.
- `content_reports`.

Las tres tablas existen en Supabase real `trawel-prod` y fueron verificadas con inserts controlados usando cliente anon.

## 3. Estados Por Defecto Verificados

| Tabla | Estado inicial verificado |
|-------|---------------------------|
| `user_messages` | `pending_review` |
| `user_photo_submissions` | `submitted` |
| `content_reports` | `pending_review` |

Los servicios frontend no escriben columnas internas de estado. Supabase aplica los defaults seguros definidos en la base de datos.

## 4. Seguridad Verificada

- `INSERT` publico controlado para `anon` y `authenticated`.
- Grants publicos limitados a columnas esperadas.
- RLS activo en las tres colas.
- Sin policies publicas de `SELECT`.
- Cliente anon recibe `401` al intentar leer:
  - `user_messages`.
  - `user_photo_submissions`.
  - `content_reports`.
- Filas test creadas durante las verificaciones fueron eliminadas.
- Las colas no tienen publicacion directa ni lectura publica desde Trawel.

## 5. Servicios Frontend Preparados

- `submitContactMessage(...)`.
- `submitCommunitySuggestion(...)`.
- `submitUserPhotoSubmission(...)`.
- `submitContentReport(...)`.

Todos insertan en tablas privadas de cola y mantienen el estado publicable fuera del frontend publico.

## 6. Formularios Ya Conectados

- `/contacto`: inserta mensajes privados en `user_messages`.
- `/compartir`: inserta sugerencias/propuestas privadas en `user_messages`.
- `TrustPage`: inserta reportes privados en `content_reports`.

## 7. Pendientes Reales

- Flujo visual de fotos.
- Subida segura a Storage para fotos de usuario.
- Edge Function o backend interno para validar subidas.
- Panel Investighost para moderar.
- Aprobacion, rechazo, archivado y publicacion interna.
- Limpieza operativa de entradas rechazadas o abandonadas.
- Estrategia antispam si aumenta el volumen publico.

## 8. Decision De Producto

- Trawel publico recibe aportes.
- Investighost revisa y decide.
- Trawel solo muestra contenido publicado o aprobado.
- Ningun usuario publica directamente en la experiencia publica.

Esta decision mantiene separadas la entrada publica, la moderacion interna y la publicacion editorial.
