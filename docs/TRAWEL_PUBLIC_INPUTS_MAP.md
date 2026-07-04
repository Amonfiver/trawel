# Trawel Public Inputs Map

Mapa operativo de entradas publicas de Trawel para saber que recibe el producto y donde debe moderarlo Investighost.

## Regla Maestra

Trawel recibe aportes; Investighost modera; Trawel publica solo contenido aprobado.

Ninguna entrada publica se muestra automaticamente en la web.

## Entradas Publicas

| Entrada publica | Ruta o ubicacion | Servicio frontend | Tabla Supabase | Estado por defecto | Publicacion directa | Revision | Estado actual |
|-----------------|------------------|-------------------|----------------|---------------------|---------------------|----------|---------------|
| Contacto | `/contacto` | `submitContactMessage(...)` | `user_messages` | `pending_review` | No | Investighost futuro | Conectado y verificado |
| Compartir / sugerir | `/compartir` | `submitCommunitySuggestion(...)` | `user_messages` | `pending_review` | No | Investighost futuro | Conectado y verificado |
| Reportar contenido | `TrustPage`, bloque "Reportar contenido" | `submitContentReport(...)` | `content_reports` | `pending_review` | No | Investighost futuro | Conectado y verificado |
| Fotos de viajeros | UI pendiente | `submitUserPhotoSubmission(...)` | `user_photo_submissions` | `submitted` | No | Investighost futuro | Servicio preparado y verificado; formulario pendiente |

## Detalle Por Entrada

### Contacto

- Ruta: `/contacto`.
- Servicio: `submitContactMessage(...)`.
- Tabla: `user_messages`.
- Estado inicial: `pending_review`.
- Uso: consultas generales, privacidad, retirada o avisos amplios.
- Publicacion directa: no.
- Revision: Investighost futuro.

### Compartir / Sugerir

- Ruta: `/compartir`.
- Servicio: `submitCommunitySuggestion(...)`.
- Tabla: `user_messages`.
- Estado inicial: `pending_review`.
- Uso: propuestas de destino, experiencia/aventura, foto de encabezado, foto de ciudad/zona, correccion u otro aporte comunitario.
- Clasificacion: pais y zona desde selects Supabase, mas tipo de colaboracion controlado.
- Entrada enlazada: CountryPage y CountryZonePage pueden abrir `/compartir?tipo=hero_photo&pais=...&zona=...` para preseleccionar foto de encabezado.
- Experiencias/aventuras: si `contribution_type='experiencia_aventura'`, el formulario pide `experience_title` y lo envia en metadata.
- Query params: `/compartir?tipo=adventure...` o `/compartir?tipo=experience...` preseleccionan experiencia/aventura.
- Fotos: hasta 3 adjuntos opcionales procesados en navegador a WebP para preview, sin subida a Storage todavia.
- Metadata: `source='trust_page_share_form'`, `country_slug`, `zone_slug`, `contribution_type`, `experience_title` cuando aplica, `photo_count`, `photo_standardization` y `photo_upload_pending`.
- Decision Storage: ver `docs/TRAWEL_PRIVATE_PHOTO_UPLOAD_DECISION.md`; upload real queda pendiente de Edge Function o signed upload URL.
- Publicacion directa: no.
- Revision: Investighost futuro.

### Reportar Contenido

- Ubicacion inicial: `TrustPage`.
- Servicio: `submitContentReport(...)`.
- Tabla: `content_reports`.
- Estado inicial: `pending_review`.
- Target inicial: `target_entity_type='static_page'` y `target_entity_slug` igual al slug de la pagina.
- Uso: errores de contenido, derechos de imagen, solicitudes de retirada, contenido inapropiado, informacion desactualizada u otros avisos.
- Publicacion directa: no.
- Revision: Investighost futuro.

### Fotos De Viajeros

- Estado visual: formulario pendiente.
- Servicio: `submitUserPhotoSubmission(...)`.
- Tabla: `user_photo_submissions`.
- Estado inicial: `submitted`.
- Storage previsto: bucket privado `traveler-adventure-photos`.
- Uso: propuestas de fotos con derechos y consentimiento confirmados.
- Contrato: `docs/TRAWEL_USER_PHOTO_UPLOAD_CONTRACT.md`.
- Decision de subida privada: `docs/TRAWEL_PRIVATE_PHOTO_UPLOAD_DECISION.md`.
- Clasificacion obligatoria: pais, zona dependiente del pais y tipo de colaboracion.
- Limite documental: maximo 3 fotos por envio, entrada JPG/PNG/WebP y salida WebP.
- Publicacion directa: no.
- Revision: Investighost futuro.

## Seguridad

- `INSERT` publico controlado para `anon` y `authenticated`.
- Sin `SELECT` publico en colas:
  - `user_messages`.
  - `user_photo_submissions`.
  - `content_reports`.
- Los servicios frontend no escriben estados internos.
- Supabase aplica defaults seguros:
  - `pending_review` para mensajes.
  - `submitted` para fotos.
  - `pending_review` para reportes.
- Las filas de prueba usadas en verificaciones fueron eliminadas.

## Proximos Pasos

- Crear formulario visual de fotos solo cuando exista subida segura.
- Seguir `docs/TRAWEL_USER_PHOTO_UPLOAD_CONTRACT.md` antes de disenar UI o activar Storage para fotos.
- Implementar Edge Function o backend para subir fotos al bucket privado.
- Preparar panel Investighost de moderacion.
- Definir flujo interno de aprobacion, rechazo, archivado y publicacion.
- Publicar solo desde tablas/acciones aprobadas, nunca desde colas pendientes.
