/*
# ManuGent CMMS Schema

Creates the complete database schema for the ManuGent CMMS platform.

1. New Tables
- `teams` — maintenance teams
- `users` — platform users (superadmin, admin, gestor, tecnico, cliente) with password_hash for auth
- `clients` — clients/customers
- `equipment` — equipment/assets managed by the platform
- `work_orders` — work orders (preventive, corrective, inspection, etc.)
- `work_order_findings` — findings/results recorded on work orders
- `work_order_links` — links between related work orders
- `notifications` — in-app notifications
- `work_order_time_entries` — time tracking per technician per work order
- `intervention_reports` — reports generated after interventions
- `quotes` — quotes/estimates for clients
- `ai_conversations` — AI chat conversation history

2. Security
- RLS enabled on all tables
- Policies allow anon+authenticated CRUD (the app uses its own JWT auth layer on top)
- The `users` table has a `password_hash` column used by the custom login endpoint

3. Notes
- Uses pgcrypto for password hashing (crypt + gen_salt)
- Demo users seeded with password "Demo@2026"
- All work order types/statuses use CHECK constraints matching the app's domain logic
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id),
  name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'technician',
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id),
  code text NOT NULL,
  name text NOT NULL,
  brand text,
  model text,
  serial text,
  location text,
  criticality text DEFAULT 'normal',
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_work_order_id uuid REFERENCES work_orders(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  equipment_id uuid NOT NULL REFERENCES equipment(id),
  team_id uuid REFERENCES teams(id),
  supervisor_id uuid REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('preventive', 'inspection', 'round', 'checklist', 'corrective', 'breakdown', 'emergency', 'customer_request')),
  origin text NOT NULL CHECK (origin IN ('scheduled', 'request')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'scheduled', 'in_progress', 'paused', 'waiting_material', 'waiting_customer', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  description text,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Work Order Findings
CREATE TABLE IF NOT EXISTS work_order_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('ok', 'nok', 'defect', 'measurement_out_of_limits', 'failure', 'note')),
  description text NOT NULL,
  measurement_value numeric,
  limit_min numeric,
  limit_max numeric,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE work_order_findings ENABLE ROW LEVEL SECURITY;

-- Work Order Links
CREATE TABLE IF NOT EXISTS work_order_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  target_work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_work_order_id, target_work_order_id, reason)
);
ALTER TABLE work_order_links ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  recipient_user_id uuid REFERENCES users(id),
  recipient_team_id uuid REFERENCES teams(id),
  recipient_role text,
  channel text NOT NULL DEFAULT 'in_app',
  title text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Work Order Time Entries
CREATE TABLE IF NOT EXISTS work_order_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'running', 'paused', 'finished')),
  started_at timestamptz,
  paused_at timestamptz,
  resumed_at timestamptz,
  ended_at timestamptz,
  effective_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE work_order_time_entries ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS active_work_order_technician
  ON work_order_time_entries (work_order_id, technician_id)
  WHERE status IN ('joined', 'running', 'paused');

-- Intervention Reports
CREATE TABLE IF NOT EXISTS intervention_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id),
  equipment_id uuid NOT NULL REFERENCES equipment(id),
  title text NOT NULL,
  summary text NOT NULL,
  actions_performed text,
  recommendations text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE intervention_reports ENABLE ROW LEVEL SECURITY;

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id),
  reference text NOT NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_role text NOT NULL DEFAULT 'admin',
  messages jsonb NOT NULL DEFAULT '[]',
  context_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);

-- RLS Policies: allow anon+authenticated CRUD on all tables
-- (The app has its own JWT auth layer in the Hono server)

-- Teams policies
DROP POLICY IF EXISTS "anon_crud_teams" ON teams;
CREATE POLICY "anon_crud_teams" ON teams FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_teams" ON teams;
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE TO anon, authenticated USING (true);

-- Users policies
DROP POLICY IF EXISTS "anon_crud_users" ON users;
CREATE POLICY "anon_crud_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

-- Clients policies
DROP POLICY IF EXISTS "anon_crud_clients" ON clients;
CREATE POLICY "anon_crud_clients" ON clients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
CREATE POLICY "anon_delete_clients" ON clients FOR DELETE TO anon, authenticated USING (true);

-- Equipment policies
DROP POLICY IF EXISTS "anon_crud_equipment" ON equipment;
CREATE POLICY "anon_crud_equipment" ON equipment FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_equipment" ON equipment;
CREATE POLICY "anon_insert_equipment" ON equipment FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_equipment" ON equipment;
CREATE POLICY "anon_update_equipment" ON equipment FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_equipment" ON equipment;
CREATE POLICY "anon_delete_equipment" ON equipment FOR DELETE TO anon, authenticated USING (true);

-- Work Orders policies
DROP POLICY IF EXISTS "anon_crud_work_orders" ON work_orders;
CREATE POLICY "anon_crud_work_orders" ON work_orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_work_orders" ON work_orders;
CREATE POLICY "anon_insert_work_orders" ON work_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_work_orders" ON work_orders;
CREATE POLICY "anon_update_work_orders" ON work_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_work_orders" ON work_orders;
CREATE POLICY "anon_delete_work_orders" ON work_orders FOR DELETE TO anon, authenticated USING (true);

-- Work Order Findings policies
DROP POLICY IF EXISTS "anon_crud_wo_findings" ON work_order_findings;
CREATE POLICY "anon_crud_wo_findings" ON work_order_findings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wo_findings" ON work_order_findings;
CREATE POLICY "anon_insert_wo_findings" ON work_order_findings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wo_findings" ON work_order_findings;
CREATE POLICY "anon_update_wo_findings" ON work_order_findings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wo_findings" ON work_order_findings;
CREATE POLICY "anon_delete_wo_findings" ON work_order_findings FOR DELETE TO anon, authenticated USING (true);

-- Work Order Links policies
DROP POLICY IF EXISTS "anon_crud_wo_links" ON work_order_links;
CREATE POLICY "anon_crud_wo_links" ON work_order_links FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wo_links" ON work_order_links;
CREATE POLICY "anon_insert_wo_links" ON work_order_links FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wo_links" ON work_order_links;
CREATE POLICY "anon_delete_wo_links" ON work_order_links FOR DELETE TO anon, authenticated USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "anon_crud_notifications" ON notifications;
CREATE POLICY "anon_crud_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- Time Entries policies
DROP POLICY IF EXISTS "anon_crud_time_entries" ON work_order_time_entries;
CREATE POLICY "anon_crud_time_entries" ON work_order_time_entries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_time_entries" ON work_order_time_entries;
CREATE POLICY "anon_insert_time_entries" ON work_order_time_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_time_entries" ON work_order_time_entries;
CREATE POLICY "anon_update_time_entries" ON work_order_time_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_time_entries" ON work_order_time_entries;
CREATE POLICY "anon_delete_time_entries" ON work_order_time_entries FOR DELETE TO anon, authenticated USING (true);

-- Intervention Reports policies
DROP POLICY IF EXISTS "anon_crud_reports" ON intervention_reports;
CREATE POLICY "anon_crud_reports" ON intervention_reports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_reports" ON intervention_reports;
CREATE POLICY "anon_insert_reports" ON intervention_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_reports" ON intervention_reports;
CREATE POLICY "anon_update_reports" ON intervention_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_reports" ON intervention_reports;
CREATE POLICY "anon_delete_reports" ON intervention_reports FOR DELETE TO anon, authenticated USING (true);

-- Quotes policies
DROP POLICY IF EXISTS "anon_crud_quotes" ON quotes;
CREATE POLICY "anon_crud_quotes" ON quotes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_quotes" ON quotes;
CREATE POLICY "anon_insert_quotes" ON quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_quotes" ON quotes;
CREATE POLICY "anon_update_quotes" ON quotes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_quotes" ON quotes;
CREATE POLICY "anon_delete_quotes" ON quotes FOR DELETE TO anon, authenticated USING (true);

-- AI Conversations policies
DROP POLICY IF EXISTS "anon_crud_ai_conv" ON ai_conversations;
CREATE POLICY "anon_crud_ai_conv" ON ai_conversations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ai_conv" ON ai_conversations;
CREATE POLICY "anon_insert_ai_conv" ON ai_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ai_conv" ON ai_conversations;
CREATE POLICY "anon_update_ai_conv" ON ai_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ai_conv" ON ai_conversations;
CREATE POLICY "anon_delete_ai_conv" ON ai_conversations FOR DELETE TO anon, authenticated USING (true);