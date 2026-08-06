-- Espelha supabase/migrations/20260806040000_materials_client_and_decommission.sql

ALTER TABLE parts
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id),
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS decommission_reason text,
  ADD COLUMN IF NOT EXISTS decommissioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS decommissioned_by uuid REFERENCES users(id);

CREATE INDEX IF NOT EXISTS parts_client_idx ON parts(client_id);
