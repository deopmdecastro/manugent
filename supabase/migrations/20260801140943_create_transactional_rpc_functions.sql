/*
# Create RPC functions for findings and time tracking

These functions handle complex transactional logic that can't be done
via the Supabase JS query builder.

1. New Functions
- `create_work_order_findings(p_work_order_id uuid, p_findings jsonb, p_created_by uuid)` — creates findings and auto-generates corrective requests
- `upsert_time_entry(p_work_order_id uuid, p_technician_id uuid, p_status text)` — join/start time tracking
- `update_time_entry(p_work_order_id uuid, p_technician_id uuid, p_action text)` — pause/resume/exit time tracking

2. Security
- All SECURITY DEFINER, callable by anon, authenticated
*/

-- Create work order findings with auto-corrective-request logic
CREATE OR REPLACE FUNCTION create_work_order_findings(
  p_work_order_id uuid,
  p_findings jsonb,
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_work_order RECORD;
  v_finding RECORD;
  v_created_findings jsonb := '[]'::jsonb;
  v_should_create_request boolean := false;
  v_intervention_request RECORD;
  v_measurement_out_of_limits boolean;
  v_inserted RECORD;
BEGIN
  SELECT * INTO v_work_order FROM work_orders WHERE id = p_work_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Work order not found');
  END IF;

  FOR v_finding IN SELECT * FROM jsonb_array_elements(p_findings)
  LOOP
    v_measurement_out_of_limits := false;
    IF (v_finding->>'measurementValue') IS NOT NULL THEN
      IF (v_finding->>'limitMin') IS NOT NULL AND (v_finding->>'measurementValue')::numeric < (v_finding->>'limitMin')::numeric THEN
        v_measurement_out_of_limits := true;
      END IF;
      IF (v_finding->>'limitMax') IS NOT NULL AND (v_finding->>'measurementValue')::numeric > (v_finding->>'limitMax')::numeric THEN
        v_measurement_out_of_limits := true;
      END IF;
    END IF;

    IF v_finding->>'type' IN ('nok', 'defect', 'measurement_out_of_limits', 'failure') OR v_measurement_out_of_limits THEN
      v_should_create_request := true;
    END IF;

    INSERT INTO work_order_findings (
      work_order_id, type, description, measurement_value, limit_min, limit_max, created_by
    )
    VALUES (
      p_work_order_id,
      CASE WHEN v_measurement_out_of_limits THEN 'measurement_out_of_limits' ELSE v_finding->>'type' END,
      v_finding->>'description',
      NULLIF(v_finding->>'measurementValue', '')::numeric,
      NULLIF(v_finding->>'limitMin', '')::numeric,
      NULLIF(v_finding->>'limitMax', '')::numeric,
      p_created_by
    )
    RETURNING * INTO v_inserted;

    v_created_findings := v_created_findings || jsonb_build_object(v_inserted);
  END LOOP;

  IF v_work_order.origin = 'scheduled' AND v_should_create_request THEN
    INSERT INTO work_orders (
      parent_work_order_id, client_id, equipment_id, team_id, supervisor_id,
      type, origin, status, priority, title, description
    )
    VALUES (
      v_work_order.id, v_work_order.client_id, v_work_order.equipment_id,
      v_work_order.team_id, v_work_order.supervisor_id,
      'corrective', 'request', 'open', 'high',
      'Pedido de intervencao - ' || v_work_order.title,
      'Criado automaticamente por resultado NOK, defeito, medicao fora dos limites ou falha identificada.'
    )
    RETURNING * INTO v_intervention_request;

    INSERT INTO work_order_links (source_work_order_id, target_work_order_id, reason)
    VALUES (v_work_order.id, v_intervention_request.id, 'scheduled_finding')
    ON CONFLICT DO NOTHING;

    INSERT INTO notifications (work_order_id, recipient_user_id, recipient_team_id, recipient_role, title, message)
    VALUES
      (v_intervention_request.id, v_work_order.supervisor_id, NULL, 'supervisor', 'Pedido de intervencao criado',
       'Criado automaticamente a partir da OT agendada ' || v_work_order.title || '.'),
      (v_intervention_request.id, NULL, v_work_order.team_id, 'team', 'Pedido de intervencao criado',
       'Criado automaticamente a partir da OT agendada ' || v_work_order.title || '.');

    RETURN jsonb_build_object(
      'findings', v_created_findings,
      'interventionRequest', to_jsonb(v_intervention_request)
    );
  END IF;

  RETURN jsonb_build_object('findings', v_created_findings, 'interventionRequest', NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION create_work_order_findings(uuid, jsonb, uuid) TO anon, authenticated;

-- Upsert time entry (join or start)
CREATE OR REPLACE FUNCTION upsert_time_entry(
  p_work_order_id uuid,
  p_technician_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
BEGIN
  INSERT INTO work_order_time_entries (work_order_id, technician_id, status, started_at)
  VALUES (
    p_work_order_id, p_technician_id, p_status,
    CASE WHEN p_status = 'running' THEN now() ELSE NULL END
  )
  ON CONFLICT (work_order_id, technician_id)
  WHERE status IN ('joined', 'running', 'paused')
  DO UPDATE SET
    status = EXCLUDED.status,
    started_at = COALESCE(work_order_time_entries.started_at, CASE WHEN EXCLUDED.status = 'running' THEN now() ELSE NULL END),
    resumed_at = CASE WHEN EXCLUDED.status = 'running' THEN now() ELSE work_order_time_entries.resumed_at END,
    updated_at = now()
  RETURNING * INTO v_result;

  IF p_status = 'running' THEN
    UPDATE work_orders
    SET status = 'in_progress', started_at = COALESCE(started_at, now()), updated_at = now()
    WHERE id = p_work_order_id;
  END IF;

  RETURN to_jsonb(v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_time_entry(uuid, uuid, text) TO anon, authenticated;

-- Update time entry (pause, resume, or exit)
CREATE OR REPLACE FUNCTION update_time_entry(
  p_work_order_id uuid,
  p_technician_id uuid,
  p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_result RECORD;
BEGIN
  v_status := CASE WHEN p_action = 'pause' THEN 'paused'
                   WHEN p_action = 'resume' THEN 'running'
                   WHEN p_action = 'exit' THEN 'finished'
                   ELSE p_action END;

  UPDATE work_order_time_entries
  SET
    effective_seconds = effective_seconds + CASE
      WHEN status = 'running' AND v_status IN ('paused', 'finished')
      THEN GREATEST(0, EXTRACT(epoch FROM (now() - COALESCE(resumed_at, started_at)))::integer)
      ELSE 0
    END,
    status = v_status,
    paused_at = CASE WHEN v_status = 'paused' THEN now() ELSE paused_at END,
    resumed_at = CASE WHEN v_status = 'running' THEN now() WHEN v_status = 'finished' THEN NULL ELSE resumed_at END,
    ended_at = CASE WHEN v_status = 'finished' THEN now() ELSE ended_at END,
    updated_at = now()
  WHERE work_order_id = p_work_order_id
    AND technician_id = p_technician_id
    AND status IN ('joined', 'running', 'paused')
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Active time entry not found');
  END IF;

  IF p_action = 'pause' THEN
    UPDATE work_orders SET status = 'paused', updated_at = now() WHERE id = p_work_order_id;
  END IF;

  RETURN to_jsonb(v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION update_time_entry(uuid, uuid, text) TO anon, authenticated;