/* V2-compatible atomic projection of optional canonical presentation ingredients. */

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
    presentation JSONB;
    hero JSONB;
    story_item JSONB;
    place_item JSONB;
    referenced_asset_id UUID;
    presentation_package_id UUID;
    story_index INTEGER := 0;
BEGIN
    SELECT * INTO locked_delivery
    FROM editorial_deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'editorial delivery not found'; END IF;
    IF locked_delivery.status = 'accepted' THEN
        RETURN jsonb_build_object('delivery_id', locked_delivery.id, 'status', locked_delivery.status, 'idempotent', TRUE, 'result', locked_delivery.result);
    END IF;

    SELECT * INTO active_mapping
    FROM editorial_destination_mappings
    WHERE id = p_mapping_id AND source_system = 'investighost' AND status = 'active'
    FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'active editorial destination mapping not found'; END IF;
    IF active_mapping.canonical_destination_id <> p_payload->>'canonicalDestinationId'
       OR active_mapping.source_mapping_id <> p_payload->>'mappingId' THEN
        RAISE EXCEPTION 'delivery identity does not match active mapping';
    END IF;
    IF jsonb_typeof(p_payload->'profiles') <> 'object'
       OR jsonb_typeof(p_payload #> '{profiles,adventure}') <> 'object'
       OR jsonb_typeof(p_payload #> '{profiles,student}') <> 'object' THEN
        RAISE EXCEPTION 'delivery must contain adventure and student profiles';
    END IF;

    presentation := p_payload->'presentationPackage';
    IF presentation IS NOT NULL THEN
        IF jsonb_typeof(presentation) <> 'object' THEN RAISE EXCEPTION 'presentationPackage must be an object'; END IF;
        hero := presentation->'hero';
        IF jsonb_typeof(hero) <> 'object'
           OR NULLIF(trim(hero->>'trawelMediaId'), '') IS NULL
           OR NULLIF(trim(hero->>'title'), '') IS NULL
           OR NULLIF(trim(hero->>'shortCopy'), '') IS NULL
           OR hero->>'presentationTone' NOT IN ('IMPACT','ADVENTURE','CULTURE','LANDSCAPE','FOOD','LOCAL_LIFE','NIGHT','CALM','PREMIUM')
           OR hero->>'textPlacement' NOT IN ('OVERLAY','BELOW_MEDIA','CARD_OVERLAY','INLINE')
           OR NOT is_safe_editorial_cta(hero->'cta') THEN
            RAISE EXCEPTION 'presentationPackage.hero is invalid';
        END IF;
        IF jsonb_typeof(presentation->'destinationVisualStory') <> 'array'
           OR jsonb_array_length(presentation->'destinationVisualStory') = 0 THEN
            RAISE EXCEPTION 'presentationPackage.destinationVisualStory requires at least one item';
        END IF;
        IF jsonb_typeof(presentation->'placesToGo') <> 'array' THEN
            RAISE EXCEPTION 'presentationPackage.placesToGo must be an array';
        END IF;

        SELECT id INTO referenced_asset_id
        FROM image_assets
        WHERE id = (hero->>'trawelMediaId')::uuid
          AND status IN ('staged','published')
          AND rights_status = 'APPROVED_FOR_PUBLIC_USE'
        FOR SHARE;
        IF NOT FOUND THEN RAISE EXCEPTION 'hero references an unknown or unpublished-rights media asset'; END IF;

        FOR story_item IN SELECT value FROM jsonb_array_elements(presentation->'destinationVisualStory')
        LOOP
            IF jsonb_typeof(story_item) <> 'object'
               OR NULLIF(trim(story_item->>'trawelMediaId'), '') IS NULL
               OR story_item->>'presentationTone' NOT IN ('IMPACT','ADVENTURE','CULTURE','LANDSCAPE','FOOD','LOCAL_LIFE','NIGHT','CALM','PREMIUM')
               OR story_item->>'textPlacement' NOT IN ('OVERLAY','BELOW_MEDIA','CARD_OVERLAY','INLINE')
               OR NOT is_safe_editorial_cta(story_item->'cta') THEN
                RAISE EXCEPTION 'destinationVisualStory item is invalid';
            END IF;
            SELECT id INTO referenced_asset_id FROM image_assets
            WHERE id = (story_item->>'trawelMediaId')::uuid
              AND status IN ('staged','published')
              AND rights_status = 'APPROVED_FOR_PUBLIC_USE'
            FOR SHARE;
            IF NOT FOUND THEN RAISE EXCEPTION 'destinationVisualStory references an unknown or unpublished-rights media asset'; END IF;
        END LOOP;

        FOR place_item IN SELECT value FROM jsonb_array_elements(presentation->'placesToGo')
        LOOP
            IF jsonb_typeof(place_item) <> 'object'
               OR place_item->>'category' NOT IN ('STAY','EAT','DRINK','NIGHTLIFE')
               OR NULLIF(trim(place_item->>'name'), '') IS NULL
               OR NULLIF(trim(place_item->>'shortDescription'), '') IS NULL
               OR NULLIF(trim(place_item->>'reasonToGo'), '') IS NULL
               OR (NULLIF(trim(place_item->>'url'), '') IS NOT NULL AND place_item->>'url' !~ '^https://')
               OR (place_item ? 'latitude' AND ((place_item->>'latitude') !~ '^-?[0-9]+([.][0-9]+)?$' OR (place_item->>'latitude')::numeric NOT BETWEEN -90 AND 90))
               OR (place_item ? 'longitude' AND ((place_item->>'longitude') !~ '^-?[0-9]+([.][0-9]+)?$' OR (place_item->>'longitude')::numeric NOT BETWEEN -180 AND 180)) THEN
                RAISE EXCEPTION 'placesToGo item is invalid';
            END IF;
            IF NULLIF(trim(place_item->>'trawelMediaId'), '') IS NOT NULL THEN
                SELECT id INTO referenced_asset_id FROM image_assets
                WHERE id = (place_item->>'trawelMediaId')::uuid
                  AND status IN ('staged','published')
                  AND rights_status = 'APPROVED_FOR_PUBLIC_USE'
                FOR SHARE;
                IF NOT FOUND THEN RAISE EXCEPTION 'placesToGo references an unknown or unpublished-rights media asset'; END IF;
            END IF;
        END LOOP;

        UPDATE destination_presentation_packages
        SET status = 'archived'
        WHERE mapping_id = active_mapping.id AND status = 'published';

        INSERT INTO destination_presentation_packages (
            delivery_id, mapping_id, entity_type, entity_id, entity_slug, country_slug, zone_slug, status, published_at
        ) VALUES (
            locked_delivery.id, active_mapping.id, active_mapping.trawel_entity_type, active_mapping.trawel_entity_id,
            active_mapping.trawel_entity_slug, active_mapping.country_slug, active_mapping.zone_slug, 'published', NOW()
        ) RETURNING id INTO presentation_package_id;

        INSERT INTO destination_visual_selections (
            package_id, asset_id, mode, slot, selection_order, role, title, kicker, short_copy, caption, presentation_tone, text_placement, cta
        ) VALUES (
            presentation_package_id, (hero->>'trawelMediaId')::uuid, coalesce(hero->>'mode', 'both'), 'HERO', 0, 'HERO',
            trim(hero->>'title'), NULLIF(trim(hero->>'kicker'), ''), trim(hero->>'shortCopy'), NULLIF(trim(hero->>'caption'), ''),
            hero->>'presentationTone', hero->>'textPlacement', hero->'cta'
        );

        story_index := 0;
        FOR story_item IN SELECT value FROM jsonb_array_elements(presentation->'destinationVisualStory')
        LOOP
            INSERT INTO destination_visual_selections (
                package_id, asset_id, mode, slot, selection_order, role, title, kicker, short_copy, caption,
                presentation_tone, text_placement, linked_adventure_section, cta
            ) VALUES (
                presentation_package_id, (story_item->>'trawelMediaId')::uuid, coalesce(story_item->>'mode', 'adventure'),
                'DESTINATION_VISUAL_STORY', coalesce((story_item->>'order')::integer, story_index), 'VISUAL_STORY',
                NULLIF(trim(story_item->>'title'), ''), NULLIF(trim(story_item->>'kicker'), ''), NULLIF(trim(story_item->>'shortCopy'), ''),
                NULLIF(trim(story_item->>'caption'), ''), story_item->>'presentationTone', story_item->>'textPlacement',
                NULLIF(trim(story_item->>'linkedAdventureSection'), ''), story_item->'cta'
            );
            story_index := story_index + 1;
        END LOOP;

        FOR place_item IN SELECT value FROM jsonb_array_elements(presentation->'placesToGo')
        LOOP
            INSERT INTO destination_places_to_go (
                package_id, category, name, selection_order, area, asset_id, short_description, reason_to_go, caption,
                presentation_tone, address, url, latitude, longitude
            ) VALUES (
                presentation_package_id, place_item->>'category', trim(place_item->>'name'), (place_item->>'order')::integer,
                NULLIF(trim(place_item->>'area'), ''), NULLIF(trim(place_item->>'trawelMediaId'), '')::uuid,
                trim(place_item->>'shortDescription'), trim(place_item->>'reasonToGo'), NULLIF(trim(place_item->>'caption'), ''),
                NULLIF(trim(place_item->>'presentationTone'), ''), NULLIF(trim(place_item->>'address'), ''),
                NULLIF(trim(place_item->>'url'), ''), NULLIF(trim(place_item->>'latitude'), '')::numeric, NULLIF(trim(place_item->>'longitude'), '')::numeric
            );
        END LOOP;

        UPDATE image_assets SET status = 'published', published_at = COALESCE(published_at, NOW())
        WHERE status = 'staged' AND id IN (
            SELECT asset_id FROM destination_visual_selections WHERE package_id = presentation_package_id
            UNION
            SELECT asset_id FROM destination_places_to_go WHERE package_id = presentation_package_id AND asset_id IS NOT NULL
        );
    END IF;

    FOR profile_mode IN SELECT unnest(ARRAY['adventure', 'student'])
    LOOP
        profile := p_payload #> ARRAY['profiles', profile_mode];
        IF NULLIF(trim(profile->>'headline'), '') IS NULL THEN RAISE EXCEPTION 'profile % requires a headline', profile_mode; END IF;
        profile_metadata := CASE WHEN jsonb_typeof(profile->'metadata') = 'object' THEN profile->'metadata' ELSE '{}'::jsonb END;
        profile_investighost := profile_metadata->'investighost';
        profile_current_approved := profile_investighost->'currentApproved';
        profile_has_traceability := jsonb_typeof(profile_investighost) = 'object'
            AND NULLIF(trim(profile_investighost->>'libraryEntryId'), '') IS NOT NULL
            AND jsonb_typeof(profile_current_approved) = 'object'
            AND NULLIF(trim(profile_current_approved->>'versionHash'), '') IS NOT NULL
            AND NULLIF(trim(profile_current_approved->>'contentHash'), '') IS NOT NULL
            AND NULLIF(trim(profile_current_approved->>'approvalDecisionId'), '') IS NOT NULL;
        IF profile_has_traceability THEN
            projected_library_entry_id := profile_investighost->>'libraryEntryId';
            projected_version_hash := profile_current_approved->>'versionHash';
            projected_content_hash := profile_current_approved->>'contentHash';
            projected_provenance := jsonb_strip_nulls(jsonb_build_object('source', profile_current_approved->'source', 'versionId', profile_current_approved->'versionId', 'revisionId', profile_current_approved->'revisionId', 'originVersionHash', profile_current_approved->'originVersionHash', 'profile', profile_mode));
            projected_approval := jsonb_strip_nulls(jsonb_build_object('kind', CASE WHEN profile_current_approved->>'source' = 'origin_v1' THEN 'terminal' ELSE 'library_version' END, 'decisionId', profile_current_approved->'approvalDecisionId', 'approvedAt', profile_current_approved->'approvedAt'));
        ELSE
            projected_library_entry_id := p_payload->>'libraryEntryId'; projected_version_hash := p_payload->>'versionHash'; projected_content_hash := p_payload->>'contentHash'; projected_provenance := p_payload->'provenance'; projected_approval := p_payload->'approval';
        END IF;
        INSERT INTO editorial_contents (
            entity_type, entity_id, entity_slug, country_slug, zone_slug, mode, headline, intro, what_makes_special,
            highlights, suggested_route, practical_tips, sections, sources, metadata, presentation_package_id, status, review_state, published_at
        ) VALUES (
            active_mapping.trawel_entity_type, active_mapping.trawel_entity_id, active_mapping.trawel_entity_slug,
            active_mapping.country_slug, active_mapping.zone_slug, profile_mode, trim(profile->>'headline'),
            NULLIF(trim(profile->>'intro'), ''), NULLIF(trim(profile->>'whatMakesSpecial'), ''),
            CASE WHEN jsonb_typeof(profile->'highlights') = 'array' THEN profile->'highlights' ELSE '[]'::jsonb END,
            NULLIF(trim(profile->>'suggestedRoute'), ''), CASE WHEN jsonb_typeof(profile->'practicalTips') = 'array' THEN profile->'practicalTips' ELSE '[]'::jsonb END,
            CASE WHEN jsonb_typeof(profile->'sections') = 'array' THEN profile->'sections' ELSE '[]'::jsonb END,
            CASE WHEN jsonb_typeof(profile->'sources') = 'array' THEN profile->'sources' ELSE '[]'::jsonb END,
            jsonb_strip_nulls(jsonb_build_object(
                'source_system', 'investighost',
                'ingress', jsonb_build_object('schema_version', p_payload->>'schemaVersion', 'handoff_key', p_payload->>'handoffKey', 'payload_fingerprint', p_payload->>'payloadFingerprint', 'mapping_id', p_payload->>'mappingId', 'canonical_destination_id', p_payload->>'canonicalDestinationId', 'library_entry_id', projected_library_entry_id, 'version_hash', projected_version_hash, 'content_hash', projected_content_hash, 'presentation_package_id', presentation_package_id),
                'provenance', projected_provenance, 'approval', projected_approval, 'source_status', p_payload->'sourceStatus', 'review', p_payload->'review', 'profile_metadata', profile_metadata
            )), presentation_package_id, 'published', 'approved_by_investighost', NOW()
        ) RETURNING id INTO created_content_id;
        created_content_ids := created_content_ids || to_jsonb(created_content_id);
    END LOOP;

    delivery_result := jsonb_strip_nulls(jsonb_build_object(
        'editorial_content_ids', created_content_ids, 'profiles_created', ARRAY['adventure', 'student'],
        'presentation_package_id', presentation_package_id, 'publication', 'available_to_trawel'
    ));
    UPDATE editorial_deliveries SET mapping_id = active_mapping.id, status = 'accepted', result = delivery_result, error_code = NULL, error_message = NULL, processed_at = NOW() WHERE id = locked_delivery.id;
    INSERT INTO editorial_delivery_receipts (delivery_id, event_type, metadata) VALUES (locked_delivery.id, 'accepted', jsonb_strip_nulls(jsonb_build_object('editorial_content_ids', created_content_ids, 'presentation_package_id', presentation_package_id, 'publication', 'available_to_trawel')));
    RETURN jsonb_build_object('delivery_id', locked_delivery.id, 'status', 'accepted', 'idempotent', FALSE, 'result', delivery_result);
END;
$$;

COMMENT ON FUNCTION ingest_editorial_delivery_v2(UUID, UUID, JSONB) IS 'Keeps textual V2 delivery compatibility and atomically publishes an optional canonical presentation package.';
