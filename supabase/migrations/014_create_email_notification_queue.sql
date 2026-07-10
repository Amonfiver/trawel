/**
 * Migracion 014: Cola interna de notificaciones email
 *
 * Proposito:
 * Preparar emails transaccionales sin enviar nada real todavia.
 *
 * Seguridad:
 * - No concede SELECT/INSERT/UPDATE/DELETE publico.
 * - No contiene proveedor, API key ni credenciales.
 * - El envio real queda pendiente de proveedor y backend seguro.
 */

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS email_notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    related_table TEXT,
    related_id UUID,
    status TEXT NOT NULL DEFAULT 'pending',
    provider TEXT,
    provider_message_id TEXT,
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT email_notification_queue_status_check
        CHECK (status IN ('pending', 'queued', 'sent', 'failed', 'cancelled', 'skipped')),
    CONSTRAINT email_notification_queue_notification_type_check
        CHECK (notification_type IN ('submission_copy', 'review_status', 'publication_notice', 'rejection_notice', 'admin_alert')),
    CONSTRAINT email_notification_queue_recipient_email_check
        CHECK (length(trim(recipient_email)) BETWEEN 3 AND 320 AND recipient_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT email_notification_queue_subject_check
        CHECK (length(trim(subject)) BETWEEN 1 AND 240),
    CONSTRAINT email_notification_queue_body_text_check
        CHECK (length(trim(body_text)) BETWEEN 1 AND 10000)
);

CREATE INDEX IF NOT EXISTS idx_email_notification_queue_status_scheduled_for
ON email_notification_queue(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_email_notification_queue_notification_type_created_at
ON email_notification_queue(notification_type, created_at);

CREATE INDEX IF NOT EXISTS idx_email_notification_queue_related_target
ON email_notification_queue(related_table, related_id);

CREATE INDEX IF NOT EXISTS idx_email_notification_queue_recipient_email_created_at
ON email_notification_queue(recipient_email, created_at);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_notification_queue_updated_at'
    ) THEN
        CREATE TRIGGER update_email_notification_queue_updated_at
            BEFORE UPDATE ON email_notification_queue
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

ALTER TABLE email_notification_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON email_notification_queue FROM anon, authenticated;

COMMENT ON TABLE email_notification_queue IS 'Cola interna de emails transaccionales; no envia emails por si sola';
COMMENT ON COLUMN email_notification_queue.notification_type IS 'Tipo interno: submission_copy, review_status, publication_notice, rejection_notice, admin_alert';
COMMENT ON COLUMN email_notification_queue.status IS 'Estado interno de cola; pending no implica envio real';
COMMENT ON COLUMN email_notification_queue.provider IS 'Proveedor usado cuando se active envio real; null mientras este pendiente';
COMMENT ON COLUMN email_notification_queue.metadata IS 'Contexto no secreto para Investighost/backend; no guardar API keys ni passwords';
