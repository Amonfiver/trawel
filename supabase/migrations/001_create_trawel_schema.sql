/**
 * Migración inicial: Schema de Trawel para Supabase
 * 
 * Propósito:
 * Crear las tablas necesarias para persistir datos de Trawel en PostgreSQL/Supabase.
 * Define estructura, constraints, índices y políticas RLS para acceso público de lectura.
 * 
 * Alcance:
 * - Tablas: countries, cities, destinations, destination_sources
 * - Índices para consultas frecuentes
 * - Checks para validar estados
 * - Row Level Security (RLS) con políticas SELECT públicas
 * - No incluye INSERT/UPDATE/DELETE policies (fase posterior)
 * 
 * Decisiones técnicas:
 * - UUID como primary key (gen_random_uuid())
 * - Campos localizados con sufijo _es (español como idioma base)
 * - JSONB para arrays/tags y campos de verificación pendiente
 * - ON DELETE CASCADE para mantener integridad referencial
 * - CHECK constraints para validar estados permitidos
 * 
 * Limitaciones / estado temporal:
 * - Solo lectura pública habilitada
 * - Sin autenticación ni autorización de escritura
 * - Sin triggers de updated_at (gestión manual por ahora)
 * 
 * Cambios recientes (2026-04-28):
 * - Creada migración inicial con 4 tablas
 * - Definidos índices para slugs, status y relaciones
 * - Activado RLS con policies SELECT públicas
 */

-- ============================================
-- EXTENSIONES
-- ============================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLA: COUNTRIES
-- ============================================

CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_es TEXT NOT NULL,
    emoji TEXT,
    capital_es TEXT,
    continent_es TEXT,
    description_es TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Check constraint para status válido
    CONSTRAINT check_countries_status 
        CHECK (status IN ('active', 'comingSoon', 'disabled'))
);

-- Índices para countries
CREATE INDEX idx_countries_slug ON countries(slug);
CREATE INDEX idx_countries_status ON countries(status);

-- ============================================
-- TABLA: CITIES
-- ============================================

CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name_es TEXT NOT NULL,
    short_description_es TEXT,
    adventure_content_es TEXT,
    student_content_es TEXT,
    lat NUMERIC,
    lng NUMERIC,
    recommended_duration TEXT,
    best_season_es TEXT,
    sleeping_advice_es TEXT,
    food_advice_es TEXT,
    pending_verification JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Check constraint para status válido
    CONSTRAINT check_cities_status 
        CHECK (status IN ('active', 'comingSoon', 'disabled')),
    -- Slug único por país
    CONSTRAINT unique_city_slug_per_country 
        UNIQUE (country_id, slug)
);

-- Índices para cities
CREATE INDEX idx_cities_country_id ON cities(country_id);
CREATE INDEX idx_cities_slug ON cities(slug);
CREATE INDEX idx_cities_status ON cities(status);

-- ============================================
-- TABLA: DESTINATIONS
-- ============================================

CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title_es TEXT NOT NULL,
    summary_es TEXT,
    adventure_content_es TEXT,
    student_content_es TEXT,
    type TEXT,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_visit_time TEXT,
    price TEXT,
    opening_hours TEXT,
    practical_tip_es TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'draft',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    pending_verification JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Check constraints para estados válidos
    CONSTRAINT check_destinations_status 
        CHECK (status IN ('draft', 'published', 'comingSoon', 'disabled')),
    CONSTRAINT check_destinations_verification_status 
        CHECK (verification_status IN ('pending', 'verified', 'disputed')),
    -- Slug único por país y ciudad
    CONSTRAINT unique_destination_slug 
        UNIQUE (country_id, city_id, slug)
);

-- Índices para destinations
CREATE INDEX idx_destinations_country_id ON destinations(country_id);
CREATE INDEX idx_destinations_city_id ON destinations(city_id);
CREATE INDEX idx_destinations_slug ON destinations(slug);
CREATE INDEX idx_destinations_status ON destinations(status);
CREATE INDEX idx_destinations_featured ON destinations(featured) WHERE featured = TRUE;

-- ============================================
-- TABLA: DESTINATION_SOURCES
-- ============================================

CREATE TABLE destination_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    type TEXT,
    supports TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Check constraint para tipos válidos
    CONSTRAINT check_destination_sources_type 
        CHECK (type IN ('official', 'tourism', 'heritage', 'blog', 'reviews', 'restaurant', 'accommodation', 'other'))
);

-- Índices para destination_sources
CREATE INDEX idx_destination_sources_destination_id ON destination_sources(destination_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activar RLS en todas las tablas
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_sources ENABLE ROW LEVEL SECURITY;

-- Política SELECT pública para countries (solo activos)
CREATE POLICY "Allow public read access to active countries"
    ON countries
    FOR SELECT
    USING (status = 'active');

-- Política SELECT pública para cities (solo activas)
CREATE POLICY "Allow public read access to active cities"
    ON cities
    FOR SELECT
    USING (status = 'active');

-- Política SELECT pública para destinations (solo publicadas)
CREATE POLICY "Allow public read access to published destinations"
    ON destinations
    FOR SELECT
    USING (status = 'published');

-- Política SELECT pública para destination_sources (solo de destinos publicados)
CREATE POLICY "Allow public read access to sources of published destinations"
    ON destination_sources
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM destinations 
            WHERE destinations.id = destination_sources.destination_id 
            AND destinations.status = 'published'
        )
    );

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE countries IS 'Países disponibles en Trawel';
COMMENT ON TABLE cities IS 'Ciudades y regiones dentro de cada país';
COMMENT ON TABLE destinations IS 'Destinos turísticos y atracciones';
COMMENT ON TABLE destination_sources IS 'Fuentes y referencias para cada destino';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================