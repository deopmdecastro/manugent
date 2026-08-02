/*
# Empresas category + explicit collaborator↔empresa association helpers

1. Bug fix
- `folders` and `documents` were first created (20260802120000) without
  `empresa_id` / `client_id` / `folder_type` columns. A later migration
  (20260802195931) re-declared them with `CREATE TABLE IF NOT EXISTS`, which
  is a no-op against an already-existing table — so those columns were never
  actually added when migrations run in order. This migration retrofits them
  defensively with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

2. Schema changes
- `empresas` — add `category` column (prestador | cliente | parceiro), default 'prestador'
- `folders` — add empresa_id, client_id, folder_type (if missing)
- `documents` — add empresa_id, client_id (if missing)

3. RPC functions
- `set_user_empresa(uuid, uuid)` — associates a collaborator (user) to an empresa,
  validating that the collaborator's email domain matches the empresa's cooperative domain
  (when the empresa has a domain configured). Raises an exception otherwise so the API
  layer can surface a clear validation error instead of silently mismatching data.

4. Notes
- Written defensively (IF NOT EXISTS / OR REPLACE) so it is safe to run against a database
  that already has the empresas/users/folders/documents tables from earlier migrations,
  regardless of whether those earlier migrations ran the empresa_id/client_id retrofit.
*/

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'prestador';

ALTER TABLE empresas
  DROP CONSTRAINT IF EXISTS empresas_category_check;
ALTER TABLE empresas
  ADD CONSTRAINT empresas_category_check CHECK (category IN ('prestador', 'cliente', 'parceiro'));

CREATE INDEX IF NOT EXISTS users_empresa_idx ON users(empresa_id);

-- Retrofit folders/documents columns in case an earlier CREATE TABLE IF NOT EXISTS no-op'd
ALTER TABLE folders
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS folder_type text NOT NULL DEFAULT 'generic';
CREATE INDEX IF NOT EXISTS folders_empresa_idx ON folders(empresa_id);
CREATE INDEX IF NOT EXISTS folders_client_idx ON folders(client_id);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS documents_empresa_idx ON documents(empresa_id);
CREATE INDEX IF NOT EXISTS documents_client_idx ON documents(client_id);

CREATE OR REPLACE FUNCTION set_user_empresa(p_user_id uuid, p_empresa_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_domain text;
BEGIN
  SELECT email INTO v_user_email FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Colaborador % não encontrado', p_user_id;
  END IF;

  IF p_empresa_id IS NOT NULL THEN
    SELECT domain INTO v_domain FROM empresas WHERE id = p_empresa_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Empresa % não encontrada', p_empresa_id;
    END IF;
    IF v_domain IS NOT NULL AND v_domain <> '' AND v_user_email NOT ILIKE ('%@' || v_domain) THEN
      RAISE EXCEPTION 'O email do colaborador (%) não pertence ao domínio da empresa (@%)', v_user_email, v_domain;
    END IF;
  END IF;

  UPDATE users SET empresa_id = p_empresa_id WHERE id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION set_user_empresa(uuid, uuid) TO anon, authenticated;
