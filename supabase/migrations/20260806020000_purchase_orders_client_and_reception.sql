/*
# Compras: associação a cliente/empresa e receção de material

Aplica à tabela `purchase_orders` a mesma lógica já usada em `incidents`:
associação a cliente (e, por extensão, à empresa via `clients.empresa_id`),
edifício e OT de origem, mais os campos necessários para o fluxo de
"marcar como recebido" (equivalente ao "marcar como resolvido" dos
incidentes).

1. Novas colunas
   - `purchase_orders.client_id` (uuid, FK clients) — cliente/projeto a que a compra se destina (opcional)
   - `purchase_orders.building_id` (uuid, FK buildings) — edifício de destino (opcional)
   - `purchase_orders.work_order_id` (uuid, FK work_orders) — OT de origem (opcional)
   - `purchase_orders.item_description` (text) — descrição livre do item, para pedidos sem correspondência exata na tabela `parts`
   - `purchase_orders.quantity` (integer) — quantidade do pedido (fluxo simplificado, sem depender de `purchase_order_items`)
   - `purchase_orders.received_notes` (text) — notas de receção preenchidas ao marcar como recebido
   - `purchase_orders.received_by` (uuid, FK users) — colaborador que confirmou a receção
   - `purchase_orders.received_at` (timestamptz) — data de receção

2. `supplier_id` passa a ser opcional, para permitir pedidos rápidos sem
   fornecedor homologado pré-registado (mantém-se a FK quando preenchido).

Aditivo — não quebra dados existentes.
*/

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id),
  ADD COLUMN IF NOT EXISTS building_id uuid REFERENCES buildings(id),
  ADD COLUMN IF NOT EXISTS work_order_id uuid REFERENCES work_orders(id),
  ADD COLUMN IF NOT EXISTS item_description text,
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS received_notes text,
  ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS received_at timestamptz;

ALTER TABLE purchase_orders ALTER COLUMN supplier_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS purchase_orders_client_idx ON purchase_orders(client_id);
