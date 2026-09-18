# Ingress editorial V2: Investighost -> Trawel

## Propósito

La Edge Function `internal-editorial-deliveries` recibe entregas privadas de contenido ya aprobado por Investighost. No es una API pública ni un panel: valida identidad, registra el handoff y deja disponibles los perfiles `adventure` y `student` en `editorial_contents`.

No cambia entidades legacy ni concede permisos de escritura al frontend. En Trawel, `published` significa solamente `AVAILABLE_TO_TRAWEL`: la aprobación editorial ocurrió antes, en Investighost.

## Provisionado previo obligatorio

Antes de enviar una entrega, un proceso interno con permisos de base de datos debe crear una fila activa en `editorial_destination_mappings`.

La fila vincula de forma durable:

```text
source_system = investighost
source_mapping_id
canonical_destination_id
  -> trawel_entity_type + trawel_entity_id
```

También puede incluir `trawel_entity_slug`, `country_slug` y `zone_slug` para poblar los campos de lectura de `editorial_contents`. El receiver no crea mappings automáticamente: una entrega sin mapping activo queda en `failed` con `mapping_not_found`, y puede reintentarse cuando el mapping exista.

## Autenticación y endpoint

Configurar exclusivamente como Supabase secret:

```text
INTERNAL_EDITORIAL_DELIVERIES_SECRET=<secreto-aleatorio-largo>
```

Investighost debe llamar con:

```text
POST /functions/v1/internal-editorial-deliveries
x-internal-editorial-secret: <mismo-secreto>
Content-Type: application/json
```

El secret nunca debe usar prefijo `VITE_`, entrar en Git ni exponerse al navegador. La función conserva la protección normal del gateway de Supabase; el secret añade autenticación explícita de servicio a servicio.

Para consultar el estado, con el mismo header:

```text
GET /functions/v1/internal-editorial-deliveries/{handoffKey}
```

También se admite `POST` con `{ "action": "status", "handoffKey": "..." }`.

## Payload V2 mínimo asumido

Como el contrato serializado exacto no existe en Trawel, IP-TW-001 adopta este mínimo estricto:

```json
{
  "schemaVersion": "v2",
  "handoffKey": "delivery-key-at-least-16",
  "payloadFingerprint": "sha256-hex-minuscula-64-caracteres",
  "mappingId": "investighost-durable-mapping-id",
  "canonicalDestinationId": "investighost-canonical-destination-id",
  "libraryEntryId": "investighost-library-entry-id",
  "versionHash": "sha256-hex-minuscula-64-caracteres",
  "contentHash": "sha256-hex-minuscula-64-caracteres",
  "provenance": {},
  "approval": {},
  "profiles": {
    "adventure": {
      "headline": "Titular obligatorio",
      "intro": "Opcional",
      "whatMakesSpecial": "Opcional",
      "highlights": ["Opcional"],
      "suggestedRoute": "Opcional",
      "practicalTips": ["Opcional"],
      "sections": [],
      "sources": [],
      "metadata": {}
    },
    "student": {
      "headline": "Titular obligatorio"
    }
  }
}
```

`handoffKey` admite letras, números, `.`, `_`, `:`, `-`, con 16-200 caracteres. Los tres hashes deben ser SHA-256 hexadecimal en minúsculas. Ambas variantes de perfil son obligatorias y cada una requiere `headline`.

## Persistencia y estados

- `editorial_deliveries`: ledger técnico durable e idempotente; `handoff_key` es único. No es una inbox o cola editorial de Trawel.
- `editorial_delivery_receipts`: eventos `received`, `processing`, `accepted`, `failed`, `duplicate` o `conflict`.
- `editorial_contents`: la función SQL atómica crea exactamente un perfil disponible `adventure` y uno `student`.

Una repetición con el mismo `handoffKey` y fingerprint devuelve el receipt existente. Si el fingerprint cambia, devuelve `409 conflict`. Las entregas fallidas pueden reintentarse con el mismo payload. La operación SQL es atómica: no puede quedar publicado un perfil ni quedar creado solo uno de los dos perfiles.

Todos los contenidos creados tienen `status = published`, `review_state = approved_by_investighost` y `published_at` asignado atómicamente. No hay transición de draft, review o aprobación dentro de Trawel.

## Trazabilidad V2 por perfil

El sobre raíz conserva la identidad compartida de la delivery. Para cada perfil disponible,
la función SQL toma la trazabilidad editorial de su propio perfil desde:

```text
profiles.<adventure|student>.metadata.investighost.libraryEntryId
profiles.<adventure|student>.metadata.investighost.currentApproved
```

De `currentApproved` proyecta los hashes, `versionId`, `revisionId`,
`approvalDecisionId` y la procedencia de ese perfil a `metadata.ingress`,
`metadata.provenance` y `metadata.approval`. Si un payload V2 anterior no
incluye ese bloque, se conserva el fallback compatible con la traza raíz.

## Campos V2 conservados y pendientes

El ingress conserva `libraryEntryId`, hashes, provenance, approval y la traza mínima por perfil en `editorial_deliveries.payload` y en `editorial_contents.metadata`. El receiver descarta campos adicionales de raíz y metadata de perfil ajena a esa traza. No se entrega ni persiste investigación bruta, dossier, claims internos, reasoning, borradores rechazados o costes.

Pendiente de acordar con el contrato serializado final de Investighost:

- semántica exacta y emisor de `mappingId`;
- estructura y valores admitidos de `provenance` y `approval`;
- campos obligatorios de cada perfil más allá de `headline`;
- contrato de actualización de una versión sucesora (la lectura pública ya selecciona la versión disponible más reciente por `published_at`);
- tipos/shape de `sections` y `sources`;
- código de despliegue y provisioning seguro de mappings.

## Cierre de validación remota

La repetición de un handoff V2 aceptado es idempotente; un fingerprint distinto produce `409 conflict`. La disponibilidad no requiere una segunda aprobación en Trawel.
