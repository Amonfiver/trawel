/*
 * Investighost is the editorial authority. A valid V2 delivery is already
 * approved content, so Trawel stores it directly in its public read state.
 */

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
    profile_investighost JSONB;
    profile_current_approved JSONB;
    profile_has_traceability BOOLEAN;
    projected_library_entry_id TEXT;
    projected_version_hash TEXT;
    projected_content_hash TEXT;
    projected_provenance JSONB;
    projected_approval JSONB;
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

        profile_investighost := profile_metadata->'investighost';
        profile_current_approved := profile_investighost->'currentApproved';
        profile_has_traceability :=
            jsonb_typeof(profile_investighost) = 'object'
            AND NULLIF(trim(profile_investighost->>'libraryEntryId'), '') IS NOT NULL
            AND jsonb_typeof(profile_current_approved) = 'object'
            AND NULLIF(trim(profile_current_approved->>'versionHash'), '') IS NOT NULL
            AND NULLIF(trim(profile_current_approved->>'contentHash'), '') IS NOT NULL
            AND NULLIF(trim(profile_current_approved->>'approvalDecisionId'), '') IS NOT NULL;

        IF profile_has_traceability THEN
            projected_library_entry_id := profile_investighost->>'libraryEntryId';
            projected_version_hash := profile_current_approved->>'versionHash';
            projected_content_hash := profile_current_approved->>'contentHash';
            projected_provenance := jsonb_strip_nulls(jsonb_build_object(
                'source', profile_current_approved->'source',
                'versionId', profile_current_approved->'versionId',
                'revisionId', profile_current_approved->'revisionId',
                'originVersionHash', profile_current_approved->'originVersionHash',
                'profile', profile_mode
            ));
            projected_approval := jsonb_strip_nulls(jsonb_build_object(
                'kind', CASE
                    WHEN profile_current_approved->>'source' = 'origin_v1' THEN 'terminal'
                    ELSE 'library_version'
                END,
                'decisionId', profile_current_approved->>'approvalDecisionId',
                'approvedAt', profile_current_approved->'approvedAt'
            ));
        ELSE
            projected_library_entry_id := p_payload->>'libraryEntryId';
            projected_version_hash := p_payload->>'versionHash';
            projected_content_hash := p_payload->>'contentHash';
            projected_provenance := p_payload->'provenance';
            projected_approval := p_payload->'approval';
        END IF;

        INSERT INTO editorial_contents (
            entity_type, entity_id, entity_slug, country_slug, zone_slug, mode,
            headline, intro, what_makes_special, highlights, suggested_route,
            practical_tips, sections, sources, metadata, status, review_state, published_at
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
                    'library_entry_id', projected_library_entry_id,
                    'version_hash', projected_version_hash,
                    'content_hash', projected_content_hash
                ),
                'provenance', projected_provenance,
                'approval', projected_approval,
                'source_status', p_payload->'sourceStatus',
                'review', p_payload->'review',
                'profile_metadata', profile_metadata
            ),
            'published',
            'approved_by_investighost',
            NOW()
        )
        RETURNING id INTO created_content_id;

        created_content_ids := created_content_ids || to_jsonb(created_content_id);
    END LOOP;

    delivery_result := jsonb_build_object(
        'editorial_content_ids', created_content_ids,
        'profiles_created', ARRAY['adventure', 'student'],
        'publication', 'available_to_trawel'
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
            'publication', 'available_to_trawel'
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

COMMENT ON FUNCTION ingest_editorial_delivery_v2(UUID, UUID, JSONB) IS
  'Guarda los perfiles Adventure y Student ya aprobados por Investighost como disponibles para lectura publica de Trawel.';

-- Cuenca ya fue aprobada y entregada. Solo cambia disponibilidad técnica;
-- no cambia texto, hashes, trazabilidad ni crea una entrega o versión nueva.
UPDATE editorial_contents
SET
    status = 'published',
    review_state = 'approved_by_investighost',
    published_at = COALESCE(published_at, NOW())
WHERE id IN (
    '09848207-55e6-4230-a337-48750ccd1d86',
    '31e5c8bd-f8be-422c-bc3d-e7cd712d2bd9'
);

UPDATE editorial_deliveries
SET result = jsonb_set(COALESCE(result, '{}'::jsonb), '{publication}', '"available_to_trawel"'::jsonb, TRUE)
WHERE id = 'd81c7ef3-0ff1-4590-b91b-819e8611aa82';
