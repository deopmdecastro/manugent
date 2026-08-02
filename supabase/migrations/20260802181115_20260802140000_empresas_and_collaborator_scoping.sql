/*
# Empresas (Provider Companies) & Collaborator Scoping
*/

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
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_empresas" ON empresas;
CREATE POLICY "anon_all_empresas" ON empresas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── Ligação users → empresa ─────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_empresa_idx ON users(empresa_id);

-- ── RPC: substituir get_users_with_teams para incluir empresa ────────────────

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
         u.empresa_id, e.name AS empresa_name
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  LEFT JOIN empresas e ON e.id = u.empresa_id
  ORDER BY u.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_users_with_teams() TO anon, authenticated;

-- ── RPC: listar colaboradores (não-clientes) com empresa ─────────────────────

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

GRANT EXECUTE ON FUNCTION get_collaborators_with_empresa() TO anon, authenticated;