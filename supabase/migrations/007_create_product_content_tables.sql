/**
 * Migracion 007: Tablas productivas data-driven en paralelo
 *
 * Proposito:
 * Preparar Trawel para consumir contenido publicado desde Supabase trawel-prod
 * sin modificar ni borrar tablas legacy existentes.
 *
 * Alcance:
 * - Tablas nuevas: editorial_contents, image_assets, static_pages,
 *   demand_signals, promotions
 * - Indices para consultas publicas y editoriales frecuentes
 * - RLS: lectura publica solo de registros published
 * - Sin politicas publicas de escritura
 *
 * Seguridad:
 * - Trawel publico solo lee contenido publicado.
 * - Investighost/admin/backend deben escribir con service_role o roles internos futuros.
 * - No toca Storage, Edge Functions, mapas, comunidad ni tablas legacy.
 */

-- ============================================
-- EXTENSIONES
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- FUNCION: updated_at automatico
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TABLA: EDITORIAL_CONTENTS
-- ============================================

CREATE TABLE IF NOT EXISTS editorial_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    entity_type TEXT NOT NULL,
    entity_id TEXT,
    entity_slug TEXT,
    country_slug TEXT,
    zone_slug TEXT,
    mode TEXT,

    headline TEXT NOT NULL,
    intro TEXT,
    what_makes_special TEXT,
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggested_route TEXT,
    practical_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    status TEXT NOT NULL DEFAULT 'draft',
    review_state TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT editorial_contents_entity_type_check
        CHECK (entity_type IN ('country', 'zone', 'place', 'route', 'plan', 'static_page', 'generic')),
    CONSTRAINT editorial_contents_mode_check
        CHECK (mode IS NULL OR mode IN ('adventure', 'student')),
    CONSTRAINT editorial_contents_status_check
        CHECK (status IN ('draft', 'review', 'published', 'archived')),
    CONSTRAINT editorial_contents_slug_presence_check
        CHECK (entity_id IS NOT NULL OR entity_slug IS NOT NULL OR country_slug IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_editorial_contents_entity
ON editorial_contents(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_editorial_contents_entity_slug
ON editorial_contents(entity_type, entity_slug);

CREATE INDEX IF NOT EXISTS idx_editorial_contents_country_zone
ON editorial_contents(country_slug, zone_slug);

CREATE INDEX IF NOT EXISTS idx_editorial_contents_status
ON editorial_contents(status);

CREATE INDEX IF NOT EXISTS idx_editorial_contents_public_lookup
ON editorial_contents(entity_type, country_slug, zone_slug, mode, status);

-- ============================================
-- TABLA: IMAGE_ASSETS
-- ============================================

CREATE TABLE IF NOT EXISTS image_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    entity_type TEXT NOT NULL,
    entity_id TEXT,
    entity_slug TEXT,
    country_slug TEXT,
    zone_slug TEXT,

    storage_bucket TEXT,
    storage_path TEXT,
    public_url TEXT,
    alt TEXT NOT NULL,
    caption TEXT,
    credit TEXT,
    license TEXT,
    source TEXT,
    usage_type TEXT NOT NULL DEFAULT 'inline',
    focal_point JSONB NOT NULL DEFAULT '{}'::jsonb,
    width INTEGER,
    height INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    status TEXT NOT NULL DEFAULT 'draft',
    review_state TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT image_assets_entity_type_check
        CHECK (entity_type IN ('country', 'zone', 'place', 'route', 'plan', 'static_page', 'promotion', 'generic')),
    CONSTRAINT image_assets_usage_type_check
        CHECK (usage_type IN ('hero', 'card', 'gallery', 'inline', 'sponsor')),
    CONSTRAINT image_assets_status_check
        CHECK (status IN ('draft', 'review', 'published', 'archived')),
    CONSTRAINT image_assets_dimensions_check
        CHECK ((width IS NULL OR width > 0) AND (height IS NULL OR height > 0)),
    CONSTRAINT image_assets_location_check
        CHECK (storage_path IS NOT NULL OR public_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_image_assets_entity
ON image_assets(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_image_assets_entity_slug
ON image_assets(entity_type, entity_slug);

CREATE INDEX IF NOT EXISTS idx_image_assets_country_zone
ON image_assets(country_slug, zone_slug);

CREATE INDEX IF NOT EXISTS idx_image_assets_usage_status
ON image_assets(usage_type, status);

-- ============================================
-- TABLA: STATIC_PAGES
-- ============================================

CREATE TABLE IF NOT EXISTS static_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'trust',
    title TEXT NOT NULL,
    summary TEXT,
    body JSONB NOT NULL DEFAULT '{}'::jsonb,
    version TEXT,
    seo_title TEXT,
    seo_description TEXT,
    canonical_slug TEXT,
    noindex BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    status TEXT NOT NULL DEFAULT 'draft',
    review_state TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT static_pages_slug_format_check
        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT static_pages_type_check
        CHECK (type IN ('about', 'contact', 'privacy', 'cookies', 'terms', 'image_credits', 'share', 'trust', 'legal', 'generic')),
    CONSTRAINT static_pages_status_check
        CHECK (status IN ('draft', 'review', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_static_pages_slug
ON static_pages(slug);

CREATE INDEX IF NOT EXISTS idx_static_pages_type_status
ON static_pages(type, status);

-- ============================================
-- TABLA: DEMAND_SIGNALS
-- ============================================

CREATE TABLE IF NOT EXISTS demand_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    signal_type TEXT NOT NULL,
    query TEXT,
    normalized_query TEXT,
    country_slug TEXT,
    zone_slug TEXT,
    entity_type TEXT,
    entity_slug TEXT,
    source_page TEXT,
    action TEXT,
    count INTEGER NOT NULL DEFAULT 1,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    status TEXT NOT NULL DEFAULT 'draft',
    review_state TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT demand_signals_signal_type_check
        CHECK (signal_type IN ('search', 'map_request', 'missing_content', 'waitlist', 'click', 'promotion_interest', 'generic')),
    CONSTRAINT demand_signals_entity_type_check
        CHECK (entity_type IS NULL OR entity_type IN ('country', 'zone', 'place', 'route', 'plan', 'static_page', 'generic')),
    CONSTRAINT demand_signals_count_check
        CHECK (count > 0),
    CONSTRAINT demand_signals_status_check
        CHECK (status IN ('draft', 'review', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_demand_signals_country_zone
ON demand_signals(country_slug, zone_slug);

CREATE INDEX IF NOT EXISTS idx_demand_signals_entity
ON demand_signals(entity_type, entity_slug);

CREATE INDEX IF NOT EXISTS idx_demand_signals_signal_status
ON demand_signals(signal_type, status);

CREATE INDEX IF NOT EXISTS idx_demand_signals_last_seen_at
ON demand_signals(last_seen_at DESC);

-- ============================================
-- TABLA: PROMOTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    sponsor_name TEXT NOT NULL,
    sponsor_url TEXT,
    image_asset_id UUID REFERENCES image_assets(id) ON DELETE SET NULL,

    placement_type TEXT NOT NULL,
    target_entity_type TEXT,
    target_entity_id TEXT,
    target_entity_slug TEXT,
    country_slug TEXT,
    zone_slug TEXT,
    traveler_type TEXT,
    mode TEXT,

    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft',
    priority INTEGER NOT NULL DEFAULT 0,
    disclosure_label TEXT NOT NULL DEFAULT 'Promocion',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT promotions_slug_format_check
        CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT promotions_placement_type_check
        CHECK (placement_type IN ('native_block', 'recommended_hotel', 'rental_car', 'travel_insurance', 'local_experience', 'restaurant', 'travel_gear', 'seasonal_offer', 'related_offer')),
    CONSTRAINT promotions_target_entity_type_check
        CHECK (target_entity_type IS NULL OR target_entity_type IN ('country', 'zone', 'place', 'route', 'plan', 'static_page', 'generic')),
    CONSTRAINT promotions_mode_check
        CHECK (mode IS NULL OR mode IN ('adventure', 'student')),
    CONSTRAINT promotions_status_check
        CHECK (status IN ('draft', 'review', 'published', 'archived')),
    CONSTRAINT promotions_date_range_check
        CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at),
    CONSTRAINT promotions_priority_check
        CHECK (priority >= 0),
    CONSTRAINT promotions_disclosure_label_check
        CHECK (disclosure_label IN ('Promocion', 'Patrocinado', 'Colaborador'))
);

CREATE INDEX IF NOT EXISTS idx_promotions_slug
ON promotions(slug);

CREATE INDEX IF NOT EXISTS idx_promotions_target
ON promotions(target_entity_type, target_entity_id);

CREATE INDEX IF NOT EXISTS idx_promotions_target_slug
ON promotions(target_entity_type, target_entity_slug);

CREATE INDEX IF NOT EXISTS idx_promotions_country_zone
ON promotions(country_slug, zone_slug);

CREATE INDEX IF NOT EXISTS idx_promotions_public_placement
ON promotions(status, placement_type, priority DESC);

CREATE INDEX IF NOT EXISTS idx_promotions_dates
ON promotions(starts_at, ends_at);

-- ============================================
-- TRIGGERS
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_editorial_contents_updated_at'
    ) THEN
        CREATE TRIGGER update_editorial_contents_updated_at
            BEFORE UPDATE ON editorial_contents
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_image_assets_updated_at'
    ) THEN
        CREATE TRIGGER update_image_assets_updated_at
            BEFORE UPDATE ON image_assets
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_static_pages_updated_at'
    ) THEN
        CREATE TRIGGER update_static_pages_updated_at
            BEFORE UPDATE ON static_pages
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_demand_signals_updated_at'
    ) THEN
        CREATE TRIGGER update_demand_signals_updated_at
            BEFORE UPDATE ON demand_signals
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_promotions_updated_at'
    ) THEN
        CREATE TRIGGER update_promotions_updated_at
            BEFORE UPDATE ON promotions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE editorial_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON editorial_contents FROM anon, authenticated;
REVOKE ALL ON image_assets FROM anon, authenticated;
REVOKE ALL ON static_pages FROM anon, authenticated;
REVOKE ALL ON demand_signals FROM anon, authenticated;
REVOKE ALL ON promotions FROM anon, authenticated;

GRANT SELECT ON editorial_contents TO anon, authenticated;
GRANT SELECT ON image_assets TO anon, authenticated;
GRANT SELECT ON static_pages TO anon, authenticated;
GRANT SELECT ON demand_signals TO anon, authenticated;
GRANT SELECT ON promotions TO anon, authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'editorial_contents'
          AND policyname = 'Allow public read access to published editorial contents'
    ) THEN
        CREATE POLICY "Allow public read access to published editorial contents"
        ON editorial_contents
        FOR SELECT
        TO anon, authenticated
        USING (status = 'published');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'image_assets'
          AND policyname = 'Allow public read access to published image assets'
    ) THEN
        CREATE POLICY "Allow public read access to published image assets"
        ON image_assets
        FOR SELECT
        TO anon, authenticated
        USING (status = 'published');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'static_pages'
          AND policyname = 'Allow public read access to published static pages'
    ) THEN
        CREATE POLICY "Allow public read access to published static pages"
        ON static_pages
        FOR SELECT
        TO anon, authenticated
        USING (status = 'published');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'demand_signals'
          AND policyname = 'Allow public read access to published demand signals'
    ) THEN
        CREATE POLICY "Allow public read access to published demand signals"
        ON demand_signals
        FOR SELECT
        TO anon, authenticated
        USING (status = 'published');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'promotions'
          AND policyname = 'Allow public read access to published promotions'
    ) THEN
        CREATE POLICY "Allow public read access to published promotions"
        ON promotions
        FOR SELECT
        TO anon, authenticated
        USING (
            status = 'published'
            AND (starts_at IS NULL OR starts_at <= NOW())
            AND (ends_at IS NULL OR ends_at > NOW())
        );
    END IF;
END $$;

-- No se crean politicas publicas de INSERT/UPDATE/DELETE.
-- Investighost/admin/backend deben usar service_role o roles internos futuros.

-- ============================================
-- STORAGE FUTURO: IMAGENES EDITORIALES
-- ============================================

-- image_assets guarda metadatos, permisos, creditos y rutas.
-- Los binarios pueden vivir en un bucket futuro de Storage editorial, pero esta
-- migracion no crea ni modifica buckets para no tocar Storage existente.

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE editorial_contents IS 'Contenido editorial publicado por entidad y modo, alimentado por Investighost y renderizado por Trawel';
COMMENT ON TABLE image_assets IS 'Metadatos de imagenes editoriales aprobadas; los binarios viven en Storage u otro proveedor';
COMMENT ON TABLE static_pages IS 'Paginas estaticas de confianza, legales y contenido institucional publicable';
COMMENT ON TABLE demand_signals IS 'Senales de demanda editorial para priorizar investigacion y carga de contenido';
COMMENT ON TABLE promotions IS 'Promociones nativas no invasivas, claramente marcadas como promocion, patrocinado o colaborador';

COMMENT ON COLUMN promotions.disclosure_label IS 'Etiqueta visible obligatoria: Promocion, Patrocinado o Colaborador';
COMMENT ON COLUMN promotions.placement_type IS 'Ubicacion/tipo de bloque nativo dentro del flujo editorial; no popups ni overlays';
COMMENT ON COLUMN promotions.target_entity_type IS 'Entidad objetivo: pais, zona, lugar, ruta, plan o pagina generica';

-- ============================================
-- FIN DE LA MIGRACION
-- ============================================
