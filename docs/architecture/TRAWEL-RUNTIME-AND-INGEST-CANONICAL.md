# Trawel Runtime and Ingest — Canonical

> **Instrucción operativa:** antes de cualquier prompt de arquitectura, runtime o ingest en Trawel, leer este documento primero. Solo reauditar componentes cuya realidad haya cambiado o no esté documentada aquí.

## Referencia

- Repositorio: `D:\Proyectos\trawel`
- Rama de auditoría: `main`
- HEAD de referencia: `8cdd4214a3ea360368b17c582978fbdf1179c2bb`
- Restore point premium: `trawel-adventure-premium-v1` y `checkpoint/adventure-premium-v1` → `d617ec539d5c84c25bc46cd31632c0b0e2715d3f`

## Frontera canónica

| Sistema | Responsabilidad |
| --- | --- |
| Investighost | Investigación, selección, derechos, aprobación editorial y de media. |
| Trawel | Recibir resultados aprobados, persistirlos de forma segura y presentarlos. |

**DO_NOT_REOPEN:** Trawel no descubre candidatos, no interpreta licencias, no revisa investigación ni decide si una imagen es publicable.

## IMPLEMENTADO

### Supabase y contenido editorial

- El frontend usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` solo para lectura pública; no expone service role.
- `editorial_contents` conserva Adventure y Student por entidad, país/zona, modo, estado y fecha de publicación.
- `internal-editorial-deliveries` es el receiver interno V2. Autentica `x-internal-editorial-secret` contra el secret remoto `INTERNAL_EDITORIAL_DELIVERIES_SECRET`; usa `SUPABASE_SERVICE_ROLE_KEY` solo dentro de Edge Functions.
- El receiver acepta `GET` de estado y `POST` JSON V2. Valida identidad, hashes, mapping activo e idempotencia por `handoffKey` + `payloadFingerprint`.
- `ingest_editorial_delivery_v2` publica directamente los dos perfiles aprobados como `status=published`, `review_state=approved_by_investighost` y `published_at` presente. La lectura pública exige `published` y fecha no nula.
- `editorial_destination_mappings` es privado y durable; el receiver no crea destinos, mappings ni catálogo de localizaciones automáticamente.

### Storage y media existentes

- Buckets remotos verificados: `map-assets` (público) y `traveler-adventure-photos` (privado, JPEG/PNG/WebP, límite de 5 MiB).
- La aplicación ya sabe construir una URL pública de Storage para `map-assets` mediante `getPublicUrl`.
- `image_assets` ya existe: metadatos de entidad, ruta/bucket o URL, alt, caption, crédito, licencia, fuente, dimensiones, metadata y estado. La lectura anónima queda limitada a `status=published`.
- A la fecha de referencia, `image_assets` no tiene filas públicas y no hay bucket dedicado de media editorial/destino.

### Runtime visual y rutas

- El runtime visual actual carga `public/destinations/<slug>/manifest.json` y resuelve sus paths a `/destinations/<slug>/...`.
- El manifest contiene assets, derechos, alt/caption/crédito y selecciones por modo (`hero`, `highlights`, `gallery`, `itinerary`, `map`).
- `CountryZonePage` resuelve texto desde Supabase por `country_slug`, `zone_slug` y modo. La ruta es dinámica, pero una zona nueva requiere previamente una fila `location_cities` activa y un mapping editorial que apunte a ella.

## IMPLEMENTADO — canonical drawers (migraciones 019–020)

- `CANONICAL_MEDIA_DRAWER = DONE`: `destination-media` es un bucket público de lectura; no se añaden políticas anónimas de escritura. `image_assets` conserva checksum SHA-256 único, MIME, bytes, dimensiones, `rights_status`, rutas controladas y estados `staged`/`published`/`archived` compatibles con los estados legacy.
- `CANONICAL_VISUAL_SELECTIONS = DONE`: `destination_presentation_packages` vincula una sola delivery V2 con Hero y `DESTINATION_VISUAL_STORY`. `destination_visual_selections` conserva slot, orden, asset, copy contextual, CTA segura, `presentation_tone` y `text_placement`; la procedencia continúa en `image_assets`.
- `CANONICAL_PLACES_TO_GO = DONE`: `destination_places_to_go` persiste únicamente `STAY`, `EAT`, `DRINK` y `NIGHTLIFE`, sin ranking ni lógica de recomendación de Trawel.
- `V2_EXTENDED_INGEST = DONE`: `POST /functions/v1/internal-editorial-deliveries/media` usa la misma autenticación interna y recibe `multipart/form-data`; valida magic bytes JPEG/PNG/WebP, límite de 5 MiB, dimensiones, checksum recalculado, focal point y derechos. El POST JSON V2 acepta opcionalmente `presentationPackage` y mantiene handoffs V2 textuales sin cambios.
- `CANONICAL_DYNAMIC_RUNTIME = DONE`: el runtime usa una presentación dinámica solo si encuentra un package publicado completo, sus dos perfiles publicados y media aprobada; de otro modo permanece íntegramente en el fallback legacy/local.
- `TWO_EDITORIAL_CAROUSELS = DONE`: para un package dinámico Adventure renderiza un carrusel `DESTINATION_VISUAL_STORY` y uno `PLACES_TO_GO`. UGC y promociones siguen fuera de esos dos carruseles.

## Flujo canónico implementado

1. Investighost sube bytes aprobados a la ruta interna de media; Trawel devuelve `trawelMediaId` y conserva el asset como `staged`.
2. Investighost entrega V2 textual normal y, opcionalmente, `presentationPackage` con referencias solo a esos IDs.
3. La RPC valida técnicamente todas las referencias y publica en una transacción Student, Adventure, Hero, Visual Story, Places y assets staged.
4. El loader lee exclusivamente el package coherente publicado. No mezcla perfiles o visuales de packages distintos.

La migración está implementada en el repositorio; su aplicación al proyecto remoto y el primer smoke de una entrega real siguen siendo pasos de despliegue, no decisiones editoriales.

## Contrato de handoff previsto

### Antes/durante upload

- Bytes aprobados.
- `expectedChecksum`, tipo de entidad y metadatos de procedencia: alt, crédito, fuente, licencia opcional, focal point y `rightsStatus=APPROVED_FOR_PUBLIC_USE`.
- Trawel detecta MIME y dimensiones desde los bytes; no acepta esos valores como autoridad del remitente.

### Después de upload

- `trawelMediaId`, checksum confirmado y URL pública devuelta por Trawel.
- Handoff JSON V2 opcional `presentationPackage`, con `hero`, `destinationVisualStory` y `placesToGo`, que solo referencia esos IDs de Trawel.

**DO_NOT_REOPEN:** un rights status distinto de `APPROVED_FOR_PUBLIC_USE` debe fallar cerrado. Trawel guarda la decisión recibida, no la recalcula.

## Entrada y salida

```text
Investighost approved bytes
  → internal Trawel media route (same internal auth)
  → technical validation + SHA-256 dedupe
  → destination-media public object + image_assets
  → V2 JSON handoff links approved media selections
  → published visual-selection records
  → dynamic visual loader
  → Trawel web public HTTPS media
```

## Coste

- Storage, egress/bandwidth y Edge Function invocations dependen del plan remoto de Supabase; el repositorio no fija precios.
- La nueva capa añadirá bytes almacenados, egress público, invocaciones de upload e inserciones/lecturas de metadata.

## Próximo objetivo

Aplicar las migraciones y desplegar la Edge Function en el entorno remoto; después realizar un smoke local/remoto con un package canónico aprobado. No enviar todavía ningún destino real desde Investighost.
