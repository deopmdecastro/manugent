-- 010_multi_tenant_folders_and_access.sql
-- Multi-tenant hierarchy: Empresas → Clientes, auto-folder structure, access control.
--
-- Mirrors supabase/migrations/20260802190000_multi_tenant_folders_and_access.sql
-- adapted for standalone Docker PostgreSQL (no RLS roles, no Supabase auth).

-- ── 1. Empresas: add domain column ──────────────────────────────────────────

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS domain text;

-- ── 2. Clients: link to empresa ─────────────────────────────────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clients_empresa_idx ON clients(empresa_id);

-- ── 3. Users: permissions jsonb for fine-grained collaborator access ─────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── 4. Folders: multi-tenant scoping ────────────────────────────────────────

ALTER TABLE folders
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS folder_type text NOT NULL DEFAULT 'generic';

CREATE INDEX IF NOT EXISTS folders_empresa_idx ON folders(empresa_id);
CREATE INDEX IF NOT EXISTS folders_client_idx ON folders(client_id);

-- ── 5. Documents: multi-tenant scoping ──────────────────────────────────────

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS documents_empresa_idx ON documents(empresa_id);
CREATE INDEX IF NOT EXISTS documents_client_idx ON documents(client_id);

-- ── 6. RPC: create_empresa_folder_structure ────────────────────────────────
-- Called when an empresa is created. Creates the root folder tree:
--   Empresa/
--   ├── Documentos
--   ├── Contratos
--   ├── Colaboradores
--   ├── Clientes
--   └── Outros

CREATE OR REPLACE FUNCTION create_empresa_folder_structure(p_empresa_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_root_id uuid;
  v_sub_id uuid;
  v_empresa_name text;
  v_subfolders text[] := ARRAY['Documentos','Contratos','Colaboradores','Clientes','Outros'];
  v_subfolder_type text[] := ARRAY['documentos','contratos','colaboradores','clientes','outros'];
  v_folder_type text;
  v_folder_name text;
BEGIN
  SELECT name INTO v_empresa_name FROM empresas WHERE id = p_empresa_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa % not found', p_empresa_id;
  END IF;

  -- Root folder for this empresa (folder_type = 'empresa_root')
  INSERT INTO folders (name, parent_id, empresa_id, folder_type)
  VALUES (v_empresa_name, NULL, p_empresa_id, 'empresa_root')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_root_id;

  -- If conflict (already exists), fetch it
  IF v_root_id IS NULL THEN
    SELECT id INTO v_root_id FROM folders WHERE empresa_id = p_empresa_id AND folder_type = 'empresa_root' LIMIT 1;
  END IF;

  -- Subfolders
  FOR i IN 1..array_length(v_subfolders, 1) LOOP
    v_folder_name := v_subfolders[i];
    v_folder_type := v_subfolder_type[i];
    INSERT INTO folders (name, parent_id, empresa_id, folder_type)
    SELECT v_folder_name, v_root_id, p_empresa_id, v_folder_type
    WHERE NOT EXISTS (
      SELECT 1 FROM folders WHERE empresa_id = p_empresa_id AND parent_id = v_root_id AND name = v_folder_name
    );
  END LOOP;

  RETURN v_root_id;
END;
$$;

-- ── 7. RPC: create_client_folder_structure ──────────────────────────────────
-- Called when a client is created. Creates:
--   Empresa/Clientes/Cliente N/
--     ├── Contratos
--     ├── Equipamentos
--     ├── Manutenções
--     ├── Incidentes
--     ├── Relatórios
--     └── Outros

CREATE OR REPLACE FUNCTION create_client_folder_structure(p_client_id uuid, p_empresa_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name text;
  v_client_root_id uuid;
  v_clientes_folder_id uuid;
  v_empresa_root_id uuid;
  v_subfolders text[] := ARRAY['Contratos','Equipamentos','Manutenções','Incidentes','Relatórios','Outros'];
  v_subfolder_type text[] := ARRAY['cliente_contratos','cliente_equipamentos','cliente_manutencoes','cliente_incidentes','cliente_relatorios','cliente_outros'];
  v_folder_name text;
  v_folder_type text;
BEGIN
  SELECT name INTO v_client_name FROM clients WHERE id = p_client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client % not found', p_client_id;
  END IF;

  -- Get or create the empresa root folder
  v_empresa_root_id := create_empresa_folder_structure(p_empresa_id);

  -- Find the "Clientes" subfolder under the empresa root
  SELECT id INTO v_clientes_folder_id
  FROM folders
  WHERE empresa_id = p_empresa_id AND parent_id = v_empresa_root_id AND folder_type = 'clientes'
  LIMIT 1;

  IF v_clientes_folder_id IS NULL THEN
    INSERT INTO folders (name, parent_id, empresa_id, folder_type)
    VALUES ('Clientes', v_empresa_root_id, p_empresa_id, 'clientes')
    RETURNING id INTO v_clientes_folder_id;
  END IF;

  -- Client root folder under Clientes
  INSERT INTO folders (name, parent_id, empresa_id, client_id, folder_type)
  VALUES (v_client_name, v_clientes_folder_id, p_empresa_id, p_client_id, 'cliente_root')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_client_root_id;

  IF v_client_root_id IS NULL THEN
    SELECT id INTO v_client_root_id FROM folders WHERE client_id = p_client_id AND folder_type = 'cliente_root' LIMIT 1;
  END IF;

  -- Client subfolders
  FOR i IN 1..array_length(v_subfolders, 1) LOOP
    v_folder_name := v_subfolders[i];
    v_folder_type := v_subfolder_type[i];
    INSERT INTO folders (name, parent_id, empresa_id, client_id, folder_type)
    SELECT v_folder_name, v_client_root_id, p_empresa_id, p_client_id, v_folder_type
    WHERE NOT EXISTS (
      SELECT 1 FROM folders WHERE client_id = p_client_id AND parent_id = v_client_root_id AND name = v_folder_name
    );
  END LOOP;

  RETURN v_client_root_id;
END;
$$;

-- ── 8. RPC: get_empresa_folder_tree ───────────────────────────────────────────
-- Returns the full folder tree for an empresa, including client subfolders.

CREATE OR REPLACE FUNCTION get_empresa_folder_tree(p_empresa_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  parent_id uuid,
  folder_type text,
  empresa_id uuid,
  client_id uuid,
  created_at timestamptz,
  sort_order integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id, f.name, f.parent_id, f.folder_type, f.empresa_id, f.client_id, f.created_at,
    CASE
      WHEN f.folder_type = 'empresa_root' THEN 0
      WHEN f.folder_type = 'documentos' THEN 1
      WHEN f.folder_type = 'contratos' THEN 2
      WHEN f.folder_type = 'colaboradores' THEN 3
      WHEN f.folder_type = 'clientes' THEN 4
      WHEN f.folder_type = 'cliente_root' THEN 10
      WHEN f.folder_type = 'cliente_contratos' THEN 11
      WHEN f.folder_type = 'cliente_equipamentos' THEN 12
      WHEN f.folder_type = 'cliente_manutencoes' THEN 13
      WHEN f.folder_type = 'cliente_incidentes' THEN 14
      WHEN f.folder_type = 'cliente_relatorios' THEN 15
      WHEN f.folder_type = 'cliente_outros' THEN 16
      WHEN f.folder_type = 'outros' THEN 99
      ELSE 50
    END AS sort_order
  FROM folders f
  WHERE f.empresa_id = p_empresa_id
  ORDER BY sort_order ASC, f.name ASC;
END;
$$;

-- ── 9. RPC: get_clients_by_empresa ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_clients_by_empresa(p_empresa_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  tax_id text,
  sector text,
  active boolean,
  since date,
  empresa_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.email, c.phone, c.tax_id, c.sector, c.active, c.since,
         c.empresa_id, c.created_at
  FROM clients c
  WHERE c.empresa_id = p_empresa_id
  ORDER BY c.name ASC;
END;
$$;

-- ── 10. RPC: get_collaborators_by_empresa ─────────────────────────────────────

CREATE OR REPLACE FUNCTION get_collaborators_by_empresa(p_empresa_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  team_id uuid,
  team_name text,
  phone text,
  department text,
  job_position text,
  permissions jsonb,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role,
         u.team_id, t.name AS team_name,
         u.phone, u.department, u.position AS job_position,
         u.permissions, u.status,
         u.created_at
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  WHERE u.empresa_id = p_empresa_id
    AND u.role IN ('admin','gestor','tecnico','engenheiro','financeiro','supervisor')
  ORDER BY u.name ASC;
END;
$$;

-- ── 11. Update verify_user_password to include permissions ───────────────────

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
  empresa_id uuid,
  permissions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgcrypto
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

-- ── 12. Grants (conditional — standalone Docker has no anon role) ─────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION create_empresa_folder_structure(uuid) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION create_client_folder_structure(uuid, uuid) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_empresa_folder_tree(uuid) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_clients_by_empresa(uuid) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_collaborators_by_empresa(uuid) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION verify_user_password(text, text) TO anon, authenticated';
  END IF;
END $$;
