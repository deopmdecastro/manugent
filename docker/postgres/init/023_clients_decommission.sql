-- Espelha supabase/migrations/20260807030000_clients_decommission.sql
-- "Dar baixa" (desativação) de clientes.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS decommission_reason text,
  ADD COLUMN IF NOT EXISTS decommissioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS decommissioned_by uuid REFERENCES users(id);
