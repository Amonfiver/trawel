/**
 * Migracion 008: Colas de contenido de usuario
 *
 * Proposito:
 * Crear las colas minimas para recibir mensajes, fotos y reportes desde Trawel
 * sin publicar nada directamente.
 *
 * Alcance:
 * - Tablas: user_messages, user_photo_submissions, content_reports
 * - Indices para revision por estado, prioridad, entidad y fecha
 * - Trigger updated_at reutilizando update_updated_at_column()
 * - RLS: INSERT publico controlado, sin lectura publica ni UPDATE/DELETE publico
 *
 * Seguridad:
 * - Todo entra como pending_review o submitted.
 * - Trawel publico solo inserta en cola.
 * - Investighost/admin/backend deben gestionar con service_role o roles internos futuros.
 * - No toca Storage, formularios, seeds, mapas ni rutas.
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
-- TABLA: USER_MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS user_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    type TEXT NOT NULL DEFAULT 'generic',
    kind TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,

    country_slug TEXT,
    zone_slug TEXT,
    related_entity_type TEXT,
    related_entity_slug TEXT,
    entity_type TEXT,
    entity_slug TEXT,

    status TEXT NOT NULL DEFAULT 'pending_review',
    priority TEXT NOT NULL DEFAULT 'normal',
    source_page TEXT,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    privacy_accepted BOOLEAN NOT NULL DEFAULT FALSE,

    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT user_messages_type_check
        CHECK (type IN ('contact', 'suggestion', 'collaboration', 'report', 'private_request', 'community_suggestion', 'content_report', 'privacy_request', 'generic')),
    CONSTRAINT user_messages_kind_check
        CHECK (kind IS NULL OR kind IN ('contact', 'community_suggestion', 'content_report', 'privacy_request', 'generic')),
    CONSTRAINT user_messages_status_check
        CHECK (status IN ('pending_review', 'read', 'responded', 'archived', 'rejected', 'priority')),
    CONSTRAINT user_messages_priority_check
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT user_messages_related_entity_type_check
        CHECK (related_entity_type IS NULL OR related_entity_type IN ('country', 'zone', 'place', 'route', 'plan', 'static_page', 'generic')),
    CONSTRAINT user_messages_entity_type_check
        CHECK (entity_type IS NULL OR entity_type IN ('country', 'zone', 'place', 'route', 'plan', 'static_page', 'generic')),
    CONSTRAINT user_messages_country_slug_format_check
        CHECK (country_slug IS NULL OR country_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT user_messages_zone_slug_format_check
        CHECK (zone_slug IS NULL OR zone_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT user_messages_related_entity_slug_format_check
        CHECK (related_entity_slug IS NULL OR related_entity_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT user_messages_entity_slug_format_check
        CHECK (entity_slug IS NULL OR entity_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT user_messages_required_text_check
        CHECK (
            length(trim(name)) BETWEEN 1 AND 160
            AND (subject IS NULL OR length(trim(subject)) BETWEEN 1 AND 200)
            AND length(trim(message)) BETWEEN 1 AND 5000
            AND length(trim(email)) BETWEEN 3 AND 320
        ),
    CONSTRAINT user_messages_email_basic_check
        CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX IF NOT EXISTS idx_user_messages_status
ON user_messages(status);

CREATE INDEX IF NOT EXISTS idx_user_messages_priority
ON user_messages(priority);

CREATE INDEX IF NOT EXISTS idx_user_messages_country_zone
ON user_messages(country_slug, zone_slug);

CREATE INDEX IF NOT EXISTS idx_user_messages_related_entity
ON user_messages(related_entity_type, related_entity_slug);

CREATE INDEX IF NOT EXISTS idx_user_messages_entity
ON user_messages(entity_type, entity_slug);

CREATE INDEX IF NOT EXISTS idx_user_messages_created_at
ON user_messages(created_at DESC);

-- ============================================
-- TABLA: USER_PHOTO_SUBMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS user_photo_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    country_slug TEXT NOT NULL,
    zone_slug TEXT,

    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    storage_path TEXT,
    credit_name TEXT,
    rights_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    consent_confirmed BOOLEAN NOT NULL DEFAULT FALSE,

    status TEXT NOT NULL DEFAULT 'submitted',
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    published_image_asset_id UUID REFERENCES image_assets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT user_photo_submissions_status_check
        CHECK (status IN ('submitted', 'pending_review', 'approved', 'rejected', 'published', 'archived', 'rights_issue', 'removal_requested')),
    CONSTRAINT user_photo_submissions_country_slug_format_check
        CHECK (country_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT user_photo_submissions_zone_slug_format_check
        CHECK (zone_slug IS NULL OR zone_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT user_photo_submissions_required_text_check
        CHECK (
            length(trim(author_name)) BETWEEN 1 AND 160
            AND length(trim(author_email)) BETWEEN 3 AND 320
            AND length(trim(title)) BETWEEN 1 AND 200
        ),
    CONSTRAINT user_photo_submissions_author_email_basic_check
        CHECK (author_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT user_photo_submissions_image_reference_check
        CHECK (image_url IS NOT NULL OR storage_path IS NOT NULL),
    CONSTRAINT user_photo_submissions_rights_consent_check
        CHECK (rights_confirmed = TRUE AND consent_confirmed = TRUE),
    CONSTRAINT user_photo_submissions_published_asset_check
        CHECK (
            (status = 'published' AND published_image_asset_id IS NOT NULL)
            OR (status <> 'published' AND published_image_asset_id IS NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_user_photo_submissions_status
ON user_photo_submissions(status);

CREATE INDEX IF NOT EXISTS idx_user_photo_submissions_country_zone
ON user_photo_submissions(country_slug, zone_slug);

CREATE INDEX IF NOT EXISTS idx_user_photo_submissions_created_at
ON user_photo_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_photo_submissions_published_image_asset_id
ON user_photo_submissions(published_image_asset_id);

-- ============================================
-- TABLA: CONTENT_REPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    report_type TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    reporter_email TEXT NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_slug TEXT NOT NULL,
    message TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending_review',
    resolved_at TIMESTAMPTZ,
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT content_reports_report_type_check
        CHECK (report_type IN ('error', 'abuse', 'image_rights', 'removal_request', 'generic')),
    CONSTRAINT content_reports_target_entity_type_check
        CHECK (target_entity_type IN ('country', 'zone', 'place', 'route', 'plan', 'static_page', 'image_asset', 'promotion', 'generic')),
    CONSTRAINT content_reports_status_check
        CHECK (status IN ('pending_review', 'in_review', 'resolved', 'rejected', 'archived', 'rights_issue', 'removal_requested')),
    CONSTRAINT content_reports_target_entity_slug_format_check
        CHECK (target_entity_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT content_reports_required_text_check
        CHECK (
            length(trim(reporter_name)) BETWEEN 1 AND 160
            AND length(trim(reporter_email)) BETWEEN 3 AND 320
            AND length(trim(message)) BETWEEN 1 AND 5000
        ),
    CONSTRAINT content_reports_reporter_email_basic_check
        CHECK (reporter_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status
ON content_reports(status);

CREATE INDEX IF NOT EXISTS idx_content_reports_report_type
ON content_reports(report_type);

CREATE INDEX IF NOT EXISTS idx_content_reports_target_entity
ON content_reports(target_entity_type, target_entity_slug);

CREATE INDEX IF NOT EXISTS idx_content_reports_created_at
ON content_reports(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_messages_updated_at'
    ) THEN
        CREATE TRIGGER update_user_messages_updated_at
            BEFORE UPDATE ON user_messages
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_photo_submissions_updated_at'
    ) THEN
        CREATE TRIGGER update_user_photo_submissions_updated_at
            BEFORE UPDATE ON user_photo_submissions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_reports_updated_at'
    ) THEN
        CREATE TRIGGER update_content_reports_updated_at
            BEFORE UPDATE ON content_reports
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photo_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON user_messages FROM anon, authenticated;
REVOKE ALL ON user_photo_submissions FROM anon, authenticated;
REVOKE ALL ON content_reports FROM anon, authenticated;

GRANT INSERT (
    type,
    kind,
    name,
    email,
    subject,
    message,
    country_slug,
    zone_slug,
    related_entity_type,
    related_entity_slug,
    entity_type,
    entity_slug,
    priority,
    source_page,
    user_agent,
    metadata,
    privacy_accepted,
    created_at
) ON user_messages TO anon, authenticated;

GRANT INSERT (
    author_name,
    author_email,
    country_slug,
    zone_slug,
    title,
    description,
    image_url,
    storage_path,
    credit_name,
    rights_confirmed,
    consent_confirmed
) ON user_photo_submissions TO anon, authenticated;

GRANT INSERT (
    report_type,
    reporter_name,
    reporter_email,
    target_entity_type,
    target_entity_slug,
    message
) ON content_reports TO anon, authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_messages'
          AND policyname = 'Allow public pending user message submissions'
    ) THEN
        CREATE POLICY "Allow public pending user message submissions"
        ON user_messages
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (
            status = 'pending_review'
            AND privacy_accepted = TRUE
            AND reviewed_at IS NULL
            AND reviewed_by IS NULL
            AND internal_notes IS NULL
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_photo_submissions'
          AND policyname = 'Allow public submitted photo submissions'
    ) THEN
        CREATE POLICY "Allow public submitted photo submissions"
        ON user_photo_submissions
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (
            status = 'submitted'
            AND reviewed_at IS NULL
            AND reviewed_by IS NULL
            AND rejection_reason IS NULL
            AND published_image_asset_id IS NULL
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'content_reports'
          AND policyname = 'Allow public pending content reports'
    ) THEN
        CREATE POLICY "Allow public pending content reports"
        ON content_reports
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (
            status = 'pending_review'
            AND resolved_at IS NULL
            AND internal_notes IS NULL
        );
    END IF;
END $$;

-- No se crean politicas publicas de SELECT/UPDATE/DELETE:
-- - Las colas contienen datos privados y de moderacion.
-- - El publico no debe leer mensajes, fotos pendientes ni reportes.
-- - La gestion futura debe usar service_role/backend o roles internos explicitos.

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE user_messages IS 'Cola privada para contacto, sugerencias, colaboracion, reportes generales y solicitudes privadas';
COMMENT ON TABLE user_photo_submissions IS 'Cola privada de fotos enviadas por usuarios; requiere revision antes de cualquier publicacion';
COMMENT ON TABLE content_reports IS 'Cola privada de reportes de errores, abuso, derechos de imagen y solicitudes de retirada';

COMMENT ON COLUMN user_messages.status IS 'Estado interno: pending_review, read, responded, archived, rejected, priority';
COMMENT ON COLUMN user_photo_submissions.status IS 'Estado interno: submitted, pending_review, approved, rejected, published, archived, rights_issue, removal_requested';
COMMENT ON COLUMN content_reports.status IS 'Estado interno de gestion del reporte; no visible publicamente';
COMMENT ON COLUMN user_photo_submissions.published_image_asset_id IS 'Referencia a image_assets solo cuando Investighost/backend publica la foto aprobada';

-- ============================================
-- FIN DE LA MIGRACION
-- ============================================
