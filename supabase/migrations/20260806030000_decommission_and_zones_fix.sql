/*
# Zonas técnicas e "dar baixa" (desativação) de edifícios e equipamentos

1. Correção de bug
   A coluna `buildings.zones` só existia no script de bootstrap do Docker
   local (docker/postgres/init/011_buildings_zones.sql) e nunca foi
   replicada para as migrations do Supabase. Em qualquer ambiente que não
   fosse o Docker local, a coluna não existia e os pedidos POST/PUT
   /api/buildings falhavam silenciosamente a gravar `zones` (o Supabase
   client ignora chaves inexistentes ou devolve erro consoante o modo).
   Esta migration replica a coluna em falta, tornando os dois ambientes
   consistentes.

2. Novo: "dar baixa" (desativação) de edifícios e equipamentos
   Passam a existir campos de estado + motivo + responsável, espelhando o
   padrão já usado em `incidents.resolution_notes` / `incidents.resolved_by`
   (ver 20260806010000_incident_resolution_fields.sql).

Aditivo (ADD COLUMN IF NOT EXISTS) — não quebra dados existentes.
*/

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS zones text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS decommission_reason text,
  ADD COLUMN IF NOT EXISTS decommissioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS decommissioned_by uuid REFERENCES users(id);

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS decommission_reason text,
  ADD COLUMN IF NOT EXISTS decommissioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS decommissioned_by uuid REFERENCES users(id);
