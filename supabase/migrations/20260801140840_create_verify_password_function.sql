/*
# Create verify_user_password RPC function

Creates a SECURITY DEFINER function that verifies user credentials.
This is used by the login endpoint to authenticate users.

1. New Functions
- `verify_user_password(p_email text, p_password text)` — returns user record (without password_hash) if credentials match, null otherwise

2. Security
- SECURITY DEFINER so it can read password_hash (which anon RLS allows anyway)
- Returns only safe columns (no password_hash in the result)
- Callable by anon role (needed for login before authentication)

3. Notes
- Uses crypt() with the stored password_hash for verification
- Returns null if user not found or password doesn't match (same error case)
*/

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
SET search_path = public
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