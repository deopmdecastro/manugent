-- Colaboradores/Técnicos: RPCs para servir a página "Colaboradores" da SPA
-- legada (public/app/index.html) a partir dos dados reais (users +
-- technician_profiles), em vez de localStorage.

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
           WHEN 'em_servico' THEN 'Em campo'
           WHEN 'ausente' THEN 'Indisponível'
           WHEN 'ferias' THEN 'Em férias'
           ELSE 'Disponível'
         END AS availability,
         tp.rating, tp.completed_orders, tp.active_orders,
         u.avatar_url, u.created_at
  FROM users u
  INNER JOIN technician_profiles tp ON tp.user_id = u.id
  LEFT JOIN teams t ON t.id = u.team_id
  LEFT JOIN empresas e ON e.id = u.empresa_id
  ORDER BY u.name;
END;
$$;

DROP FUNCTION IF EXISTS create_technician(text, text, text, text, text, text, uuid, uuid, text);

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
    WHEN 'Em campo' THEN 'em_servico'
    WHEN 'Indisponível' THEN 'ausente'
    WHEN 'Em férias' THEN 'ferias'
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

DROP FUNCTION IF EXISTS update_technician(uuid, text, text, text, text, text, text, uuid, uuid, text);

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
    WHEN 'Em campo' THEN 'em_servico'
    WHEN 'Indisponível' THEN 'ausente'
    WHEN 'Em férias' THEN 'ferias'
    ELSE 'disponivel'
  END;

  UPDATE users SET
    name = p_name, email = NULLIF(p_email, ''), role = COALESCE(NULLIF(p_role, ''), role),
    phone = NULLIF(p_phone, ''), empresa_id = p_empresa_id, team_id = p_team_id,
    avatar_url = COALESCE(NULLIF(p_avatar_url, ''), avatar_url)
  WHERE id = p_user_id;

  UPDATE technician_profiles SET
    specialties = ARRAY[COALESCE(NULLIF(p_specialty, ''), 'Geral')],
    status = v_status
  WHERE user_id = p_user_id;
END;
$$;
