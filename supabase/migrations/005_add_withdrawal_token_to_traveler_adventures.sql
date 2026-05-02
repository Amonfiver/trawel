/**
 * Migración 005: Retirada privada de aventuras pendientes
 *
 * Propósito:
 * Permitir que un viajero retire una aventura antes de revisión usando un token privado.
 *
 * Alcance:
 * - Añade hash de token, fecha de creación de token y fecha de retirada.
 * - Amplía estados de moderación con `withdrawn`.
 * - Refuerza INSERT público para exigir hash de retirada en nuevos envíos.
 *
 * Decisiones:
 * - El navegador genera el token y solo guarda su hash SHA-256 en base de datos.
 * - La retirada es soft-delete: `status = withdrawn`, no borrado físico.
 * - Solo una Edge Function con service_role puede validar token y retirar.
 *
 * Limitaciones:
 * - No envía email automático con el enlace/código de retirada.
 * - Si el usuario pierde el token, la retirada queda para soporte/webmaster.
 *
 * Cambios recientes:
 * - Base persistente para flujo pending -> withdrawn por token privado.
 */

-- ============================================
-- COLUMNAS DE RETIRADA
-- ============================================

ALTER TABLE traveler_adventures
ADD COLUMN IF NOT EXISTS withdrawal_token_hash TEXT,
ADD COLUMN IF NOT EXISTS withdrawal_token_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

-- ============================================
-- CONSTRAINTS
-- ============================================

ALTER TABLE traveler_adventures
DROP CONSTRAINT IF EXISTS traveler_adventures_status_check;

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'));

ALTER TABLE traveler_adventures
DROP CONSTRAINT IF EXISTS traveler_adventures_withdrawal_token_check;

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_withdrawal_token_check
CHECK (
    (
        withdrawal_token_hash IS NULL
        AND withdrawal_token_created_at IS NULL
    )
    OR (
        withdrawal_token_hash ~ '^[a-f0-9]{64}$'
        AND withdrawal_token_created_at IS NOT NULL
    )
);

ALTER TABLE traveler_adventures
DROP CONSTRAINT IF EXISTS traveler_adventures_withdrawn_at_check;

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_withdrawn_at_check
CHECK (
    (status = 'withdrawn' AND withdrawn_at IS NOT NULL)
    OR (status <> 'withdrawn' AND withdrawn_at IS NULL)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_traveler_adventures_withdrawal_token_hash
ON traveler_adventures(withdrawal_token_hash)
WHERE withdrawal_token_hash IS NOT NULL;

-- ============================================
-- GRANTS Y RLS
-- ============================================

GRANT INSERT (
    withdrawal_token_hash,
    withdrawal_token_created_at
) ON traveler_adventures TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public pending traveler adventure submissions"
ON traveler_adventures;

CREATE POLICY "Allow public pending traveler adventure submissions"
ON traveler_adventures
FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'pending'
    AND moderation_notes IS NULL
    AND approved_at IS NULL
    AND photo_path IS NULL
    AND withdrawn_at IS NULL
    AND privacy_accepted_at IS NOT NULL
    AND length(trim(privacy_version)) > 0
    AND withdrawal_token_hash ~ '^[a-f0-9]{64}$'
    AND withdrawal_token_created_at IS NOT NULL
    AND (
        (marketing_consent = TRUE AND marketing_consent_at IS NOT NULL)
        OR (marketing_consent = FALSE AND marketing_consent_at IS NULL)
    )
);

-- ============================================
-- COMENTARIOS DOCUMENTALES
-- ============================================

COMMENT ON COLUMN traveler_adventures.withdrawal_token_hash IS 'Hash SHA-256 del token privado que permite retirar una aventura pending';
COMMENT ON COLUMN traveler_adventures.withdrawal_token_created_at IS 'Fecha de creación del token privado de retirada';
COMMENT ON COLUMN traveler_adventures.withdrawn_at IS 'Fecha en la que el viajero retiró la aventura antes de revisión';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
