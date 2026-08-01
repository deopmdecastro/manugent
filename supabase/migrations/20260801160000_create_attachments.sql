/*
# Create attachments table

Tabela de anexos para OTs, equipamentos, instalações e clientes.
Elimina a necessidade de modais de criação de pasta — os ficheiros são
associados automaticamente à entidade que está a ser visualizada.

1. New Tables
- `attachments` — metadados de ficheiros (o ficheiro em si é guardado em disco)

2. Indexes
- `(entity_type, entity_id)` — consulta eficiente por entidade

3. RPC
- `get_attachments(p_entity_type, p_entity_id)` — lista anexos com nome do utilizador
*/

CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('work_order', 'equipment', 'client', 'installation')),
  entity_id uuid NOT NULL,
  filename text NOT NULL,
  original_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  file_size bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on attachments" ON attachments
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS attachments_entity_idx
  ON attachments (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS attachments_created_at_idx
  ON attachments (created_at DESC);

-- RPC para listar anexos com nome do uploader
CREATE OR REPLACE FUNCTION get_attachments(p_entity_type text, p_entity_id uuid)
RETURNS TABLE (
  id uuid,
  entity_type text,
  entity_id uuid,
  filename text,
  original_name text,
  mime_type text,
  file_size bigint,
  storage_path text,
  uploaded_by uuid,
  uploader_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id, a.entity_type, a.entity_id,
    a.filename, a.original_name, a.mime_type, a.file_size,
    a.storage_path, a.uploaded_by,
    u.name AS uploader_name,
    a.created_at
  FROM attachments a
  LEFT JOIN users u ON u.id = a.uploaded_by
  WHERE a.entity_type = p_entity_type
    AND a.entity_id = p_entity_id
  ORDER BY a.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_attachments(text, uuid) TO anon, authenticated;
