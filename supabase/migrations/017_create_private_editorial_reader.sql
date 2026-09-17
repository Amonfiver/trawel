/**
 * Migration 017: private editorial reader.
 *
 * Purpose:
 * - Allow only explicitly assigned Supabase Auth users to read unpublished
 *   editorial drafts through a server-side Edge Function.
 * - Keep direct API access to drafts closed for anon and authenticated roles.
 *
 * This migration does not modify editorial content, its status, or public RLS.
 */

CREATE TABLE IF NOT EXISTS editorial_reader_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT editorial_reader_roles_role_check
        CHECK (role IN ('editor', 'admin')),
    CONSTRAINT editorial_reader_roles_status_check
        CHECK (status IN ('active', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_editorial_reader_roles_active
ON editorial_reader_roles(user_id, role)
WHERE status = 'active';

DROP TRIGGER IF EXISTS update_editorial_reader_roles_updated_at ON editorial_reader_roles;
CREATE TRIGGER update_editorial_reader_roles_updated_at
BEFORE UPDATE ON editorial_reader_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE editorial_reader_roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON editorial_reader_roles FROM anon, authenticated;

COMMENT ON TABLE editorial_reader_roles IS
  'Allow-list of Supabase Auth users permitted to read unpublished editorial drafts through private-editorial-reader only.';
