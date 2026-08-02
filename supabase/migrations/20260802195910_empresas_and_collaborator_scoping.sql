/*
# Empresas (Provider Companies) & Collaborator Scoping

1. New Tables
- `empresas` — maintenance provider companies (clients of ManuGent)
  - id, name, tax_id, email, phone, address, city, domain, active, created_at

2. Schema changes
- `users` — add empresa_id, department, position, avatar_url, phone, status, status_reason, status_updated_at, permissions columns

3. RPC functions
- `get_users_with_teams()` — includes empresa info
- `get_collaborators_with_empresa()` — lists non-client users with empresa
- `verify_user_password(text, text)` — includes empresa_id and permissions

4. Security
- RLS enabled on empresas with permissive policy (app has own JWT auth layer)
*/

CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text,
  email text,
  phone text,
  address text,
  city text,
  domain text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_empresas" ON empresas;
CREATE POLICY "anon_all_empresas" ON empresas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS users_empresa_idx ON users(empresa_id);

DROP FUNCTION IF EXISTS get_users_with_teams();
CREATE FUNCTION get_users_with_teams()
RETURNS TABLE (
  id uuid, team_id uuid, name text, email text, role text, created_at timestamptz,
  team_name text, status text, status_reason text, status_updated_at timestamptz,
  empresa_id uuid, empresa_name text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
GRANT EXECUTE ON FUNCTION get_users_with_teams() TO anon, authenticated;

DROP FUNCTION IF EXISTS get_collaborators_with_empresa();
CREATE FUNCTION get_collaborators_with_empresa()
RETURNS TABLE (
  id uuid, name text, email text, role text, team_id uuid, team_name text,
  empresa_id uuid, empresa_name text, phone text, department text, created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
GRANT EXECUTE ON FUNCTION get_collaborators_with_empresa() TO anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP FUNCTION IF EXISTS verify_user_password(text, text);
CREATE FUNCTION verify_user_password(p_email text, p_password text)
RETURNS TABLE (
  id uuid, name text, email text, role text, team_id uuid,
  status text, status_reason text, empresa_id uuid, permissions jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgcrypto
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role, u.team_id, u.status, u.status_reason,
         u.empresa_id, u.permissions
  FROM users u
  WHERE lower(u.email) = lower(p_email)
    AND u.password_hash IS NOT NULL
    AND u.password_hash = crypt(p_password, u.password_hash)
  LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION verify_user_password(text, text) TO anon, authenticated;