/**
 * Migracion 012: Eventos de envios publicos protegidos
 *
 * Proposito:
 * Registrar eventos internos para aplicar rate limit logico aunque Turnstile
 * sea superado.
 *
 * Seguridad:
 * - No guarda emails ni IPs en claro.
 * - No concede lectura ni escritura publica.
 * - La Edge Function usa service_role solo en backend.
 */

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public_submission_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_type TEXT NOT NULL,
    email_hash TEXT,
    ip_hash TEXT,
    source_page TEXT,
    status TEXT NOT NULL DEFAULT 'accepted',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT public_submission_events_status_check
        CHECK (status IN ('accepted', 'rejected_rate_limit', 'rejected_turnstile', 'rejected_validation', 'error')),
    CONSTRAINT public_submission_events_submission_type_check
        CHECK (length(trim(submission_type)) BETWEEN 1 AND 80)
);

CREATE INDEX IF NOT EXISTS idx_public_submission_events_submission_type_created_at
ON public_submission_events(submission_type, created_at);

CREATE INDEX IF NOT EXISTS idx_public_submission_events_email_hash_created_at
ON public_submission_events(email_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_public_submission_events_ip_hash_created_at
ON public_submission_events(ip_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_public_submission_events_status_created_at
ON public_submission_events(status, created_at);

ALTER TABLE public_submission_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public_submission_events FROM anon, authenticated;

COMMENT ON TABLE public_submission_events IS 'Eventos internos de formularios publicos protegidos para rate limit; sin datos personales en claro';
COMMENT ON COLUMN public_submission_events.email_hash IS 'Hash SHA-256 de email normalizado; nunca email en claro';
COMMENT ON COLUMN public_submission_events.ip_hash IS 'Hash SHA-256 de IP si la Edge Function recibe una cabecera fiable';
