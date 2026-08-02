-- 008_db_seeds_relations_improvements.sql
-- Extensões do schema necessárias ao seed (scripts/seed-demo-data.mjs) e à API.
--
-- Espelha (adaptado ao Postgres standalone, sem RLS/roles anon/authenticated):
--   supabase/migrations/20260802130000_db_seeds_relations_improvements.sql

-- ── 1. Colaboradores (users) ────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- ── 2. Pisos e Áreas ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  level integer NOT NULL DEFAULT 0,
  area_m2 numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS floors_building_idx ON floors(building_id);

CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id uuid NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'geral' CHECK (type IN ('geral', 'tecnica', 'escritorio', 'armazem', 'publica', 'exterior')),
  area_m2 numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS areas_floor_idx ON areas(floor_id);

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS floor_id uuid REFERENCES floors(id),
  ADD COLUMN IF NOT EXISTS area_id uuid REFERENCES areas(id);

-- ── 3. Colaboradores associados a edifícios ─────────────────────────────

CREATE TABLE IF NOT EXISTS building_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id),
  role text NOT NULL CHECK (role IN ('responsavel', 'gestor', 'supervisor', 'equipa_manutencao', 'administrativo')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (building_id, user_id, role)
);
CREATE INDEX IF NOT EXISTS building_assignments_building_idx ON building_assignments(building_id);
CREATE INDEX IF NOT EXISTS building_assignments_user_idx ON building_assignments(user_id);

-- ── 4. Incidentes ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES equipment(id),
  type text NOT NULL CHECK (type IN (
    'falha_eletrica', 'inundacao', 'incendio', 'elevador_avariado', 'avac_indisponivel',
    'fuga_agua', 'intrusao', 'alarme_ativo', 'falha_comunicacao', 'equipamento_critico_parado'
  )),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_analise', 'em_resolucao', 'resolvido', 'fechado')),
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  reported_by uuid REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  work_order_id uuid REFERENCES work_orders(id),
  photos jsonb NOT NULL DEFAULT '[]',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS incidents_building_idx ON incidents(building_id);
CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents(status);

CREATE TABLE IF NOT EXISTS incident_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS incident_comments_incident_idx ON incident_comments(incident_id);

-- ── 5. Base de Conhecimento ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES knowledge_categories(id),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN (
    'procedimento', 'manual', 'guia_tecnico', 'faq', 'boas_praticas',
    'norma', 'checklist', 'tutorial', 'instrucao_seguranca', 'solucao_frequente'
  )),
  content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  attachments jsonb NOT NULL DEFAULT '[]',
  author_id uuid REFERENCES users(id),
  version integer NOT NULL DEFAULT 1,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS knowledge_articles_category_idx ON knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS knowledge_articles_tags_idx ON knowledge_articles USING gin(tags);

CREATE TABLE IF NOT EXISTS knowledge_article_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content text NOT NULL,
  edited_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 6. Orçamentos (quotes) — desconto, imposto, itens e histórico ───────

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS building_id uuid REFERENCES buildings(id),
  ADD COLUMN IF NOT EXISTS discount_pct numeric(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_pct numeric(5, 2) NOT NULL DEFAULT 23;

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('material', 'mao_de_obra', 'equipamento', 'deslocacao')),
  description text NOT NULL,
  part_id uuid REFERENCES parts(id),
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS quote_items_quote_idx ON quote_items(quote_id);

CREATE TABLE IF NOT EXISTS quote_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid REFERENCES users(id),
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- ── 7. Materiais — unidade e histórico de movimentos ────────────────────

ALTER TABLE parts
  ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'un';

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
  quantity integer NOT NULL,
  reason text,
  related_purchase_order_id uuid,
  related_work_order_id uuid REFERENCES work_orders(id),
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_movements_item_idx ON inventory_movements(inventory_item_id);

-- ── 8. Compras ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  requested_by uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN (
    'rascunho', 'pendente_aprovacao', 'aprovada', 'encomendada', 'recebida', 'cancelada'
  )),
  cost_center text,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  notes text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_idx ON purchase_orders(supplier_id);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES parts(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS purchase_order_items_po_idx ON purchase_order_items(purchase_order_id);

CREATE TABLE IF NOT EXISTS purchase_order_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  approver_id uuid REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_po_fk'
  ) THEN
    ALTER TABLE inventory_movements
      ADD CONSTRAINT inventory_movements_po_fk
      FOREIGN KEY (related_purchase_order_id) REFERENCES purchase_orders(id);
  END IF;
END $$;

-- link de documentos anexos a compras/incidentes/orçamentos
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_entity_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_entity_type_check
  CHECK (entity_type IN ('equipment', 'client', 'building', 'work_order', 'contract', 'purchase_order', 'incident', 'quote'));

-- ── 9. Trabalhos agendados (calendar_events) ─────────────────────────────

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS building_id uuid REFERENCES buildings(id),
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id),
  ADD COLUMN IF NOT EXISTS equipment_id uuid REFERENCES equipment(id),
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_curso', 'concluido', 'cancelado', 'atrasado'));

ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_type_check;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_type_check
  CHECK (type IN ('work_order', 'preventive', 'audit', 'meeting', 'inspecao', 'reparacao', 'visita_tecnica', 'instalacao'));

CREATE INDEX IF NOT EXISTS calendar_events_building_idx ON calendar_events(building_id);

