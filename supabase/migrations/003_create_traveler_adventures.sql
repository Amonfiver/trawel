/**
 * Migración 003: Aventuras reales de viajeros con moderación
 *
 * Propósito:
 * Crear la base persistente para aventuras enviadas por viajeros desde zonas del mapa.
 * Toda aventura entra como pending y requiere aprobación posterior del webmaster.
 *
 * Alcance:
 * - Tabla: traveler_adventures
 * - Índices para país, zona, estado y orden temporal
 * - Trigger updated_at reutilizando update_updated_at_column()
 * - RLS: INSERT público controlado, SELECT público solo de approved, sin UPDATE/DELETE público
 * - Bucket privado traveler-adventure-photos para una futura Edge Function de subida validada
 *
 * Decisiones:
 * - No publicar directamente contenido de viajeros.
 * - No abrir lectura pública de fotos pendientes.
 * - No permitir upload público directo a Storage en esta fase.
 * - Column grants evitan exponer author_email y moderation_notes en lecturas públicas.
 *
 * Limitaciones:
 * - No incluye formulario, autenticación, panel de moderación ni Edge Function de fotos.
 * - photo_path se reserva para backend/service_role tras validar y moderar assets.
 *
 * Cambios recientes:
 * - Infraestructura inicial para flujo zona -> aventura enviada -> pending -> approved.
 */

-- ============================================
-- EXTENSIONES
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLA: TRAVELER_ADVENTURES
-- ============================================

CREATE TABLE traveler_adventures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ubicación dentro del flujo mapa -> país -> zona
    country_slug TEXT NOT NULL,
    zone_slug TEXT NOT NULL,
    zone_name TEXT,

    -- Contenido enviado por viajeros
    title TEXT NOT NULL,
    story TEXT NOT NULL,
    practical_tips TEXT,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    photo_path TEXT,

    -- Moderación
    status TEXT NOT NULL DEFAULT 'pending',
    moderation_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- ============================================
-- CONSTRAINTS
-- ============================================

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_status_check
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_country_slug_format_check
CHECK (country_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_zone_slug_format_check
CHECK (zone_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_required_text_check
CHECK (
    length(trim(title)) > 0
    AND length(trim(story)) > 0
    AND length(trim(author_name)) > 0
    AND length(trim(author_email)) > 0
);

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_author_email_basic_check
CHECK (author_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_approved_at_check
CHECK (
    (status = 'approved' AND approved_at IS NOT NULL)
    OR (status <> 'approved' AND approved_at IS NULL)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_traveler_adventures_country_slug
ON traveler_adventures(country_slug);

CREATE INDEX idx_traveler_adventures_zone_slug
ON traveler_adventures(zone_slug);

CREATE INDEX idx_traveler_adventures_status
ON traveler_adventures(status);

CREATE INDEX idx_traveler_adventures_created_at
ON traveler_adventures(created_at DESC);

CREATE INDEX idx_traveler_adventures_country_zone_status
ON traveler_adventures(country_slug, zone_slug, status);

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_traveler_adventures_updated_at
    BEFORE UPDATE ON traveler_adventures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE traveler_adventures ENABLE ROW LEVEL SECURITY;

-- Grants mínimos para PostgREST/Supabase API.
-- SELECT público excluye author_email y moderation_notes por privacidad.
REVOKE ALL ON traveler_adventures FROM anon, authenticated;

GRANT SELECT (
    id,
    country_slug,
    zone_slug,
    zone_name,
    title,
    story,
    practical_tips,
    author_name,
    photo_path,
    status,
    created_at,
    approved_at
) ON traveler_adventures TO anon, authenticated;

GRANT INSERT (
    country_slug,
    zone_slug,
    zone_name,
    title,
    story,
    practical_tips,
    author_name,
    author_email
) ON traveler_adventures TO anon, authenticated;

-- Público solo puede leer aventuras aprobadas.
CREATE POLICY "Allow public read access to approved traveler adventures"
ON traveler_adventures
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Público puede crear solicitudes, siempre como pending y sin campos de moderación/foto.
CREATE POLICY "Allow public pending traveler adventure submissions"
ON traveler_adventures
FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'pending'
    AND moderation_notes IS NULL
    AND approved_at IS NULL
    AND photo_path IS NULL
);

-- No se crean políticas públicas de UPDATE/DELETE.
-- La moderación futura debe usar service_role/backend o roles internos explícitos.

-- ============================================
-- STORAGE BUCKET: TRAVELER_ADVENTURE_PHOTOS
-- ============================================

-- Bucket privado. Sin políticas públicas de SELECT/INSERT en esta fase.
-- Estrategia segura: una Edge Function futura validará tamaño, tipo MIME, país/zona,
-- asociará la foto a una aventura pending y servirá fotos solo tras aprobación.
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'traveler-adventure-photos',
    'traveler-adventure-photos',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No añadir políticas públicas de storage.objects aquí:
-- - Evita uploads anónimos sin validación.
-- - Evita lectura pública de fotos asociadas a aventuras pending/rejected.
-- - El service_role puede gestionar el bucket desde backend/Edge Function.

-- ============================================
-- COMENTARIOS DOCUMENTALES
-- ============================================

COMMENT ON TABLE traveler_adventures IS 'Aventuras reales enviadas por viajeros desde zonas del mapa; requieren moderación webmaster';
COMMENT ON COLUMN traveler_adventures.status IS 'Moderación: pending, approved, rejected';
COMMENT ON COLUMN traveler_adventures.author_email IS 'Contacto privado para moderación; no conceder SELECT público sobre esta columna';
COMMENT ON COLUMN traveler_adventures.photo_path IS 'Ruta en bucket privado traveler-adventure-photos gestionada por backend/Edge Function';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
