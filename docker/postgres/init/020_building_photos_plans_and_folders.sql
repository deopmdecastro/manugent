-- Mirrors supabase/migrations/20260807004457_building_photos_plans_and_folders.sql
-- adapted for standalone Docker PostgreSQL (no RLS roles, no Supabase auth).

/*
# Fotos, plantas e pastas automáticas para Edifícios / Instalações

1. Schema changes
   - `buildings.description` — campo de notas/descrição livre (mais informação no modal).
   - `documents.type` — a regra (CHECK constraint) só permitia
     ('manual','garantia','relatorio','contrato','fatura','certificado').
     Passa a incluir também 'foto' e 'planta', para podermos guardar fotos
     e plantas de edifícios/zonas técnicas como documentos reais em vez de
     apenas base64 solto no ecrã.

2. Pastas automáticas
   - `create_client_folder_structure` já previa 'cliente_edificios' na
     ordenação de `get_empresa_folder_tree` mas nunca chegou a criar essa
     pasta "Edifícios" — corrigido aqui.
   - Nova RPC `create_building_folder_structure(building_id, client_id,
     empresa_id, building_name)` — cria, por baixo de
     Cliente/Edifícios/{Nome do edifício}, as subpastas Fotos, Plantas e
     Documentos. Chamada uma única vez, no POST /api/buildings (criação),
     tal como já acontece para empresas e clientes.

Aditivo e idempotente (ADD COLUMN IF NOT EXISTS / NOT EXISTS) — seguro de
repetir e não quebra dados existentes.
*/

-- ── 1. buildings.description ─────────────────────────────────────────────────

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS description text;

-- ── 2. documents.type — adicionar 'foto' e 'planta' à regra existente ────────

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_type_check
  CHECK (type IN ('manual', 'garantia', 'relatorio', 'contrato', 'fatura', 'certificado', 'foto', 'planta'));

-- ── 3. create_client_folder_structure — adiciona a pasta "Edifícios" ─────────

CREATE OR REPLACE FUNCTION create_client_folder_structure(p_client_id uuid, p_empresa_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_client_name text;
  v_client_root_id uuid;
  v_clientes_folder_id uuid;
  v_empresa_root_id uuid;
  v_subfolders text[] := ARRAY['Contratos','Orçamentos','Faturas','Equipamentos','Edifícios','Fichas Técnicas','Conhecimento','Senhas','Manutenções','Incidentes','Relatórios','Outros'];
  v_subfolder_type text[] := ARRAY['cliente_contratos','cliente_orcamentos','cliente_faturas','cliente_equipamentos','cliente_edificios','cliente_fichas_tecnicas','cliente_conhecimento','cliente_senhas','cliente_manutencoes','cliente_incidentes','cliente_relatorios','cliente_outros'];
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
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION create_client_folder_structure(uuid, uuid) TO anon, authenticated';
  END IF;
END $do$;

-- ── 4. Nova RPC: create_building_folder_structure ────────────────────────────

CREATE OR REPLACE FUNCTION create_building_folder_structure(p_building_id uuid, p_client_id uuid, p_empresa_id uuid, p_building_name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_client_root_id uuid;
  v_edificios_folder_id uuid;
  v_building_root_id uuid;
  v_subfolders text[] := ARRAY['Fotos','Plantas','Documentos'];
  v_subfolder_type text[] := ARRAY['edificio_fotos','edificio_plantas','edificio_documentos'];
  v_folder_name text;
  v_folder_type text;
BEGIN
  v_client_root_id := create_client_folder_structure(p_client_id, p_empresa_id);

  SELECT id INTO v_edificios_folder_id
  FROM folders
  WHERE client_id = p_client_id AND parent_id = v_client_root_id AND folder_type = 'cliente_edificios'
  LIMIT 1;

  IF v_edificios_folder_id IS NULL THEN
    INSERT INTO folders (name, parent_id, empresa_id, client_id, folder_type)
    VALUES ('Edifícios', v_client_root_id, p_empresa_id, p_client_id, 'cliente_edificios')
    RETURNING id INTO v_edificios_folder_id;
  END IF;

  SELECT id INTO v_building_root_id
  FROM folders
  WHERE client_id = p_client_id AND parent_id = v_edificios_folder_id AND folder_type = 'edificio_root' AND name = p_building_name
  LIMIT 1;

  IF v_building_root_id IS NULL THEN
    INSERT INTO folders (name, parent_id, empresa_id, client_id, folder_type)
    VALUES (p_building_name, v_edificios_folder_id, p_empresa_id, p_client_id, 'edificio_root')
    RETURNING id INTO v_building_root_id;
  END IF;

  FOR i IN 1..array_length(v_subfolders, 1) LOOP
    v_folder_name := v_subfolders[i];
    v_folder_type := v_subfolder_type[i];
    INSERT INTO folders (name, parent_id, empresa_id, client_id, folder_type)
    SELECT v_folder_name, v_building_root_id, p_empresa_id, p_client_id, v_folder_type
    WHERE NOT EXISTS (
      SELECT 1 FROM folders WHERE client_id = p_client_id AND parent_id = v_building_root_id AND name = v_folder_name
    );
  END LOOP;

  RETURN v_building_root_id;
END;
$$;
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION create_building_folder_structure(uuid, uuid, uuid, text) TO anon, authenticated';
  END IF;
END $do$;

-- ── 5. get_empresa_folder_tree — incluir sort_order das novas pastas de edifício ──

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
      WHEN f.folder_type = 'edificio_root' THEN 22
      WHEN f.folder_type = 'edificio_fotos' THEN 23
      WHEN f.folder_type = 'edificio_plantas' THEN 24
      WHEN f.folder_type = 'edificio_documentos' THEN 25
      WHEN f.folder_type = 'cliente_outros' THEN 26
      WHEN f.folder_type = 'outros' THEN 99
      ELSE 50
    END AS sort_order
  FROM folders f
  WHERE f.empresa_id = p_empresa_id
  ORDER BY sort_order ASC, f.name ASC;
END;
$$;
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_empresa_folder_tree(uuid) TO anon, authenticated';
  END IF;
END $do$;

-- ── 6. Backfill: aplicar a nova pasta "Edifícios" e criar pastas para edifícios já existentes ──

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, empresa_id FROM clients WHERE empresa_id IS NOT NULL LOOP
    PERFORM create_client_folder_structure(r.id, r.empresa_id);
  END LOOP;

  FOR r IN
    SELECT b.id AS building_id, b.name AS building_name, b.client_id, c.empresa_id
    FROM buildings b
    JOIN clients c ON c.id = b.client_id
    WHERE c.empresa_id IS NOT NULL
  LOOP
    PERFORM create_building_folder_structure(r.building_id, r.client_id, r.empresa_id, r.building_name);
  END LOOP;
END;
$$;
