-- Espelha supabase/migrations/20260806030000_decommission_and_zones_fix.sql
-- Campos de "dar baixa" (desativação) de edifícios e equipamentos.

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS decommission_reason text,
  ADD COLUMN IF NOT EXISTS decommissioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS decommissioned_by uuid REFERENCES users(id);

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS decommission_reason text,
  ADD COLUMN IF NOT EXISTS decommissioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS decommissioned_by uuid REFERENCES users(id);
