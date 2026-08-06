/*
# Material: associação a cliente/empresa e "dar baixa"

1. Correção de bug
   O material de stock (`parts`) nunca tinha endpoints POST/PUT/DELETE no
   backend. A UI criava/editava material apenas em memória (`APP.stockMaterials`)
   e, pior, o carregamento inicial SUBSTITUÍA por completo esse array pelos
   dados vindos de `GET /api/parts` — qualquer material criado pela UI
   desaparecia ao recarregar a página. Esta migration prepara as colunas
   necessárias para o material passar a ser persistido a sério.

2. Novo: associação a cliente (a empresa deriva do cliente, tal como já
   acontece em `incidents` e `purchase_orders`) e campos de "dar baixa"
   (estado, motivo, data, responsável), espelhando o padrão usado em
   `incidents.resolution_notes` / `buildings.decommission_reason`.

3. Novo: `stock` e `min_stock` diretamente em `parts`, para simplificar —
   até agora só existiam em `inventory_items`, que não tinha endpoints de
   escrita nenhuns.

Aditivo (ADD COLUMN IF NOT EXISTS) — não quebra dados existentes.
*/

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
