-- Fix verify_user_password to also return empresa_id
DROP FUNCTION IF EXISTS verify_user_password(text, text);

CREATE OR REPLACE FUNCTION verify_user_password(p_email text, p_password text)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  team_id uuid,
  status text,
  status_reason text,
  empresa_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role, u.team_id, u.status, u.status_reason, u.empresa_id
  FROM users u
  WHERE lower(u.email) = lower(p_email)
    AND u.password_hash IS NOT NULL
    AND u.password_hash = crypt(p_password, u.password_hash)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_user_password(text, text) TO anon, authenticated;

-- Fix get_users_with_teams to include status + empresa
DROP FUNCTION IF EXISTS get_users_with_teams();

CREATE OR REPLACE FUNCTION get_users_with_teams()
RETURNS TABLE (
  id uuid,
  team_id uuid,
  name text,
  email text,
  role text,
  created_at timestamptz,
  team_name text,
  status text,
  status_reason text,
  status_updated_at timestamptz,
  empresa_id uuid,
  empresa_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.team_id, u.name, u.email, u.role, u.created_at,
         t.name AS team_name,
         u.status, u.status_reason, u.status_updated_at,
         u.empresa_id, e.name AS empresa_name
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  LEFT JOIN empresas e ON e.id = u.empresa_id
  ORDER BY u.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_users_with_teams() TO anon, authenticated;