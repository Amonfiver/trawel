/**
 * Migracion 013: Helpers internos de caducidad y limpieza
 *
 * Proposito:
 * Preparar auditoria y encolado manual de elementos antiguos sin borrar datos
 * automaticamente.
 *
 * Alcance:
 * - No borra filas.
 * - No toca Storage.
 * - No concede acceso publico.
 * - Usa moderation_cleanup_queue creada en la migracion 011.
 */

CREATE UNIQUE INDEX IF NOT EXISTS idx_moderation_cleanup_queue_open_target_reason
ON moderation_cleanup_queue(target_type, target_table, target_id, reason)
WHERE target_id IS NOT NULL
  AND status IN ('pending', 'processing');

CREATE OR REPLACE VIEW pending_user_messages_for_cleanup
WITH (security_invoker = true)
AS
WITH retention AS (
    SELECT COALESCE(
        (
            SELECT (value #>> '{}')::INTEGER
            FROM system_flags
            WHERE key = 'pending_user_message_retention_days'
            LIMIT 1
        ),
        90
    ) AS days
)
SELECT
    user_messages.id,
    user_messages.created_at,
    user_messages.updated_at,
    user_messages.status,
    user_messages.type,
    user_messages.kind,
    user_messages.source_page,
    user_messages.country_slug,
    user_messages.zone_slug,
    retention.days AS retention_days
FROM user_messages
CROSS JOIN retention
WHERE user_messages.status = 'pending_review'
  AND user_messages.created_at < NOW() - make_interval(days => retention.days);

CREATE OR REPLACE VIEW rejected_user_messages_for_cleanup
WITH (security_invoker = true)
AS
WITH retention AS (
    SELECT COALESCE(
        (
            SELECT (value #>> '{}')::INTEGER
            FROM system_flags
            WHERE key = 'rejected_user_message_retention_days'
            LIMIT 1
        ),
        30
    ) AS days
)
SELECT
    user_messages.id,
    user_messages.created_at,
    user_messages.updated_at,
    user_messages.reviewed_at,
    user_messages.status,
    user_messages.type,
    user_messages.kind,
    user_messages.source_page,
    retention.days AS retention_days
FROM user_messages
CROSS JOIN retention
WHERE user_messages.status IN ('rejected')
  AND COALESCE(user_messages.reviewed_at, user_messages.updated_at, user_messages.created_at)
      < NOW() - make_interval(days => retention.days);

CREATE OR REPLACE VIEW pending_content_reports_for_cleanup
WITH (security_invoker = true)
AS
SELECT
    content_reports.id,
    content_reports.created_at,
    content_reports.updated_at,
    content_reports.status,
    content_reports.report_type,
    content_reports.target_entity_type,
    content_reports.target_entity_slug,
    90 AS retention_days
FROM content_reports
WHERE content_reports.status = 'pending_review'
  AND content_reports.created_at < NOW() - INTERVAL '90 days';

REVOKE ALL ON pending_user_messages_for_cleanup FROM anon, authenticated;
REVOKE ALL ON rejected_user_messages_for_cleanup FROM anon, authenticated;
REVOKE ALL ON pending_content_reports_for_cleanup FROM anon, authenticated;

CREATE OR REPLACE FUNCTION enqueue_expired_pending_items()
RETURNS TABLE(target_table TEXT, enqueued_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    pending_messages_count INTEGER;
    rejected_messages_count INTEGER;
    pending_reports_count INTEGER;
BEGIN
    INSERT INTO moderation_cleanup_queue (
        target_type,
        target_table,
        target_id,
        reason,
        status,
        scheduled_for,
        metadata
    )
    SELECT
        'user_message',
        'user_messages',
        id,
        'pending_user_message_expired',
        'pending',
        NOW(),
        jsonb_build_object('retention_days', retention_days)
    FROM pending_user_messages_for_cleanup
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS pending_messages_count = ROW_COUNT;

    INSERT INTO moderation_cleanup_queue (
        target_type,
        target_table,
        target_id,
        reason,
        status,
        scheduled_for,
        metadata
    )
    SELECT
        'user_message',
        'user_messages',
        id,
        'rejected_user_message_expired',
        'pending',
        NOW(),
        jsonb_build_object('retention_days', retention_days)
    FROM rejected_user_messages_for_cleanup
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS rejected_messages_count = ROW_COUNT;

    INSERT INTO moderation_cleanup_queue (
        target_type,
        target_table,
        target_id,
        reason,
        status,
        scheduled_for,
        metadata
    )
    SELECT
        'content_report',
        'content_reports',
        id,
        'pending_content_report_expired',
        'pending',
        NOW(),
        jsonb_build_object('retention_days', retention_days)
    FROM pending_content_reports_for_cleanup
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS pending_reports_count = ROW_COUNT;

    RETURN QUERY VALUES
        ('user_messages_pending'::TEXT, pending_messages_count),
        ('user_messages_rejected'::TEXT, rejected_messages_count),
        ('content_reports_pending'::TEXT, pending_reports_count);
END;
$$;

REVOKE ALL ON FUNCTION enqueue_expired_pending_items() FROM PUBLIC;

COMMENT ON VIEW pending_user_messages_for_cleanup IS 'Vista interna de user_messages pending_review antiguos candidatos a revision/limpieza';
COMMENT ON VIEW rejected_user_messages_for_cleanup IS 'Vista interna de user_messages rechazados antiguos candidatos a borrado controlado';
COMMENT ON VIEW pending_content_reports_for_cleanup IS 'Vista interna de content_reports pending_review antiguos candidatos a revision/limpieza';
COMMENT ON FUNCTION enqueue_expired_pending_items() IS 'Encola candidatos caducados en moderation_cleanup_queue; no borra datos automaticamente';
