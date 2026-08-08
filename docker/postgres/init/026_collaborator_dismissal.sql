-- 026_collaborator_dismissal.sql
-- Demissão de colaboradores: bane automaticamente as credenciais
-- (reutiliza users.status = 'banned', já bloqueado em verify_user_password)
-- e regista um histórico de demissões consultável (get_dismissals).
--
-- Mirrors supabase/migrations/20260808020000_collaborator_dismissal.sql

-- ── Schema: histórico de demissões ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  user_email text,
  user_role text,
  empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  empresa_name text,
  reason text,
  dismissed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  dismissed_by_name text,
  dismissed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dismissals_empresa ON dismissals(empresa_id);
CREATE INDEX IF NOT EXISTS idx_dismissals_dismissed_at ON dismissals(dismissed_at DESC);

-- ── RPC: dismiss_collaborator ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION dismiss_collaborator(
  p_actor_id uuid,
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  user_role text,
  empresa_id uuid,
  empresa_name text,
  reason text,
  dismissed_by uuid,
  dismissed_by_name text,
  dismissed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_actor_name text;
  v_dismissal_id uuid;
BEGIN
  IF p_actor_id = p_user_id THEN
    RAISE EXCEPTION 'Não pode demitir-se a si próprio.';
  END IF;

  SELECT u.id, u.name, u.email, u.role, u.empresa_id, e.name AS empresa_name
  INTO v_user
  FROM users u
  LEFT JOIN empresas e ON e.id = u.empresa_id
  WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Colaborador não encontrado.';
  END IF;

  IF v_user.role = 'superadmin' THEN
    RAISE EXCEPTION 'Não é possível demitir uma conta de SuperAdmin.';
  END IF;

  SELECT name INTO v_actor_name FROM users WHERE id = p_actor_id;

  UPDATE users
  SET status = 'banned',
      status_reason = COALESCE(NULLIF(p_reason, ''), 'Colaborador demitido'),
      status_updated_at = now(),
      status_updated_by = p_actor_id
  WHERE users.id = p_user_id;

  INSERT INTO dismissals (
    user_id, user_name, user_email, user_role,
    empresa_id, empresa_name, reason, dismissed_by, dismissed_by_name
  ) VALUES (
    v_user.id, v_user.name, v_user.email, v_user.role,
    v_user.empresa_id, v_user.empresa_name, NULLIF(p_reason, ''),
    p_actor_id, v_actor_name
  )
  RETURNING dismissals.id INTO v_dismissal_id;

  RETURN QUERY
  SELECT d.id, d.user_id, d.user_name, d.user_email, d.user_role,
         d.empresa_id, d.empresa_name, d.reason,
         d.dismissed_by, d.dismissed_by_name, d.dismissed_at
  FROM dismissals d
  WHERE d.id = v_dismissal_id;
END;
$$;

-- ── RPC: get_dismissals ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_dismissals(p_empresa_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  user_role text,
  empresa_id uuid,
  empresa_name text,
  reason text,
  dismissed_by uuid,
  dismissed_by_name text,
  dismissed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.user_id, d.user_name, d.user_email, d.user_role,
         d.empresa_id, d.empresa_name, d.reason,
         d.dismissed_by, d.dismissed_by_name, d.dismissed_at
  FROM dismissals d
  WHERE p_empresa_id IS NULL OR d.empresa_id = p_empresa_id
  ORDER BY d.dismissed_at DESC;
END;
$$;

-- ── get_technicians(): deixa de listar colaboradores demitidos ─────────────

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
  WHERE u.status IS DISTINCT FROM 'banned'
  ORDER BY u.name;
END;
$$;

-- Grants (condicional — standalone Docker não tem roles anon/authenticated)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION dismiss_collaborator(uuid, uuid, text) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_dismissals(uuid) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_technicians() TO anon, authenticated';
  END IF;
END $$;
