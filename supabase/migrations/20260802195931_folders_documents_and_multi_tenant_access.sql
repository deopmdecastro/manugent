/*
# Folders, Documents & Multi-tenant Access Control

1. New Tables
- `folders` — hierarchical folder tree for empresa/client document organization
  - id, name, parent_id (self-ref), owner_id, empresa_id, client_id, folder_type, created_at
- `documents` — documents linked to folders and entities
  - id, name, type, folder_id, entity_type, entity_id, empresa_id, client_id, uploaded_by, uploaded_at, size_kb, url

2. Schema changes
- `clients` — add `empresa_id` FK → empresas(id), `tax_id`, `sector`, `active`, `since` columns

3. RPC functions
- `create_empresa_folder_structure(uuid)` — auto-creates Empresa/{Documentos,Contratos,Colaboradores,Clientes,Outros}
- `create_client_folder_structure(uuid, uuid)` — auto-creates Cliente/{Contratos,Equipamentos,Manutenções,Incidentes,Relatórios,Outros}
- `get_empresa_folder_tree(uuid)` — returns full folder tree for an empresa
- `get_clients_by_empresa(uuid)` — returns clients scoped to an empresa
- `get_collaborators_by_empresa(uuid)` — returns collaborators scoped to an empresa

4. Security
- RLS enabled on folders and documents with permissive policies (app has own JWT auth layer)
*/

-- ── Clients: extend with empresa link and extra columns ─────────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS since date;

CREATE INDEX IF NOT EXISTS clients_empresa_idx ON clients(empresa_id);

-- ── Folders table ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id),
  owner_id uuid REFERENCES users(id),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  folder_type text NOT NULL DEFAULT 'generic',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_folders" ON folders;
CREATE POLICY "anon_all_folders" ON folders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS folders_empresa_idx ON folders(empresa_id);
CREATE INDEX IF NOT EXISTS folders_client_idx ON folders(client_id);

-- ── Documents table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('manual', 'garantia', 'relatorio', 'contrato', 'fatura', 'certificado')),
  folder_id uuid REFERENCES folders(id),
  entity_type text NOT NULL CHECK (entity_type IN ('equipment', 'client', 'building', 'work_order', 'contract')),
  entity_id uuid NOT NULL,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  size_kb integer NOT NULL DEFAULT 0,
  url text
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_documents" ON documents;
CREATE POLICY "anon_all_documents" ON documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS documents_empresa_idx ON documents(empresa_id);
CREATE INDEX IF NOT EXISTS documents_client_idx ON documents(client_id);

-- ── RPC: create_empresa_folder_structure ────────────────────────────────────

CREATE OR REPLACE FUNCTION create_empresa_folder_structure(p_empresa_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_root_id uuid;
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

  INSERT INTO folders (name, parent_id, empresa_id, folder_type)
  VALUES (v_empresa_name, NULL, p_empresa_id, 'empresa_root')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_root_id;

  IF v_root_id IS NULL THEN
    SELECT id INTO v_root_id FROM folders WHERE empresa_id = p_empresa_id AND folder_type = 'empresa_root' LIMIT 1;
  END IF;

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
GRANT EXECUTE ON FUNCTION create_empresa_folder_structure(uuid) TO anon, authenticated;

-- ── RPC: create_client_folder_structure ──────────────────────────────────────

CREATE OR REPLACE FUNCTION create_client_folder_structure(p_client_id uuid, p_empresa_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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

  v_empresa_root_id := create_empresa_folder_structure(p_empresa_id);

  SELECT id INTO v_clientes_folder_id
  FROM folders
  WHERE empresa_id = p_empresa_id AND parent_id = v_empresa_root_id AND folder_type = 'clientes'
  LIMIT 1;

  IF v_clientes_folder_id IS NULL THEN
    INSERT INTO folders (name, parent_id, empresa_id, folder_type)
    VALUES ('Clientes', v_empresa_root_id, p_empresa_id, 'clientes')
    RETURNING id INTO v_clientes_folder_id;
  END IF;

  INSERT INTO folders (name, parent_id, empresa_id, client_id, folder_type)
  VALUES (v_client_name, v_clientes_folder_id, p_empresa_id, p_client_id, 'cliente_root')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_client_root_id;

  IF v_client_root_id IS NULL THEN
    SELECT id INTO v_client_root_id FROM folders WHERE client_id = p_client_id AND folder_type = 'cliente_root' LIMIT 1;
  END IF;

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
GRANT EXECUTE ON FUNCTION create_client_folder_structure(uuid, uuid) TO anon, authenticated;

-- ── RPC: get_empresa_folder_tree ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_empresa_folder_tree(p_empresa_id uuid)
RETURNS TABLE (
  id uuid, name text, parent_id uuid, folder_type text,
  empresa_id uuid, client_id uuid, created_at timestamptz, sort_order integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
GRANT EXECUTE ON FUNCTION get_empresa_folder_tree(uuid) TO anon, authenticated;

-- ── RPC: get_clients_by_empresa ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_clients_by_empresa(p_empresa_id uuid)
RETURNS TABLE (
  id uuid, name text, email text, phone text, tax_id text, sector text,
  active boolean, since date, empresa_id uuid, created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
GRANT EXECUTE ON FUNCTION get_clients_by_empresa(uuid) TO anon, authenticated;

-- ── RPC: get_collaborators_by_empresa ────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_collaborators_by_empresa(p_empresa_id uuid)
RETURNS TABLE (
  id uuid, name text, email text, role text, team_id uuid, team_name text,
  phone text, department text, job_position text, permissions jsonb, status text,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
GRANT EXECUTE ON FUNCTION get_collaborators_by_empresa(uuid) TO anon, authenticated;