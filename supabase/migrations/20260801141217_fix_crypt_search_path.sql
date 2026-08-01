/*
# Fix verify_user_password function

The pgcrypto extension was created but crypt() wasn't found in the function's
search_path. This migration recreates the function with an explicit search_path
that includes public (where pgcrypto is installed).
*/

-- Drop and recreate with proper search_path
DROP FUNCTION IF EXISTS verify_user_password(text, text);

CREATE OR REPLACE FUNCTION verify_user_password(p_email text, p_password text)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  team_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgcrypto
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role, u.team_id
  FROM users u
  WHERE lower(u.email) = lower(p_email)
    AND u.password_hash IS NOT NULL
    AND u.password_hash = crypt(p_password, u.password_hash)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_user_password(text, text) TO anon, authenticated;

-- Also fix the other SECURITY DEFINER functions to include pgcrypto in search_path
DROP FUNCTION IF EXISTS create_work_order_findings(uuid, jsonb, uuid);
CREATE OR REPLACE FUNCTION create_work_order_findings(
  p_work_order_id uuid,
  p_findings jsonb,
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgcrypto
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