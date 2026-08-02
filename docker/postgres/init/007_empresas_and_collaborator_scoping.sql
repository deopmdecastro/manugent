-- 007_empresas_and_collaborator_scoping.sql
-- Multi-empresa (prestadoras de manutenção) + collaborator scoping.
--
-- Espelha (adaptado ao Postgres standalone, sem RLS/roles anon/authenticated):
--   supabase/migrations/20260802181115_20260802140000_empresas_and_collaborator_scoping.sql
--   supabase/migrations/20260802181148_20260802140100_add_user_profile_columns.sql
--   supabase/migrations/20260802181207_20260802140200_add_user_phone_column.sql
--   supabase/migrations/20260802181305_20260802140300_fix_rpc_functions_with_empresa_and_status.sql
--   supabase/migrations/20260802181322_20260802140400_add_user_status_columns.sql
--   supabase/migrations/20260802181334_20260802140500_fix_crypt_search_path.sql
--   supabase/migrations/20260802181352_20260802140600_fix_crypt_extensions_schema.sql

-- ── Tabela de Empresas (prestadoras de manutenção) ─────────────────────────

CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text,
  email text,
  phone text,
  address text,
  city text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Ligação users → empresa ────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_empresa_idx ON users(empresa_id);

-- ── Perfis de colaborador (department / position / avatar_url / phone) ─────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone text;

-- ── RPC: get_users_with_teams (inclui status + empresa) ────────────────────

DROP FUNCTION IF EXISTS get_users_with_teams();

CREATE OR REPLACE FUNCTION get_users_with_teams()
RETURNS TABLE (
  id uuid,
  team_id uuid,
  name text,
  email text,
  role text,
  created_at timestamptz,
  team_name text,
  status text,
  status_reason text,
  status_updated_at timestamptz,
  empresa_id uuid,
  empresa_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.team_id, u.name, u.email, u.role, u.created_at,
         t.name AS team_name,
         u.status, u.status_reason, u.status_updated_at,
         u.empresa_id, e.name AS empresa_name
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  LEFT JOIN empresas e ON e.id = u.empresa_id
  ORDER BY u.name ASC;
END;
$$;

-- ── RPC: listar colaboradores (não-clientes) com empresa ───────────────────

DROP FUNCTION IF EXISTS get_collaborators_with_empresa();

CREATE OR REPLACE FUNCTION get_collaborators_with_empresa()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  team_id uuid,
  team_name text,
  empresa_id uuid,
  empresa_name text,
  phone text,
  department text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role,
         u.team_id, t.name AS team_name,
         u.empresa_id, e.name AS empresa_name,
         u.phone, u.department, u.created_at
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  LEFT JOIN empresas e ON e.id = u.empresa_id
  WHERE u.role IN ('superadmin','admin','gestor','tecnico','engenheiro','financeiro','supervisor')
  ORDER BY u.name ASC;
END;
$$;

-- ── RPC: verify_user_password (inclui empresa_id) ──────────────────────────

DROP FUNCTION IF EXISTS verify_user_password(text, text);

CREATE OR REPLACE FUNCTION verify_user_password(p_email text, p_password text)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  team_id uuid,
  status text,
  status_reason text,
  empresa_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgcrypto
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role, u.team_id, u.status, u.status_reason, u.empresa_id
  FROM users u
  WHERE lower(u.email) = lower(p_email)
    AND u.password_hash IS NOT NULL
    AND u.password_hash = crypt(p_password, u.password_hash)
  LIMIT 1;
END;
$$;

-- ── Grants (condicionais — standalone Docker não tem roles anon) ───────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_users_with_teams() TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_collaborators_with_empresa() TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION verify_user_password(text, text) TO anon, authenticated';
  END IF;
END $$;

