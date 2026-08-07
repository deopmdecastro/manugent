-- 20260806090000_approvals_and_chat.sql
-- Adiciona: fluxo de aprovação/início de Pedidos e Obras (maintenance_requests);
-- chat por escopo (Pedido/Obra ou Empresa), público ou privado.
--
-- Mirrors docker/postgres/init/020_approvals_and_chat.sql

-- ── 1. Aprovação de Pedidos/Obras ───────────────────────────────────────────
-- Regra: quando um cliente ou um técnico abre um pedido, um responsável
-- (admin/superadmin/gestor/supervisor) tem de aprovar antes de iniciar.
-- Exceção: se foi o próprio técnico a abrir o pedido, ele pode aprovar e
-- iniciar sem depender de terceiros.

ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pendente'
    CHECK (approval_status IN ('pendente', 'aprovado', 'rejeitado')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_note text,
  ADD COLUMN IF NOT EXISTS started_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

CREATE INDEX IF NOT EXISTS maintenance_requests_approval_idx ON maintenance_requests(approval_status);

-- ── 2. Chat por escopo (Pedido/Obra ou Empresa) ─────────────────────────────

CREATE TABLE IF NOT EXISTS chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL CHECK (scope_type IN ('maintenance_request', 'empresa')),
  scope_id uuid NOT NULL,
  name text,
  is_private boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Um único canal público por escopo (evita duplicados); podem existir vários
-- canais privados para o mesmo escopo (ex.: conversas fechadas a um subgrupo).
CREATE UNIQUE INDEX IF NOT EXISTS chat_channels_public_scope_unique
  ON chat_channels(scope_type, scope_id)
  WHERE is_private = false;

CREATE INDEX IF NOT EXISTS chat_channels_scope_idx ON chat_channels(scope_type, scope_id);

CREATE TABLE IF NOT EXISTS chat_channel_members (
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

-- user_name/user_role ficam desnormalizados na mensagem (em vez de um JOIN)
-- porque o adaptador Postgres standalone usado fora do Supabase não suporta
-- relational-select genérico para esta tabela — mantém a leitura simples e
-- preserva o nome de quem escreveu mesmo que o utilizador seja removido.
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  user_name text,
  user_role text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_channel_idx ON chat_messages(channel_id, created_at);

-- ── 3. RPC: aprovar/rejeitar/iniciar um Pedido/Obra com verificação de regra ─
-- p_actor_role / p_actor_is_requester são calculados no backend (Node) a
-- partir do JWT/registo do utilizador, para não duplicar a lógica de
-- permissões dentro do Postgres.

CREATE OR REPLACE FUNCTION approve_maintenance_request(
  p_request_id uuid,
  p_user_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  UPDATE maintenance_requests
  SET approval_status = 'aprovado',
      approved_by = p_user_id,
      approved_at = now(),
      approval_note = p_note,
      status = CASE WHEN status = 'aberto' THEN 'atribuido' ELSE status END
  WHERE id = p_request_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Pedido not found');
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (p_user_id, 'approved', 'maintenance_request', p_request_id::text, jsonb_build_object('note', p_note));

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION reject_maintenance_request(
  p_request_id uuid,
  p_user_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  UPDATE maintenance_requests
  SET approval_status = 'rejeitado',
      approved_by = p_user_id,
      approved_at = now(),
      approval_note = p_note,
      status = 'cancelado'
  WHERE id = p_request_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Pedido not found');
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (p_user_id, 'rejected', 'maintenance_request', p_request_id::text, jsonb_build_object('note', p_note));

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION start_maintenance_request(
  p_request_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  UPDATE maintenance_requests
  SET status = 'em_execucao',
      started_by = p_user_id,
      started_at = now()
  WHERE id = p_request_id AND approval_status = 'aprovado'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Pedido not found or not approved yet');
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (p_user_id, 'started', 'maintenance_request', p_request_id::text, '{}'::jsonb);

  RETURN to_jsonb(v_row);
END;
$$;

-- ── 4. Grants (condicional — standalone Docker não tem roles anon) ─────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION approve_maintenance_request(uuid, uuid, text) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION reject_maintenance_request(uuid, uuid, text) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION start_maintenance_request(uuid, uuid) TO anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT ON chat_channels TO anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, DELETE ON chat_channel_members TO anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT ON chat_messages TO anon, authenticated';
  END IF;
END $$;
