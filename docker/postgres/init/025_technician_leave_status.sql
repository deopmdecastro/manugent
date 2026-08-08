-- 025_technician_leave_status.sql
-- Estende technician_profiles com estados de ausência mais granulares
-- (folga, doença, além de férias/ausente já existentes) e um par de campos
-- para mostrar contexto na vista "Equipa do dia" do Calendário: motivo
-- (ex. "Formação externa", "Atestado médico", "Dia de folga") e data de
-- regresso prevista (para férias).
--
-- Mirrors supabase/migrations/20260808010000_technician_leave_status.sql

ALTER TABLE technician_profiles DROP CONSTRAINT IF EXISTS technician_profiles_status_check;
ALTER TABLE technician_profiles ADD CONSTRAINT technician_profiles_status_check
  CHECK (status IN ('disponivel', 'em_servico', 'ausente', 'ferias', 'folga', 'doenca'));

ALTER TABLE technician_profiles
  ADD COLUMN IF NOT EXISTS status_note text,
  ADD COLUMN IF NOT EXISTS status_until date;

-- ── create_technician / update_technician: reconhecer os novos rótulos ─────

CREATE OR REPLACE FUNCTION create_technician(
  p_name text, p_email text, p_role text, p_phone text,
  p_specialty text, p_availability text, p_empresa_id uuid,
  p_team_id uuid, p_avatar_url text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_user_id uuid;
BEGIN
  v_status := CASE p_availability
    WHEN 'Disponível' THEN 'disponivel'
    WHEN 'A trabalhar' THEN 'em_servico'
    WHEN 'Em campo' THEN 'em_servico'
    WHEN 'Indisponível' THEN 'ausente'
    WHEN 'Férias' THEN 'ferias'
    WHEN 'Em férias' THEN 'ferias'
    WHEN 'Folga' THEN 'folga'
    WHEN 'Doença' THEN 'doenca'
    ELSE 'disponivel'
  END;

  INSERT INTO users (name, email, role, phone, empresa_id, team_id, avatar_url, password_hash)
  VALUES (p_name, NULLIF(p_email, ''), COALESCE(NULLIF(p_role, ''), 'tecnico'), NULLIF(p_phone, ''),
          p_empresa_id, p_team_id, NULLIF(p_avatar_url, ''), crypt('Demo@2026', gen_salt('bf', 10)))
  RETURNING id INTO v_user_id;

  INSERT INTO technician_profiles (user_id, specialties, status)
  VALUES (v_user_id, ARRAY[COALESCE(NULLIF(p_specialty, ''), 'Geral')], v_status);

  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_technician(
  p_user_id uuid, p_name text, p_email text, p_role text, p_phone text,
  p_specialty text, p_availability text, p_empresa_id uuid,
  p_team_id uuid, p_avatar_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  v_status := CASE p_availability
    WHEN 'Disponível' THEN 'disponivel'
    WHEN 'A trabalhar' THEN 'em_servico'
    WHEN 'Em campo' THEN 'em_servico'
    WHEN 'Indisponível' THEN 'ausente'
    WHEN 'Férias' THEN 'ferias'
    WHEN 'Em férias' THEN 'ferias'
    WHEN 'Folga' THEN 'folga'
    WHEN 'Doença' THEN 'doenca'
    ELSE 'disponivel'
  END;

  UPDATE users SET
    name = p_name, email = NULLIF(p_email, ''), role = COALESCE(NULLIF(p_role, ''), role),
    phone = NULLIF(p_phone, ''), empresa_id = p_empresa_id, team_id = p_team_id,
    avatar_url = COALESCE(NULLIF(p_avatar_url, ''), avatar_url)
  WHERE id = p_user_id;

  UPDATE technician_profiles SET
    specialties = ARRAY[COALESCE(NULLIF(p_specialty, ''), 'Geral')],
    status = v_status,
    status_note = CASE WHEN v_status NOT IN ('ausente','folga','doenca') THEN NULL ELSE status_note END,
    status_until = CASE WHEN v_status != 'ferias' THEN NULL ELSE status_until END
  WHERE user_id = p_user_id;
END;
$$;

-- ── get_technicians(): devolver também motivo/data de regresso ─────────────

DROP FUNCTION IF EXISTS get_technicians();

CREATE OR REPLACE FUNCTION get_technicians()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  phone text,
  team_id uuid,
  team_name text,
  empresa_id uuid,
  empresa_name text,
  specialty text,
  availability text,
  status_note text,
  status_until date,
  rating numeric,
  completed_orders integer,
  active_orders integer,
  avatar_url text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role, u.phone,
         u.team_id, t.name AS team_name,
         u.empresa_id, e.name AS empresa_name,
         COALESCE(tp.specialties[1], 'Geral') AS specialty,
         CASE tp.status
           WHEN 'disponivel' THEN 'Disponível'
           WHEN 'em_servico' THEN 'A trabalhar'
           WHEN 'ausente' THEN 'Indisponível'
           WHEN 'ferias' THEN 'Férias'
           WHEN 'folga' THEN 'Folga'
           WHEN 'doenca' THEN 'Doença'
           ELSE 'Disponível'
         END AS availability,
         tp.status_note, tp.status_until,
         tp.rating, tp.completed_orders, tp.active_orders,
         u.avatar_url, u.created_at
  FROM users u
  INNER JOIN technician_profiles tp ON tp.user_id = u.id
  LEFT JOIN teams t ON t.id = u.team_id
  LEFT JOIN empresas e ON e.id = u.empresa_id
  ORDER BY u.name;
END;
$$;

-- ── Seeds: distribuir alguns colaboradores existentes pelos novos estados ──
-- Idempotente: só atualiza se ainda estiverem no estado por omissão
-- ('disponivel') para não sobrepor escolhas manuais já feitas em produção.

DO $$
DECLARE
  v_ids uuid[];
BEGIN
  SELECT array_agg(user_id ORDER BY user_id) INTO v_ids
  FROM technician_profiles
  WHERE status = 'disponivel';

  IF v_ids IS NOT NULL AND array_length(v_ids, 1) >= 1 THEN
    UPDATE technician_profiles SET status = 'ferias', status_note = NULL, status_until = CURRENT_DATE + INTERVAL '10 days'
    WHERE user_id = v_ids[1];
  END IF;
  IF v_ids IS NOT NULL AND array_length(v_ids, 1) >= 2 THEN
    UPDATE technician_profiles SET status = 'ausente', status_note = 'Formação externa', status_until = NULL
    WHERE user_id = v_ids[2];
  END IF;
  IF v_ids IS NOT NULL AND array_length(v_ids, 1) >= 3 THEN
    UPDATE technician_profiles SET status = 'folga', status_note = 'Dia de folga', status_until = NULL
    WHERE user_id = v_ids[3];
  END IF;
  IF v_ids IS NOT NULL AND array_length(v_ids, 1) >= 4 THEN
    UPDATE technician_profiles SET status = 'doenca', status_note = 'Atestado médico', status_until = NULL
    WHERE user_id = v_ids[4];
  END IF;
END $$;
