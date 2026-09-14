# Ingress editorial V2: Investighost -> Trawel

## Propósito

La Edge Function `internal-editorial-deliveries` recibe entregas editoriales privadas de Investighost. No es una API pública ni un panel: valida identidad, registra la entrega y crea dos filas `draft` en `editorial_contents`.

No cambia entidades legacy, no publica contenido y no concede permisos al frontend.

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

- `editorial_deliveries`: inbox durable; `handoff_key` es único.
- `editorial_delivery_receipts`: eventos `received`, `processing`, `accepted`, `failed`, `duplicate` o `conflict`.
- `editorial_contents`: la función SQL atómica crea exactamente un draft `adventure` y uno `student`.

Una repetición con el mismo `handoffKey` y fingerprint devuelve el receipt existente. Si el fingerprint cambia, devuelve `409 conflict`. Las entregas fallidas pueden reintentarse con el mismo payload. La operación SQL es atómica: no puede quedar publicado un perfil ni quedar creado solo uno de los dos perfiles.

Todos los contenidos creados tienen `status = draft`, `review_state = pending_trawel_review` y `published_at = null`. La publicación queda fuera de IP-TW-001.

## Trazabilidad V2 por perfil

El sobre raíz conserva la identidad compartida de la delivery. Para cada draft,
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

El ingress conserva `libraryEntryId`, hashes, provenance, approval y metadata de perfil en `editorial_deliveries.payload` y en `editorial_contents.metadata`. También conserva campos adicionales de raíz en el payload durable; si Investighost usa `sourceStatus` y `review`, se copian como metadata sin alterar el estado `draft` de Trawel.

Pendiente de acordar con el contrato serializado final de Investighost:

- semántica exacta y emisor de `mappingId`;
- estructura y valores admitidos de `provenance` y `approval`;
- campos obligatorios de cada perfil más allá de `headline`;
- versionado sucesor, archivado de la versión previa y transición a `published`;
- tipos/shape de `sections` y `sources`;
- código de despliegue y provisioning seguro de mappings.

## Cierre de validación remota

El 2026-09-10, IP-TW-001 obtuvo **REMOTE INTEGRATION PASS COMPLETO** en `trawel-prod`. Con un mapping activo de Albarracín, una entrega V2 creó exactamente los drafts privados `adventure` y `student`; la repetición fue idempotente, un fingerprint distinto produjo `409 conflict` y ningún contenido quedó publicado.
