/**
 * Migración 004: Consentimiento de privacidad para aventuras de viajeros
 *
 * Propósito:
 * Registrar aceptación de privacidad obligatoria y consentimiento comercial opcional.
 *
 * Alcance:
 * - Añade columnas de privacidad/marketing a traveler_adventures.
 * - Actualiza filas existentes para no romper datos de prueba ya aprobados.
 * - Refuerza la policy pública de INSERT para aceptar solo envíos con privacidad.
 *
 * Decisiones:
 * - La privacidad es obligatoria para enviar una aventura.
 * - El marketing queda separado y opcional.
 * - El frontend no puede insertar aventuras sin privacy_accepted_at.
 *
 * Limitaciones:
 * - No implementa borrado automático, newsletter real ni gestión legal completa.
 * - El texto de privacidad debe revisarse por asesoría/legal antes de producción pública.
 *
 * Cambios recientes:
 * - Base persistente para consentimiento privacidad/marketing en envíos pending.
 */

-- ============================================
-- COLUMNAS DE CONSENTIMIENTO
-- ============================================

ALTER TABLE traveler_adventures
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_version TEXT NOT NULL DEFAULT '2026-05-02',
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ;

-- Compatibilidad con aventuras de prueba ya existentes antes de exigir privacidad.
UPDATE traveler_adventures
SET
    privacy_accepted_at = COALESCE(privacy_accepted_at, created_at),
    privacy_version = COALESCE(NULLIF(trim(privacy_version), ''), '2026-05-02'),
    marketing_consent = COALESCE(marketing_consent, FALSE)
WHERE privacy_accepted_at IS NULL
   OR privacy_version IS NULL
   OR trim(privacy_version) = '';

ALTER TABLE traveler_adventures
ALTER COLUMN privacy_accepted_at SET NOT NULL;

ALTER TABLE traveler_adventures
ALTER COLUMN privacy_version SET NOT NULL;

ALTER TABLE traveler_adventures
ALTER COLUMN marketing_consent SET NOT NULL;

-- ============================================
-- CONSTRAINTS
-- ============================================

ALTER TABLE traveler_adventures
DROP CONSTRAINT IF EXISTS traveler_adventures_privacy_version_check;

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_privacy_version_check
CHECK (length(trim(privacy_version)) > 0);

ALTER TABLE traveler_adventures
DROP CONSTRAINT IF EXISTS traveler_adventures_marketing_consent_at_check;

ALTER TABLE traveler_adventures
ADD CONSTRAINT traveler_adventures_marketing_consent_at_check
CHECK (
    (marketing_consent = TRUE AND marketing_consent_at IS NOT NULL)
    OR (marketing_consent = FALSE AND marketing_consent_at IS NULL)
);

-- ============================================
-- GRANTS Y RLS
-- ============================================

GRANT INSERT (
    privacy_accepted_at,
    privacy_version,
    marketing_consent,
    marketing_consent_at
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
    AND privacy_accepted_at IS NOT NULL
    AND length(trim(privacy_version)) > 0
    AND (
        (marketing_consent = TRUE AND marketing_consent_at IS NOT NULL)
        OR (marketing_consent = FALSE AND marketing_consent_at IS NULL)
    )
);

-- ============================================
-- COMENTARIOS DOCUMENTALES
-- ============================================

COMMENT ON COLUMN traveler_adventures.privacy_accepted_at IS 'Fecha en la que el viajero aceptó la política de privacidad para enviar su aventura';
COMMENT ON COLUMN traveler_adventures.privacy_version IS 'Versión del texto de privacidad aceptado por el viajero';
COMMENT ON COLUMN traveler_adventures.marketing_consent IS 'Consentimiento opcional separado para comunicaciones, promociones u ofertas';
COMMENT ON COLUMN traveler_adventures.marketing_consent_at IS 'Fecha del consentimiento opcional de marketing; null si no se aceptó';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
