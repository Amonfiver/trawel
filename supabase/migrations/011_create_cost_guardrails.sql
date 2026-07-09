/**
 * Migracion 011: Railes de coste globales
 *
 * Proposito:
 * Crear flags operativos, eventos de uso y cola de limpieza para evitar costes
 * descontrolados antes de activar subida real de fotos.
 *
 * Alcance:
 * - Las fotos reales siguen desactivadas por defecto.
 * - No abre Storage.
 * - No concede escritura publica.
 * - No publica contenido de usuario.
 */

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS system_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT system_flags_key_format_check
        CHECK (key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS storage_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    bucket TEXT,
    object_path TEXT,
    size_bytes BIGINT,
    related_submission_id UUID,
    email_hash TEXT,
    ip_hash TEXT,
    status TEXT NOT NULL DEFAULT 'recorded',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT storage_usage_events_size_bytes_check
        CHECK (size_bytes IS NULL OR size_bytes >= 0),
    CONSTRAINT storage_usage_events_status_check
        CHECK (status IN ('recorded', 'ignored', 'reversed', 'error'))
);

CREATE TABLE IF NOT EXISTS moderation_cleanup_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    bucket TEXT,
    object_path TEXT,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT moderation_cleanup_queue_status_check
        CHECK (status IN ('pending', 'processing', 'processed', 'skipped', 'failed')),
    CONSTRAINT moderation_cleanup_queue_reason_check
        CHECK (length(trim(reason)) BETWEEN 1 AND 240)
);

CREATE INDEX IF NOT EXISTS idx_system_flags_key
ON system_flags(key);

CREATE INDEX IF NOT EXISTS idx_system_flags_is_public
ON system_flags(is_public);

CREATE INDEX IF NOT EXISTS idx_storage_usage_events_event_type_created_at
ON storage_usage_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_storage_usage_events_email_hash_created_at
ON storage_usage_events(email_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_storage_usage_events_ip_hash_created_at
ON storage_usage_events(ip_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_cleanup_queue_status_scheduled_for
ON moderation_cleanup_queue(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_moderation_cleanup_queue_target_type_target_id
ON moderation_cleanup_queue(target_type, target_id);

DROP TRIGGER IF EXISTS update_system_flags_updated_at ON system_flags;
CREATE TRIGGER update_system_flags_updated_at
BEFORE UPDATE ON system_flags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE system_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_cleanup_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON system_flags FROM anon, authenticated;
REVOKE ALL ON storage_usage_events FROM anon, authenticated;
REVOKE ALL ON moderation_cleanup_queue FROM anon, authenticated;

GRANT SELECT ON system_flags TO anon, authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'system_flags'
          AND policyname = 'Allow public read of public system flags'
    ) THEN
        CREATE POLICY "Allow public read of public system flags"
        ON system_flags
        FOR SELECT
        TO anon, authenticated
        USING (is_public = TRUE);
    END IF;
END $$;

INSERT INTO system_flags (key, value, is_public, description) VALUES
    ('public_contact_enabled', 'true'::jsonb, TRUE, 'Permite apagar rapidamente el formulario publico de contacto.'),
    ('public_share_enabled', 'true'::jsonb, TRUE, 'Permite apagar rapidamente el formulario publico de compartir.'),
    ('public_reports_enabled', 'true'::jsonb, TRUE, 'Permite apagar rapidamente los reportes publicos.'),
    ('photo_uploads_enabled', 'false'::jsonb, TRUE, 'Control global para subida real de fotos; debe seguir false hasta decision explicita.'),
    ('max_photos_per_submission', '3'::jsonb, TRUE, 'Numero maximo de fotos por envio futuro.'),
    ('max_photo_upload_mb', '5'::jsonb, TRUE, 'Peso maximo inicial por foto antes de procesar.'),
    ('max_processed_photo_mb', '1.5'::jsonb, FALSE, 'Peso maximo interno recomendado para foto procesada.'),
    ('max_pending_photo_days', '30'::jsonb, TRUE, 'Dias maximos de conservacion para fotos pendientes futuras.'),
    ('max_daily_submissions_per_email', '10'::jsonb, FALSE, 'Limite diario de envios publicos por email hash.'),
    ('max_hourly_submissions_per_email', '3'::jsonb, FALSE, 'Limite horario de envios publicos por email hash.'),
    ('max_daily_photo_uploads_per_email', '9'::jsonb, FALSE, 'Limite diario de fotos futuras por email hash.'),
    ('monthly_pending_storage_soft_limit_mb', '2048'::jsonb, FALSE, 'Limite blando mensual para storage pendiente antes de desactivar fotos.'),
    ('pending_user_message_retention_days', '90'::jsonb, FALSE, 'Dias maximos recomendados para revisar mensajes pendientes.'),
    ('rejected_user_message_retention_days', '30'::jsonb, FALSE, 'Dias maximos recomendados para conservar mensajes rechazados o spam.')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    is_public = EXCLUDED.is_public,
    description = EXCLUDED.description,
    updated_at = NOW();

COMMENT ON TABLE system_flags IS 'Flags operativos para apagar funciones publicas y limitar costes sin desplegar codigo';
COMMENT ON TABLE storage_usage_events IS 'Eventos internos de uso de Storage o fotos; sin lectura ni escritura publica';
COMMENT ON TABLE moderation_cleanup_queue IS 'Cola interna para programar limpieza de mensajes, reportes y objetos pendientes o rechazados';
COMMENT ON COLUMN system_flags.is_public IS 'Solo los flags publicos pueden leerse desde el frontend anonimo';
COMMENT ON COLUMN system_flags.value IS 'Valor JSON del flag para soportar booleanos, numeros y futuros objetos de configuracion';
