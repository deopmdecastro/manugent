/*
# Full Demo Dataset Schema — Fase 1

Estende o schema real (Postgres) com todas as entidades que hoje só
existem na camada "demo" fictícia do frontend (src/frontend/src/data/demo),
para que deixem de ser dados fictícios em memória/localStorage e passem a
viver na base de dados real consumida pela API.

1. Extensões a tabelas existentes
- `clients`  → passa a representar a empresa-cliente (tax_id, sector, active, since)
- `teams`    → leader_id, specialty
- `equipment` → building_id (nullable, aditivo — não quebra dados existentes)

2. Novas tabelas
- `client_contacts` — pessoas de contacto por edifício (o antigo "Client" do demo)
- `buildings`, `technician_profiles`, `suppliers`, `parts`, `inventory_items`,
  `maintenance_requests`, `maintenance_request_assignees`, `preventive_plans`,
  `checklists`, `documents`, `folders`, `contracts`, `audits`, `reports`,
  `comments`, `comment_likes`, `testimonials`, `activity_log`,
  `calendar_events`, `calendar_event_assignees`, `blog_posts`, `ratings`

3. Segurança
- RLS ativa em todas as tabelas novas, com política permissiva única
  (`FOR ALL USING (true) WITH CHECK (true)`), seguindo o padrão já usado em
  `attachments` — a app tem a sua própria camada de auth (JWT) por cima.
*/

-- ── Extensões a tabelas existentes ─────────────────────────────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS since date;

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS leader_id uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS specialty text;

-- ── Edifícios ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  type text NOT NULL DEFAULT 'industrial' CHECK (type IN ('industrial', 'comercial', 'residencial', 'saude', 'escritorio')),
  area_m2 numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_buildings" ON buildings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS building_id uuid REFERENCES buildings(id);

CREATE INDEX IF NOT EXISTS buildings_client_idx ON buildings(client_id);
CREATE INDEX IF NOT EXISTS equipment_building_idx ON equipment(building_id);

-- ── Contactos do cliente por edifício ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  active boolean NOT NULL DEFAULT true,
  contract_id uuid,
  since date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_client_contacts" ON client_contacts FOR ALL USING (true) WITH CHECK (true);

-- ── Perfil de técnico (estende users sem alterar a tabela core) ───────────

CREATE TABLE IF NOT EXISTS technician_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialties text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_servico', 'ausente', 'ferias')),
  rating numeric(3, 2) NOT NULL DEFAULT 0,
  completed_orders integer NOT NULL DEFAULT 0,
  active_orders integer NOT NULL DEFAULT 0
);
ALTER TABLE technician_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_technician_profiles" ON technician_profiles FOR ALL USING (true) WITH CHECK (true);

-- ── Fornecedores, peças e inventário ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text,
  category text,
  email text,
  phone text,
  rating numeric(3, 2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text,
  category text,
  unit_cost numeric(10, 2) NOT NULL DEFAULT 0,
  supplier_id uuid REFERENCES suppliers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_parts" ON parts FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  warehouse text NOT NULL DEFAULT 'principal',
  quantity integer NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 0,
  reserved integer NOT NULL DEFAULT 0,
  last_movement_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_inventory_items" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

-- work_orders.parts_used (peças usadas por OT) — tabela de junção
CREATE TABLE IF NOT EXISTS work_order_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES parts(id),
  quantity integer NOT NULL DEFAULT 1
);
ALTER TABLE work_order_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_work_order_parts" ON work_order_parts FOR ALL USING (true) WITH CHECK (true);

-- ── Pedidos de manutenção (do cliente) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id),
  building_id uuid REFERENCES buildings(id),
  equipment_id uuid REFERENCES equipment(id),
  requested_by uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_analise', 'atribuido', 'em_execucao', 'concluido', 'cancelado')),
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  title text NOT NULL,
  description text,
  due_at timestamptz,
  work_order_id uuid REFERENCES work_orders(id),
  is_late boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_maintenance_requests" ON maintenance_requests FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS maintenance_request_assignees (
  request_id uuid NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (request_id, user_id)
);
ALTER TABLE maintenance_request_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_mr_assignees" ON maintenance_request_assignees FOR ALL USING (true) WITH CHECK (true);

-- ── Planos preventivos e checklists ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  equipment_category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_checklists" ON checklists FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS preventive_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  name text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('semanal', 'mensal', 'trimestral', 'semestral', 'anual')),
  last_executed_at timestamptz,
  next_due_at timestamptz,
  status text NOT NULL DEFAULT 'em_dia' CHECK (status IN ('em_dia', 'atrasado', 'executado')),
  checklist_id uuid REFERENCES checklists(id),
  responsible_team_id uuid REFERENCES teams(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE preventive_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_preventive_plans" ON preventive_plans FOR ALL USING (true) WITH CHECK (true);

-- ── Documentos e pastas ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id),
  owner_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_folders" ON folders FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('manual', 'garantia', 'relatorio', 'contrato', 'fatura', 'certificado')),
  folder_id uuid REFERENCES folders(id),
  entity_type text NOT NULL CHECK (entity_type IN ('equipment', 'client', 'building', 'work_order', 'contract')),
  entity_id uuid NOT NULL,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  size_kb integer NOT NULL DEFAULT 0,
  url text
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_documents" ON documents FOR ALL USING (true) WITH CHECK (true);

-- ── Contratos ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('manutencao_preventiva', 'manutencao_completa', 'sob_pedido')),
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'expirado', 'pendente', 'cancelado')),
  start_date date NOT NULL,
  end_date date,
  monthly_value numeric(12, 2) NOT NULL DEFAULT 0,
  sla_hours integer NOT NULL DEFAULT 24,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_contracts" ON contracts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE client_contacts
  ADD CONSTRAINT client_contacts_contract_fk FOREIGN KEY (contract_id) REFERENCES contracts(id);

-- ── Auditorias e relatórios ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  auditor_id uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_curso', 'concluida')),
  score numeric(5, 2),
  date date NOT NULL,
  findings jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_audits" ON audits FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  type text NOT NULL CHECK (type IN ('intervencao', 'mensal', 'auditoria', 'custo')),
  title text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid REFERENCES users(id),
  url text
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_reports" ON reports FOR ALL USING (true) WITH CHECK (true);

-- ── Comentários (OTs, pedidos, blog, auditorias) e likes ───────────────────

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('work_order', 'request', 'blog', 'audit')),
  entity_id uuid NOT NULL,
  author_id uuid REFERENCES users(id),
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS comments_entity_idx ON comments(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_comment_likes" ON comment_likes FOR ALL USING (true) WITH CHECK (true);

-- ── Testemunhos (substitui data/superadmin/testimonials.json) ─────────────

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_role text,
  company_name text,
  rating numeric(2, 1) NOT NULL DEFAULT 5,
  content text NOT NULL,
  approved boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  photo_url text,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_testimonials" ON testimonials FOR ALL USING (true) WITH CHECK (true);

-- ── Histórico de atividade ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS activity_log_created_idx ON activity_log(created_at DESC);

-- ── Calendário ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('work_order', 'preventive', 'audit', 'meeting')),
  related_id text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS calendar_event_assignees (
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);
ALTER TABLE calendar_event_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_calendar_event_assignees" ON calendar_event_assignees FOR ALL USING (true) WITH CHECK (true);

-- ── Blog (substitui data/superadmin/blog.json e data/blogPosts.ts) ─────────

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text,
  excerpt text,
  content text,
  author text NOT NULL DEFAULT 'Equipa ManuGent',
  read_time_min integer NOT NULL DEFAULT 5,
  published boolean NOT NULL DEFAULT true,
  views integer NOT NULL DEFAULT 0,
  cover_gradient text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_blog_posts" ON blog_posts FOR ALL USING (true) WITH CHECK (true);

-- ── Avaliações explícitas (OTs, técnicos, fornecedores, serviço) ──────────

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('technician', 'work_order', 'supplier', 'service')),
  entity_id uuid NOT NULL,
  author_id uuid REFERENCES users(id),
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_ratings" ON ratings FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS ratings_entity_idx ON ratings(entity_type, entity_id);
