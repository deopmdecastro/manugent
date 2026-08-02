-- ── Expandir estrutura automática de pastas ──────────────────────────────────
-- Adiciona pastas importantes que faltavam nas RPCs create_empresa_folder_structure()
-- e create_client_folder_structure(): Conhecimento, Fichas Técnicas, Orçamentos, Senhas.
-- Idempotente: usa NOT EXISTS, por isso pode ser corrido em empresas/clientes já existentes.

-- ── RPC: create_empresa_folder_structure (expandida) ─────────────────────────

CREATE OR REPLACE FUNCTION create_empresa_folder_structure(p_empresa_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_root_id uuid;
  v_empresa_name text;
  v_subfolders text[] := ARRAY['Documentos','Contratos','Colaboradores','Clientes','Conhecimento','Fichas Técnicas','Orçamentos','Senhas','Outros'];
  v_subfolder_type text[] := ARRAY['documentos','contratos','colaboradores','clientes','conhecimento','fichas_tecnicas','orcamentos','senhas','outros'];
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

-- ── RPC: create_client_folder_structure (expandida) ──────────────────────────

CREATE OR REPLACE FUNCTION create_client_folder_structure(p_client_id uuid, p_empresa_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_client_name text;
  v_client_root_id uuid;
  v_clientes_folder_id uuid;
  v_empresa_root_id uuid;
  v_subfolders text[] := ARRAY['Contratos','Orçamentos','Faturas','Equipamentos','Fichas Técnicas','Conhecimento','Senhas','Manutenções','Incidentes','Relatórios','Outros'];
  v_subfolder_type text[] := ARRAY['cliente_contratos','cliente_orcamentos','cliente_faturas','cliente_equipamentos','cliente_fichas_tecnicas','cliente_conhecimento','cliente_senhas','cliente_manutencoes','cliente_incidentes','cliente_relatorios','cliente_outros'];
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

-- ── RPC: get_empresa_folder_tree (ordenação atualizada com as novas pastas) ──

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
      WHEN f.folder_type = 'conhecimento' THEN 5
      WHEN f.folder_type = 'fichas_tecnicas' THEN 6
      WHEN f.folder_type = 'orcamentos' THEN 7
      WHEN f.folder_type = 'senhas' THEN 8
      WHEN f.folder_type = 'cliente_root' THEN 10
      WHEN f.folder_type = 'cliente_contratos' THEN 11
      WHEN f.folder_type = 'cliente_orcamentos' THEN 12
      WHEN f.folder_type = 'cliente_faturas' THEN 13
      WHEN f.folder_type = 'cliente_equipamentos' THEN 14
      WHEN f.folder_type = 'cliente_fichas_tecnicas' THEN 15
      WHEN f.folder_type = 'cliente_conhecimento' THEN 16
      WHEN f.folder_type = 'cliente_senhas' THEN 17
      WHEN f.folder_type = 'cliente_manutencoes' THEN 18
      WHEN f.folder_type = 'cliente_incidentes' THEN 19
      WHEN f.folder_type = 'cliente_relatorios' THEN 20
      WHEN f.folder_type = 'cliente_edificios' THEN 21
      WHEN f.folder_type = 'cliente_outros' THEN 22
      WHEN f.folder_type = 'outros' THEN 99
      ELSE 50
    END AS sort_order
  FROM folders f
  WHERE f.empresa_id = p_empresa_id
  ORDER BY sort_order ASC, f.name ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION get_empresa_folder_tree(uuid) TO anon, authenticated;

-- ── Backfill: aplicar as novas pastas a empresas e clientes já existentes ────
-- Seguro de repetir: create_*_folder_structure só insere pastas que ainda não existem.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM empresas LOOP
    PERFORM create_empresa_folder_structure(r.id);
  END LOOP;

  FOR r IN SELECT id, empresa_id FROM clients WHERE empresa_id IS NOT NULL LOOP
    PERFORM create_client_folder_structure(r.id, r.empresa_id);
  END LOOP;
END;
$$;
