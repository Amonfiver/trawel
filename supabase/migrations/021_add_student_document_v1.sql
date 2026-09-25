/* Canonical ordered Student document. This is an optional V2 profile extension. */

ALTER TABLE editorial_contents
    ADD COLUMN IF NOT EXISTS student_document JSONB;

ALTER TABLE editorial_contents
    ADD CONSTRAINT editorial_contents_student_document_object_check
    CHECK (student_document IS NULL OR jsonb_typeof(student_document) = 'object');

CREATE OR REPLACE FUNCTION is_valid_student_document_v1(p_document JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE block JSONB; item JSONB;
BEGIN
    IF jsonb_typeof(p_document) <> 'object'
       OR p_document->>'version' <> 'student-document-v1'
       OR NULLIF(trim(p_document->>'headline'), '') IS NULL
       OR jsonb_typeof(p_document->'lead') <> 'array'
       OR jsonb_typeof(p_document->'blocks') <> 'array'
       OR jsonb_array_length(p_document->'blocks') = 0 THEN RETURN FALSE; END IF;
    FOR item IN SELECT value FROM jsonb_array_elements(p_document->'lead') LOOP
        IF jsonb_typeof(item) <> 'string' OR NULLIF(trim(item #>> '{}'), '') IS NULL THEN RETURN FALSE; END IF;
    END LOOP;
    FOR block IN SELECT value FROM jsonb_array_elements(p_document->'blocks') LOOP
        IF jsonb_typeof(block) <> 'object' THEN RETURN FALSE; END IF;
        CASE block->>'type'
        WHEN 'paragraph' THEN IF NULLIF(trim(block->>'text'), '') IS NULL THEN RETURN FALSE; END IF;
        WHEN 'heading' THEN IF block->>'level' NOT IN ('2','3') OR NULLIF(trim(block->>'text'), '') IS NULL OR (block ? 'id' AND NULLIF(trim(block->>'id'), '') IS NULL) THEN RETURN FALSE; END IF;
        WHEN 'figure' THEN IF NULLIF(trim(block->>'assetId'), '') IS NULL OR NULLIF(trim(block->>'alt'), '') IS NULL OR block->>'placement' NOT IN ('INLINE','WIDE') OR (block ? 'caption' AND NULLIF(trim(block->>'caption'), '') IS NULL) THEN RETURN FALSE; END IF;
        WHEN 'list' THEN IF block->>'style' NOT IN ('unordered','ordered') OR jsonb_typeof(block->'items') <> 'array' OR jsonb_array_length(block->'items') = 0 THEN RETURN FALSE; END IF;
        WHEN 'key_facts' THEN IF jsonb_typeof(block->'items') <> 'array' OR jsonb_array_length(block->'items') = 0 THEN RETURN FALSE; END IF;
        WHEN 'callout' THEN IF block->>'tone' NOT IN ('NOTE','CONTEXT','DEFINITION') OR NULLIF(trim(block->>'text'), '') IS NULL THEN RETURN FALSE; END IF;
        WHEN 'timeline' THEN IF jsonb_typeof(block->'items') <> 'array' OR jsonb_array_length(block->'items') = 0 THEN RETURN FALSE; END IF;
        WHEN 'references' THEN IF jsonb_typeof(block->'items') <> 'array' OR jsonb_array_length(block->'items') = 0 THEN RETURN FALSE; END IF;
        ELSE RETURN FALSE;
        END CASE;
    END LOOP;
    IF NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_document->'blocks') AS candidate(value)
        WHERE candidate.value->>'type' <> 'heading'
    ) THEN RETURN FALSE; END IF;
    RETURN TRUE;
END;
$$;

/* Keep the existing V2 projection byte-for-byte compatible and wrap it only for the optional field. */
ALTER FUNCTION ingest_editorial_delivery_v2(UUID, UUID, JSONB) RENAME TO ingest_editorial_delivery_v2_legacy;

CREATE FUNCTION ingest_editorial_delivery_v2(p_delivery_id UUID, p_mapping_id UUID, p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE document JSONB; figure JSONB; asset UUID; result JSONB;
BEGIN
    document := p_payload #> '{profiles,student,document}';
    IF document IS NOT NULL THEN
        IF NOT is_valid_student_document_v1(document) THEN RAISE EXCEPTION 'profiles.student.document is invalid'; END IF;
        FOR figure IN SELECT value FROM jsonb_array_elements(document->'blocks') WHERE value->>'type' = 'figure'
        LOOP
            BEGIN asset := (figure->>'assetId')::uuid; EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'StudentDocumentV1 figure assetId must be a UUID'; END;
            PERFORM 1 FROM image_assets WHERE id = asset AND status IN ('staged','published') AND rights_status = 'APPROVED_FOR_PUBLIC_USE' FOR SHARE;
            IF NOT FOUND THEN RAISE EXCEPTION 'StudentDocumentV1 references an unknown or unapproved asset'; END IF;
        END LOOP;
    END IF;
    result := ingest_editorial_delivery_v2_legacy(p_delivery_id, p_mapping_id, p_payload);
    IF document IS NOT NULL THEN
        UPDATE editorial_contents
        SET student_document = document
        WHERE id IN (SELECT (value #>> '{}')::uuid FROM jsonb_array_elements(result #> '{result,editorial_content_ids}'))
          AND mode = 'student';
        UPDATE image_assets
        SET status = 'published', published_at = COALESCE(published_at, NOW())
        WHERE id IN (
            SELECT (value->>'assetId')::uuid
            FROM jsonb_array_elements(document->'blocks')
            WHERE value->>'type' = 'figure'
        ) AND status = 'staged';
    END IF;
    RETURN result;
END;
$$;

COMMENT ON COLUMN editorial_contents.student_document IS 'Optional StudentDocumentV1 owned and ordered by Investighost; Trawel renders its typed blocks only.';
COMMENT ON FUNCTION ingest_editorial_delivery_v2(UUID, UUID, JSONB) IS 'V2-compatible ingest with optional StudentDocumentV1 validation, asset checks and persistence.';
