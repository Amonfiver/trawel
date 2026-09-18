# Trawel: consumo pasivo de contenido listo

`INVESTIGHOST_IS_EDITORIAL_AUTHORITY = YES`

Investighost investiga, sanea, estructura, revisa y aprueba. Trawel recibe el resultado final V2 y lo deja disponible para su lectura pública; `published` significa únicamente `AVAILABLE_TO_TRAWEL`.

Trawel conserva el destino, los perfiles Adventure y Student, metadata de producto y trazabilidad mínima (identidad de handoff, hashes y decisión de aprobación). No conserva investigación bruta, dossier, claims internos, reasoning, borradores rechazados, costes ni el proceso de revisión. `RAW_RESEARCH_IN_TRAWEL = NO`.

El registro técnico `editorial_deliveries` es un ledger privado e idempotente de entrega entre servicios, no una cola editorial de Trawel. No existe transición en Trawel de recibido a draft, review o aprobación. Una repetición del mismo handoff no duplica perfiles; una entrega posterior se lee por su `published_at` más reciente para cada modo.

`TRAWEL_EDITORIAL_WORKFLOW = NONE`

`TRAWEL_EDITOR_ROLE_REQUIRED = NO`

`PRIVATE_READER_REQUIRED = NO`
