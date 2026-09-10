/**
 * Migracion 015: ingress editorial V2 de Investighost.
 *
 * Proposito:
 * - Mantener un mapping durable entre identidad canonica externa y entidad Trawel.
 * - Registrar entregas/receipts privados e idempotentes.
 * - Crear siempre dos borradores editoriales (adventure y student) de forma atomica.
 *
 * Seguridad:
 * - No abre lectura o escritura publica.
 * - La Edge Function interna usa service_role; el frontend no consume estas tablas.
 * - La funcion SQL fuerza status=draft y published_at=NULL.
 * - No toca tablas legacy, mapas, Storage ni colas de comunidad.
 */

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- MAPPING DURABLE DE IDENTIDAD
-- ============================================================================

CREATE TABLE IF NOT EXISTS editorial_destination_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system TEXT NOT NULL DEFAULT 'investighost',
    source_mapping_id TEXT NOT NULL,
    canonical_destination_id TEXT NOT NULL,

    trawel_entity_type TEXT NOT NULL,
    trawel_entity_id TEXT NOT NULL,
    trawel_entity_slug TEXT,
    country_slug TEXT,
    zone_slug TEXT,

    status TEXT NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT editorial_destination_mappings_source_system_check
        CHECK (source_system = 'investighost'),
    CONSTRAINT editorial_destination_mappings_source_mapping_id_check
        CHECK (length(trim(source_mapping_id)) BETWEEN 1 AND 200),
    CONSTRAINT editorial_destination_mappings_canonical_destination_id_check
        CHECK (length(trim(canonical_destination_id)) BETWEEN 1 AND 200),
    CONSTRAINT editorial_destination_mappings_entity_type_check
        CHECK (trawel_entity_type IN ('country', 'zone', 'place', 'route', 'plan', 'static_page', 'generic')),
    CONSTRAINT editorial_destination_mappings_entity_id_check
        CHECK (length(trim(trawel_entity_id)) BETWEEN 1 AND 200),
    CONSTRAINT editorial_destination_mappings_entity_slug_check
        CHECK (trawel_entity_slug IS NULL OR trawel_entity_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT editorial_destination_mappings_country_slug_check
        CHECK (country_slug IS NULL OR country_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT editorial_destination_mappings_zone_slug_check
        CHECK (zone_slug IS NULL OR zone_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT editorial_destination_mappings_status_check
        CHECK (status IN ('active', 'inactive', 'archived')),
    CONSTRAINT editorial_destination_mappings_zone_requires_country_check
        CHECK (zone_slug IS NULL OR country_slug IS NOT NULL),
    CONSTRAINT editorial_destination_mappings_zone_target_check
        CHECK (trawel_entity_type <> 'zone' OR zone_slug IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_destination_mappings_source_canonical
ON editorial_destination_mappings(source_system, canonical_destination_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_destination_mappings_source_mapping
ON editorial_destination_mappings(source_system, source_mapping_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_destination_mappings_active_target
ON editorial_destination_mappings(trawel_entity_type, trawel_entity_id)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_editorial_destination_mappings_active_lookup
ON editorial_destination_mappings(source_system, canonical_destination_id, status);

DROP TRIGGER IF EXISTS update_editorial_destination_mappings_updated_at ON editorial_destination_mappings;
CREATE TRIGGER update_editorial_destination_mappings_updated_at
BEFORE UPDATE ON editorial_destination_mappings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DELIVERIES Y RECEIPTS PRIVADOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS editorial_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system TEXT NOT NULL DEFAULT 'investighost',
    schema_version TEXT NOT NULL,
    handoff_key TEXT NOT NULL,
    payload_fingerprint TEXT NOT NULL,
    source_mapping_id TEXT NOT NULL,
    canonical_destination_id TEXT NOT NULL,
    mapping_id UUID REFERENCES editorial_destination_mappings(id) ON DELETE RESTRICT,

    library_entry_id TEXT NOT NULL,
    version_hash TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    payload JSONB NOT NULL,

    status TEXT NOT NULL DEFAULT 'received',
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_code TEXT,
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT editorial_deliveries_source_system_check
        CHECK (source_system = 'investighost'),
    CONSTRAINT editorial_deliveries_schema_version_check
        CHECK (schema_version = 'v2'),
    CONSTRAINT editorial_deliveries_handoff_key_check
        CHECK (handoff_key ~ '^[A-Za-z0-9._:-]{16,200}$'),
    CONSTRAINT editorial_deliveries_payload_fingerprint_check
        CHECK (payload_fingerprint ~ '^[a-f0-9]{64}$'),
    CONSTRAINT editorial_deliveries_source_mapping_id_check
        CHECK (length(trim(source_mapping_id)) BETWEEN 1 AND 200),
    CONSTRAINT editorial_deliveries_canonical_destination_id_check
        CHECK (length(trim(canonical_destination_id)) BETWEEN 1 AND 200),
    CONSTRAINT editorial_deliveries_library_entry_id_check
        CHECK (length(trim(library_entry_id)) BETWEEN 1 AND 200),
    CONSTRAINT editorial_deliveries_version_hash_check
        CHECK (version_hash ~ '^[a-f0-9]{64}$'),
    CONSTRAINT editorial_deliveries_content_hash_check
        CHECK (content_hash ~ '^[a-f0-9]{64}$'),
    CONSTRAINT editorial_deliveries_payload_object_check
        CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT editorial_deliveries_status_check
        CHECK (status IN ('received', 'processing', 'accepted', 'partial', 'rejected', 'failed')),
    CONSTRAINT editorial_deliveries_processed_at_check
        CHECK (
            (status IN ('accepted', 'partial', 'rejected', 'failed') AND processed_at IS NOT NULL)
            OR (status IN ('received', 'processing') AND processed_at IS NULL)
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_editorial_deliveries_handoff_key
ON editorial_deliveries(handoff_key);

CREATE INDEX IF NOT EXISTS idx_editorial_deliveries_status_received_at
ON editorial_deliveries(status, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_editorial_deliveries_mapping_id
ON editorial_deliveries(mapping_id);

CREATE INDEX IF NOT EXISTS idx_editorial_deliveries_canonical_destination
ON editorial_deliveries(source_system, canonical_destination_id);

DROP TRIGGER IF EXISTS update_editorial_deliveries_updated_at ON editorial_deliveries;
CREATE TRIGGER update_editorial_deliveries_updated_at
BEFORE UPDATE ON editorial_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS editorial_delivery_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES editorial_deliveries(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT editorial_delivery_receipts_event_type_check
        CHECK (event_type IN ('received', 'processing', 'duplicate', 'accepted', 'partial', 'rejected', 'failed', 'conflict')),
    CONSTRAINT editorial_delivery_receipts_metadata_object_check
        CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_editorial_delivery_receipts_delivery_created
ON editorial_delivery_receipts(delivery_id, created_at);

CREATE INDEX IF NOT EXISTS idx_editorial_delivery_receipts_event_created
ON editorial_delivery_receipts(event_type, created_at DESC);

-- ============================================================================
-- INGESTA ATOMICA DE LOS DOS PERFILES
-- ============================================================================

CREATE OR REPLACE FUNCTION ingest_editorial_delivery_v2(
    p_delivery_id UUID,
    p_mapping_id UUID,
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    locked_delivery editorial_deliveries%ROWTYPE;
    active_mapping editorial_destination_mappings%ROWTYPE;
    profile_mode TEXT;
    profile JSONB;
    profile_metadata JSONB;
    created_content_id UUID;
    created_content_ids JSONB := '[]'::jsonb;
    delivery_result JSONB;
BEGIN
    SELECT * INTO locked_delivery
    FROM editorial_deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'editorial delivery not found';
    END IF;

    IF locked_delivery.status = 'accepted' THEN
        RETURN jsonb_build_object(
            'delivery_id', locked_delivery.id,
            'status', locked_delivery.status,
            'idempotent', TRUE,
            'result', locked_delivery.result
        );
    END IF;

    SELECT * INTO active_mapping
    FROM editorial_destination_mappings
    WHERE id = p_mapping_id
      AND source_system = 'investighost'
      AND status = 'active'
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'active editorial destination mapping not found';
    END IF;

    IF active_mapping.canonical_destination_id <> p_payload->>'canonicalDestinationId'
       OR active_mapping.source_mapping_id <> p_payload->>'mappingId' THEN
        RAISE EXCEPTION 'delivery identity does not match active mapping';
    END IF;

    IF jsonb_typeof(p_payload->'profiles') <> 'object'
       OR jsonb_typeof(p_payload #> '{profiles,adventure}') <> 'object'
       OR jsonb_typeof(p_payload #> '{profiles,student}') <> 'object' THEN
        RAISE EXCEPTION 'delivery must contain adventure and student profiles';
    END IF;

    FOR profile_mode IN SELECT unnest(ARRAY['adventure', 'student'])
    LOOP
        profile := p_payload #> ARRAY['profiles', profile_mode];

        IF NULLIF(trim(profile->>'headline'), '') IS NULL THEN
            RAISE EXCEPTION 'profile % requires a headline', profile_mode;
        END IF;

        IF jsonb_typeof(profile->'metadata') = 'object' THEN
            profile_metadata := profile->'metadata';
        ELSE
            profile_metadata := '{}'::jsonb;
        END IF;

        INSERT INTO editorial_contents (
            entity_type,
            entity_id,
            entity_slug,
            country_slug,
            zone_slug,
            mode,
            headline,
            intro,
            what_makes_special,
            highlights,
            suggested_route,
            practical_tips,
            sections,
            sources,
            metadata,
            status,
            review_state,
            published_at
        ) VALUES (
            active_mapping.trawel_entity_type,
            active_mapping.trawel_entity_id,
            active_mapping.trawel_entity_slug,
            active_mapping.country_slug,
            active_mapping.zone_slug,
            profile_mode,
            trim(profile->>'headline'),
            NULLIF(trim(profile->>'intro'), ''),
            NULLIF(trim(profile->>'whatMakesSpecial'), ''),
            CASE WHEN jsonb_typeof(profile->'highlights') = 'array' THEN profile->'highlights' ELSE '[]'::jsonb END,
            NULLIF(trim(profile->>'suggestedRoute'), ''),
            CASE WHEN jsonb_typeof(profile->'practicalTips') = 'array' THEN profile->'practicalTips' ELSE '[]'::jsonb END,
            CASE WHEN jsonb_typeof(profile->'sections') = 'array' THEN profile->'sections' ELSE '[]'::jsonb END,
            CASE WHEN jsonb_typeof(profile->'sources') = 'array' THEN profile->'sources' ELSE '[]'::jsonb END,
            jsonb_build_object(
                'source_system', 'investighost',
                'ingress', jsonb_build_object(
                    'schema_version', p_payload->>'schemaVersion',
                    'handoff_key', p_payload->>'handoffKey',
                    'payload_fingerprint', p_payload->>'payloadFingerprint',
                    'mapping_id', p_payload->>'mappingId',
                    'canonical_destination_id', p_payload->>'canonicalDestinationId',
                    'library_entry_id', p_payload->>'libraryEntryId',
                    'version_hash', p_payload->>'versionHash',
                    'content_hash', p_payload->>'contentHash'
                ),
                'provenance', p_payload->'provenance',
                'approval', p_payload->'approval',
                'source_status', p_payload->'sourceStatus',
                'review', p_payload->'review',
                'profile_metadata', profile_metadata
            ),
            'draft',
            'pending_trawel_review',
            NULL
        )
        RETURNING id INTO created_content_id;

        created_content_ids := created_content_ids || to_jsonb(created_content_id);
    END LOOP;

    delivery_result := jsonb_build_object(
        'editorial_content_ids', created_content_ids,
        'profiles_created', ARRAY['adventure', 'student'],
        'publication', 'draft_only'
    );

    UPDATE editorial_deliveries
    SET
        mapping_id = active_mapping.id,
        status = 'accepted',
        result = delivery_result,
        error_code = NULL,
        error_message = NULL,
        processed_at = NOW()
    WHERE id = locked_delivery.id;

    INSERT INTO editorial_delivery_receipts (delivery_id, event_type, metadata)
    VALUES (
        locked_delivery.id,
        'accepted',
        jsonb_build_object(
            'editorial_content_ids', created_content_ids,
            'publication', 'draft_only'
        )
    );

    RETURN jsonb_build_object(
        'delivery_id', locked_delivery.id,
        'status', 'accepted',
        'idempotent', FALSE,
        'result', delivery_result
    );
END;
$$;

REVOKE ALL ON FUNCTION ingest_editorial_delivery_v2(UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ingest_editorial_delivery_v2(UUID, UUID, JSONB) TO service_role;

-- ============================================================================
-- RLS: SOLO SERVICIOS INTERNOS
-- ============================================================================

ALTER TABLE editorial_destination_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_delivery_receipts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON editorial_destination_mappings FROM anon, authenticated;
REVOKE ALL ON editorial_deliveries FROM anon, authenticated;
REVOKE ALL ON editorial_delivery_receipts FROM anon, authenticated;

COMMENT ON TABLE editorial_destination_mappings IS 'Mapping durable y privado Investighost canonical destination -> entidad Trawel; no se crea automaticamente por deliveries.';
COMMENT ON COLUMN editorial_destination_mappings.source_mapping_id IS 'Identificador durable de mapping emitido por Investighost y validado contra cada delivery V2.';
COMMENT ON TABLE editorial_deliveries IS 'Inbox privada de handoffs editoriales V2; handoff_key es idempotente y payload_fingerprint detecta conflictos.';
COMMENT ON TABLE editorial_delivery_receipts IS 'Eventos durables y privados de procesamiento de editorial_deliveries.';
COMMENT ON FUNCTION ingest_editorial_delivery_v2(UUID, UUID, JSONB) IS 'Crea adventure y student como drafts de forma atomica; nunca publica contenido.';
