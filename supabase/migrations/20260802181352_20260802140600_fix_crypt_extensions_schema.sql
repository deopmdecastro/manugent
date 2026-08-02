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
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role, u.team_id, u.status, u.status_reason, u.empresa_id
  FROM public.users u
  WHERE lower(u.email) = lower(p_email)
    AND u.password_hash IS NOT NULL
    AND u.password_hash = crypt(p_password, u.password_hash)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_user_password(text, text) TO anon, authenticated;