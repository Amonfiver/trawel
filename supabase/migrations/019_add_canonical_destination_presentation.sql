/*
 * Canonical destination presentation drawers.
 *
 * This migration extends the existing V2 editorial delivery rather than
 * replacing it. A presentation package is strictly a projection of one
 * editorial_delivery: it is not a second editorial workflow.
 */

ALTER TABLE image_assets
    ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT,
    ADD COLUMN IF NOT EXISTS mime_type TEXT,
    ADD COLUMN IF NOT EXISTS byte_size BIGINT,
    ADD COLUMN IF NOT EXISTS rights_status TEXT;

ALTER TABLE image_assets
    DROP CONSTRAINT IF EXISTS image_assets_status_check;

ALTER TABLE image_assets
    ADD CONSTRAINT image_assets_status_check
        CHECK (status IN ('draft', 'review', 'staged', 'published', 'archived')),
    ADD CONSTRAINT image_assets_checksum_sha256_check
        CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~ '^[a-f0-9]{64}$'),
    ADD CONSTRAINT image_assets_mime_type_check
        CHECK (mime_type IS NULL OR mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    ADD CONSTRAINT image_assets_byte_size_check
        CHECK (byte_size IS NULL OR byte_size > 0),
    ADD CONSTRAINT image_assets_rights_status_check
        CHECK (rights_status IS NULL OR rights_status = 'APPROVED_FOR_PUBLIC_USE');

CREATE UNIQUE INDEX IF NOT EXISTS idx_image_assets_checksum_sha256_unique
ON image_assets(checksum_sha256)
WHERE checksum_sha256 IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'destination-media',
    'destination-media',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = TRUE,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow public read access to destination-media" ON storage.objects;
CREATE POLICY "Allow public read access to destination-media"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'destination-media');

CREATE TABLE IF NOT EXISTS destination_presentation_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL UNIQUE REFERENCES editorial_deliveries(id) ON DELETE RESTRICT,
    mapping_id UUID NOT NULL REFERENCES editorial_destination_mappings(id) ON DELETE RESTRICT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_slug TEXT,
    country_slug TEXT,
    zone_slug TEXT,
    status TEXT NOT NULL DEFAULT 'staged',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT destination_presentation_packages_entity_type_check
        CHECK (entity_type IN ('country', 'zone', 'place', 'route', 'plan', 'static_page', 'generic')),
    CONSTRAINT destination_presentation_packages_status_check
        CHECK (status IN ('staged', 'published', 'archived')),
    CONSTRAINT destination_presentation_packages_zone_check
        CHECK (zone_slug IS NULL OR country_slug IS NOT NULL),
    CONSTRAINT destination_presentation_packages_published_at_check
        CHECK ((status = 'published' AND published_at IS NOT NULL) OR (status <> 'published'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_destination_presentation_packages_one_published_mapping
ON destination_presentation_packages(mapping_id)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_destination_presentation_packages_public_lookup
ON destination_presentation_packages(country_slug, zone_slug, published_at DESC)
WHERE status = 'published';

ALTER TABLE editorial_contents
    ADD COLUMN IF NOT EXISTS presentation_package_id UUID
    REFERENCES destination_presentation_packages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_editorial_contents_presentation_package
ON editorial_contents(presentation_package_id, mode, status);

CREATE OR REPLACE FUNCTION is_safe_editorial_cta(p_cta JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT
      p_cta IS NULL
      OR (
        jsonb_typeof(p_cta) = 'object'
        AND length(trim(coalesce(p_cta->>'label', ''))) BETWEEN 1 AND 160
        AND p_cta->>'actionType' IN ('ANCHOR', 'INTERNAL_ROUTE', 'EXTERNAL_URL')
        AND (
          (p_cta->>'actionType' = 'ANCHOR' AND coalesce(p_cta->>'target', '') ~ '^#[A-Za-z][A-Za-z0-9_-]*$')
          OR (p_cta->>'actionType' = 'INTERNAL_ROUTE' AND coalesce(p_cta->>'target', '') ~ '^/[A-Za-z0-9/_?=&%.-]*$' AND p_cta->>'target' !~ '^//')
          OR (p_cta->>'actionType' = 'EXTERNAL_URL' AND coalesce(p_cta->>'target', '') ~ '^https://')
        )
      );
$$;

CREATE TABLE IF NOT EXISTS destination_visual_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES destination_presentation_packages(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES image_assets(id) ON DELETE RESTRICT,
    mode TEXT NOT NULL DEFAULT 'both',
    slot TEXT NOT NULL,
    selection_order INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL,
    title TEXT,
    kicker TEXT,
    short_copy TEXT,
    caption TEXT,
    presentation_tone TEXT NOT NULL,
    text_placement TEXT NOT NULL,
    linked_adventure_section TEXT,
    cta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT destination_visual_selections_mode_check
        CHECK (mode IN ('adventure', 'student', 'both')),
    CONSTRAINT destination_visual_selections_slot_check
        CHECK (slot IN ('HERO', 'DESTINATION_VISUAL_STORY')),
    CONSTRAINT destination_visual_selections_role_check
        CHECK ((slot = 'HERO' AND role = 'HERO') OR (slot = 'DESTINATION_VISUAL_STORY' AND role = 'VISUAL_STORY')),
    CONSTRAINT destination_visual_selections_order_check
        CHECK (selection_order >= 0),
    CONSTRAINT destination_visual_selections_tone_check
        CHECK (presentation_tone IN ('IMPACT', 'ADVENTURE', 'CULTURE', 'LANDSCAPE', 'FOOD', 'LOCAL_LIFE', 'NIGHT', 'CALM', 'PREMIUM')),
    CONSTRAINT destination_visual_selections_text_placement_check
        CHECK (text_placement IN ('OVERLAY', 'BELOW_MEDIA', 'CARD_OVERLAY', 'INLINE')),
    CONSTRAINT destination_visual_selections_cta_check
        CHECK (is_safe_editorial_cta(cta))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_destination_visual_selections_one_hero
ON destination_visual_selections(package_id)
WHERE slot = 'HERO';

CREATE UNIQUE INDEX IF NOT EXISTS idx_destination_visual_selections_order
ON destination_visual_selections(package_id, slot, selection_order);

CREATE TABLE IF NOT EXISTS destination_places_to_go (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES destination_presentation_packages(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    selection_order INTEGER NOT NULL,
    area TEXT,
    asset_id UUID REFERENCES image_assets(id) ON DELETE RESTRICT,
    short_description TEXT NOT NULL,
    reason_to_go TEXT NOT NULL,
    caption TEXT,
    presentation_tone TEXT,
    address TEXT,
    url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT destination_places_to_go_category_check
        CHECK (category IN ('STAY', 'EAT', 'DRINK', 'NIGHTLIFE')),
    CONSTRAINT destination_places_to_go_name_check
        CHECK (length(trim(name)) BETWEEN 1 AND 220),
    CONSTRAINT destination_places_to_go_order_check
        CHECK (selection_order >= 0),
    CONSTRAINT destination_places_to_go_description_check
        CHECK (length(trim(short_description)) BETWEEN 1 AND 1000 AND length(trim(reason_to_go)) BETWEEN 1 AND 1000),
    CONSTRAINT destination_places_to_go_tone_check
        CHECK (presentation_tone IS NULL OR presentation_tone IN ('IMPACT', 'ADVENTURE', 'CULTURE', 'LANDSCAPE', 'FOOD', 'LOCAL_LIFE', 'NIGHT', 'CALM', 'PREMIUM')),
    CONSTRAINT destination_places_to_go_url_check
        CHECK (url IS NULL OR url ~ '^https://'),
    CONSTRAINT destination_places_to_go_latitude_check
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT destination_places_to_go_longitude_check
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_destination_places_to_go_order
ON destination_places_to_go(package_id, category, selection_order);

CREATE INDEX IF NOT EXISTS idx_destination_places_to_go_package
ON destination_places_to_go(package_id, selection_order);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_destination_presentation_packages_updated_at') THEN
        CREATE TRIGGER update_destination_presentation_packages_updated_at
        BEFORE UPDATE ON destination_presentation_packages
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_destination_visual_selections_updated_at') THEN
        CREATE TRIGGER update_destination_visual_selections_updated_at
        BEFORE UPDATE ON destination_visual_selections
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_destination_places_to_go_updated_at') THEN
        CREATE TRIGGER update_destination_places_to_go_updated_at
        BEFORE UPDATE ON destination_places_to_go
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

ALTER TABLE destination_presentation_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_visual_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_places_to_go ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON destination_presentation_packages, destination_visual_selections, destination_places_to_go TO anon, authenticated;

CREATE POLICY "Allow public read of published destination packages"
ON destination_presentation_packages FOR SELECT TO anon, authenticated
USING (status = 'published');

CREATE POLICY "Allow public read of published package visual selections"
ON destination_visual_selections FOR SELECT TO anon, authenticated
USING (EXISTS (
    SELECT 1 FROM destination_presentation_packages package
    WHERE package.id = package_id AND package.status = 'published'
));

CREATE POLICY "Allow public read of published package places"
ON destination_places_to_go FOR SELECT TO anon, authenticated
USING (EXISTS (
    SELECT 1 FROM destination_presentation_packages package
    WHERE package.id = package_id AND package.status = 'published'
));

COMMENT ON TABLE destination_presentation_packages IS 'Published technical package projected from one accepted editorial delivery; no editorial workflow lives in Trawel.';
COMMENT ON TABLE destination_visual_selections IS 'Canonical Hero and Destination Visual Story selections; asset provenance remains in image_assets.';
COMMENT ON TABLE destination_places_to_go IS 'Approved practical destination places delivered by Investighost; Trawel does not rank or validate recommendations.';
