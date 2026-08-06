-- 019_operational_improvements.sql
-- Adiciona: NFC/QR/código de barras em equipamentos, OTs e pedidos;
-- lista de motivos de pausa reutilizável (OT / pedido / obra);
-- histórico unificado (inclui leituras NFC/QR/código de barras).
--
-- Mirrors supabase/migrations/20260806060000_operational_improvements.sql

-- ── 1. NFC / QR / código de barras ──────────────────────────────────────────

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS nfc_tag text,
  ADD COLUMN IF NOT EXISTS qr_code text,
  ADD COLUMN IF NOT EXISTS barcode text;

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS nfc_tag text,
  ADD COLUMN IF NOT EXISTS qr_code text,
  ADD COLUMN IF NOT EXISTS barcode text;

ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS nfc_tag text,
  ADD COLUMN IF NOT EXISTS qr_code text,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS pause_reason_id uuid,
  ADD COLUMN IF NOT EXISTS pause_note text,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz;

CREATE INDEX IF NOT EXISTS equipment_barcode_idx ON equipment(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS work_orders_barcode_idx ON work_orders(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS maintenance_requests_barcode_idx ON maintenance_requests(barcode) WHERE barcode IS NOT NULL;

-- Permite o novo estado "pausado" nos pedidos de manutenção ("Obras/Pedidos")
ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_status_check;
ALTER TABLE maintenance_requests ADD CONSTRAINT maintenance_requests_status_check
  CHECK (status IN ('aberto', 'em_analise', 'atribuido', 'em_execucao', 'pausado', 'concluido', 'cancelado'));

-- ── 2. Motivos de pausa (partilhados entre OT, Pedido e Obra) ───────────────

CREATE TABLE IF NOT EXISTS pause_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  applies_to text[] NOT NULL DEFAULT ARRAY['work_order', 'maintenance_request'],
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO pause_reasons (label, sort_order) VALUES
  ('Aguarda material', 1),
  ('Aguarda decisão superior', 2),
  ('Aguarda cliente', 3),
  ('Aguarda acesso ao local', 4),
  ('Aguarda segurança/autorização', 5),
  ('Fim de turno', 6),
  ('Avaria de equipamento auxiliar', 7),
  ('Condições climatéricas', 8),
  ('Outro', 99)
ON CONFLICT (label) DO NOTHING;

ALTER TABLE work_order_time_entries
  ADD COLUMN IF NOT EXISTS pause_reason_id uuid REFERENCES pause_reasons(id),
  ADD COLUMN IF NOT EXISTS pause_note text;

-- ── 3. Histórico: activity_log com metadata (código lido, método, etc.) ────

ALTER TABLE activity_log
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── 4. RPC: log_entity_scan — regista leitura de NFC / QR / código de barras ─

CREATE OR REPLACE FUNCTION log_entity_scan(
  p_entity_type text,
  p_entity_id text,
  p_method text,
  p_code text,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  IF p_method NOT IN ('nfc', 'qr', 'barcode') THEN
    RETURN jsonb_build_object('error', 'method deve ser nfc, qr ou barcode');
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_method || '_scan', p_entity_type, p_entity_id, jsonb_build_object('code', p_code, 'method', p_method))
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

-- ── 5. RPC: get_entity_history — histórico unificado (OT / Pedido) ─────────
-- Combina activity_log (inclui leituras NFC/QR/código de barras, pausas,
-- mudanças de estado) com os registos de tempo da OT.

CREATE OR REPLACE FUNCTION get_entity_history(p_entity_type text, p_entity_id text)
RETURNS TABLE (
  event_type text,
  label text,
  detail text,
  user_id uuid,
  user_name text,
  created_at timestamptz,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.action AS event_type,
    CASE al.action
      WHEN 'nfc_scan' THEN 'Tag NFC picada'
      WHEN 'qr_scan' THEN 'QR Code lido'
      WHEN 'barcode_scan' THEN 'Código de barras lido'
      WHEN 'paused' THEN 'Pausado'
      WHEN 'resumed' THEN 'Retomado'
      ELSE al.action
    END AS label,
    COALESCE(al.metadata->>'code', al.metadata->>'note', '') AS detail,
    al.user_id, u.name AS user_name, al.created_at, al.metadata
  FROM activity_log al
  LEFT JOIN users u ON u.id = al.user_id
  WHERE al.entity_type = p_entity_type AND al.entity_id = p_entity_id

  UNION ALL

  SELECT
    'time_' || wte.status AS event_type,
    CASE wte.status
      WHEN 'joined' THEN 'Técnico juntou-se'
      WHEN 'running' THEN 'Tempo em curso'
      WHEN 'paused' THEN 'Tempo pausado'
      WHEN 'finished' THEN 'Técnico saiu'
      ELSE wte.status
    END AS label,
    COALESCE(pr.label, wte.pause_note, '') AS detail,
    wte.technician_id AS user_id, u2.name AS user_name, wte.updated_at AS created_at,
    jsonb_build_object('pauseReasonId', wte.pause_reason_id, 'pauseNote', wte.pause_note)
  FROM work_order_time_entries wte
  LEFT JOIN users u2 ON u2.id = wte.technician_id
  LEFT JOIN pause_reasons pr ON pr.id = wte.pause_reason_id
  WHERE p_entity_type = 'work_order' AND wte.work_order_id::text = p_entity_id

  ORDER BY created_at DESC;
END;
$$;

-- ── 6. RPC: pausar/retomar OT com motivo ────────────────────────────────────

CREATE OR REPLACE FUNCTION pause_work_order_time_entry(
  p_work_order_id uuid,
  p_technician_id uuid,
  p_reason_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
BEGIN
  UPDATE work_order_time_entries
  SET
    effective_seconds = effective_seconds + CASE
      WHEN status = 'running' THEN GREATEST(0, EXTRACT(epoch FROM (now() - COALESCE(resumed_at, started_at)))::integer)
      ELSE 0
    END,
    status = 'paused',
    paused_at = now(),
    pause_reason_id = p_reason_id,
    pause_note = p_note,
    updated_at = now()
  WHERE work_order_id = p_work_order_id
    AND technician_id = p_technician_id
    AND status IN ('joined', 'running', 'paused')
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Active time entry not found');
  END IF;

  UPDATE work_orders SET status = 'paused', updated_at = now() WHERE id = p_work_order_id;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (p_technician_id, 'paused', 'work_order', p_work_order_id::text, jsonb_build_object('reasonId', p_reason_id, 'note', p_note));

  RETURN to_jsonb(v_result);
END;
$$;

-- ── 7. RPC: pausar/retomar Pedido de manutenção com motivo ─────────────────

CREATE OR REPLACE FUNCTION pause_maintenance_request(
  p_request_id uuid,
  p_reason_id uuid,
  p_note text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
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
  SET status = 'pausado', pause_reason_id = p_reason_id, pause_note = p_note, paused_at = now()
  WHERE id = p_request_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Pedido not found');
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (p_user_id, 'paused', 'maintenance_request', p_request_id::text, jsonb_build_object('reasonId', p_reason_id, 'note', p_note));

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION resume_maintenance_request(p_request_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  UPDATE maintenance_requests
  SET status = 'em_execucao', pause_reason_id = NULL, pause_note = NULL
  WHERE id = p_request_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Pedido not found');
  END IF;

  INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (p_user_id, 'resumed', 'maintenance_request', p_request_id::text, '{}'::jsonb);

  RETURN to_jsonb(v_row);
END;
$$;

-- ── 8. Grants (condicional — standalone Docker não tem roles anon) ─────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION log_entity_scan(text, text, text, text, uuid) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_entity_history(text, text) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION pause_work_order_time_entry(uuid, uuid, uuid, text) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION pause_maintenance_request(uuid, uuid, text, uuid) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION resume_maintenance_request(uuid, uuid) TO anon, authenticated';
    EXECUTE 'GRANT SELECT ON pause_reasons TO anon, authenticated';
  END IF;
END $$;
