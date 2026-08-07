/*
# Cliente: "dar baixa" (desativação)

Espelha o padrão já usado em `buildings.decommission_reason` /
`equipment.decommission_reason` / `parts.decommission_reason`
(ver 20260806030000_decommission_and_zones_fix.sql e
20260806040000_materials_client_and_decommission.sql), agora aplicado a
`clients`. Passa a ser possível dar baixa a um cliente sem apagar o
registo nem os edifícios/equipamentos associados — o histórico
mantém-se, o cliente fica apenas marcado como inativo.

Aditivo (ADD COLUMN IF NOT EXISTS) — não quebra dados existentes.
*/

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS decommission_reason text,
  ADD COLUMN IF NOT EXISTS decommissioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS decommissioned_by uuid REFERENCES users(id);
