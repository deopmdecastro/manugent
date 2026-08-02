-- 007_companies_and_relations.sql
-- Adds multi-company (Empresas) support:
-- 1. Companies table for tenant-like organisation
-- 2. users.company_id to associate collaborators with their company
-- 3. clients.company_id to associate clients with a company
-- 4. RPC functions for company-aware queries
-- 5. Seed demo companies with credentials
--
-- Mirrors supabase/migrations/20260803120000_companies_and_relations.sql
-- (adapted for Postgres standalone without RLS/roles anon/authenticated).

-- ── Companies table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text,
  email text,
  phone text,
  address text,
  city text,
  sector text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Link users (collaborators) to companies ───────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS users_company_idx ON users(company_id);

-- ── Link clients to companies ─────────────────────────────────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS clients_company_idx ON clients(company_id);

-- ── RPC: get_companies ─────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS get_companies();

CREATE OR REPLACE FUNCTION get_companies()
RETURNS TABLE (
  id uuid,
  name text,
  tax_id text,
  email text,
  phone text,
  address text,
  city text,
  sector text,
  active boolean,
  created_at timestamptz,
  collaborator_count bigint,
  client_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.name, c.tax_id, c.email, c.phone, c.address, c.city, c.sector, c.active, c.created_at,
    (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) AS collaborator_count,
    (SELECT COUNT(*) FROM clients cl WHERE cl.company_id = c.id) AS client_count
  FROM companies c
  ORDER BY c.name ASC;
END;
$$;

-- ── RPC: get_users_with_company (includes company name) ───────────────────

DROP FUNCTION IF EXISTS get_users_with_company();

CREATE OR REPLACE FUNCTION get_users_with_company()
RETURNS TABLE (
  id uuid,
  team_id uuid,
  company_id uuid,
  name text,
  email text,
  role text,
  status text,
  department text,
  position text,
  phone text,
  created_at timestamptz,
  team_name text,
  company_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.team_id, u.company_id,
    u.name, u.email, u.role, u.status,
    u.department, u.position, u.phone,
    u.created_at,
    t.name AS team_name,
    co.name AS company_name
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  LEFT JOIN companies co ON co.id = u.company_id
  ORDER BY u.name ASC;
END;
$$;

-- ── RPC: get_company_collaborators ─────────────────────────────────────────

DROP FUNCTION IF EXISTS get_company_collaborators(uuid);

CREATE OR REPLACE FUNCTION get_company_collaborators(p_company_id uuid)
RETURNS TABLE (
  id uuid,
  team_id uuid,
  name text,
  email text,
  role text,
  status text,
  department text,
  position text,
  phone text,
  created_at timestamptz,
  team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.team_id, u.name, u.email, u.role, u.status,
    u.department, u.position, u.phone,
    u.created_at,
    t.name AS team_name
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  WHERE u.company_id = p_company_id
  ORDER BY u.name ASC;
END;
$$;

-- ── RPC: get_clients_with_company ──────────────────────────────────────────

DROP FUNCTION IF EXISTS get_clients_with_company();

CREATE OR REPLACE FUNCTION get_clients_with_company()
RETURNS TABLE (
  id uuid,
  company_id uuid,
  name text,
  email text,
  phone text,
  tax_id text,
  sector text,
  active boolean,
  since date,
  created_at timestamptz,
  company_name text,
  building_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id, cl.company_id, cl.name, cl.email, cl.phone,
    cl.tax_id, cl.sector, cl.active, cl.since, cl.created_at,
    co.name AS company_name,
    (SELECT COUNT(*) FROM buildings b WHERE b.client_id = cl.id) AS building_count
  FROM clients cl
  LEFT JOIN companies co ON co.id = cl.company_id
  ORDER BY cl.name ASC;
END;
$$;

-- ── Seed demo companies ─────────────────────────────────────────────────────

-- 5 demo companies with Portuguese names, each with its own admin/gestor/tecnico
-- Superadmin remains global (no company_id).

INSERT INTO companies (id, name, tax_id, email, phone, address, city, sector)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Norte Fabril Lda', 'PT512345678', 'geral@nortefabril.pt', '+351 220 100 100', 'Rua do Parque Industrial, 150', 'Porto', 'Fabril'),
  ('c0000000-0000-0000-0000-000000000002', 'Atlântico Health S.A.', 'PT598765432', 'info@atlanticoh.pt', '+351 210 200 200', 'Av. da Liberdade, 250', 'Lisboa', 'Saúde'),
  ('c0000000-0000-0000-0000-000000000003', 'Ibérica Hotels Group', 'PT556789012', 'contacto@ibericahotels.pt', '+351 240 300 300', 'Rua do Hotel, 50', 'Coimbra', 'Hotelaria'),
  ('c0000000-0000-0000-0000-000000000004', 'Douro Tech Lda', 'PT534567890', 'suporte@dourtech.pt', '+351 220 400 400', 'Zona Industrial, Lt 12', 'Aveiro', 'Tecnologia'),
  ('c0000000-0000-0000-0000-000000000005', 'Lusitana Foods S.A.', 'PT576543210', 'comercial@lusifoods.pt', '+351 210 500 500', 'Rua do Comércio, 85', 'Braga', 'Alimentar')
ON CONFLICT DO NOTHING;

-- ── Seed demo company users (admin/gestor/tecnico per company) ─────────────

-- Each company gets: 1 admin, 1 gestor, 2-3 tecnicos
-- Password "Demo@2026" for all (same as existing demo accounts)

-- Norte Fabril Lda
INSERT INTO users (name, email, role, company_id, password_hash, status, department, position)
VALUES
  ('Admin Norte', 'admin@nortefabril.pt', 'admin', 'c0000000-0000-0000-0000-000000000001', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Administrativo', 'Administrador'),
  ('Gestor Norte', 'gestor@nortefabril.pt', 'gestor', 'c0000000-0000-0000-0000-000000000001', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Gestão de Operações', 'Gestor de Manutenção'),
  ('Técnico Norte A', 'tecnico1@nortefabril.pt', 'tecnico', 'c0000000-0000-0000-0000-000000000001', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Manutenção Técnica', 'Técnico de Manutenção'),
  ('Técnico Norte B', 'tecnico2@nortefabril.pt', 'tecnico', 'c0000000-0000-0000-0000-000000000001', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Manutenção Técnica', 'Técnico de Manutenção'),
  ('Engenheiro Norte', 'eng1@nortefabril.pt', 'engenheiro', 'c0000000-0000-0000-0000-000000000001', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Engenharia', 'Engenheiro de Manutenção')
ON CONFLICT (email) DO NOTHING;

-- Atlântico Health S.A.
INSERT INTO users (name, email, role, company_id, password_hash, status, department, position)
VALUES
  ('Admin Atlântico', 'admin@atlanticoh.pt', 'admin', 'c0000000-0000-0000-0000-000000000002', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Administrativo', 'Administrador'),
  ('Gestor Atlântico', 'gestor@atlanticoh.pt', 'gestor', 'c0000000-0000-0000-0000-000000000002', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Gestão de Operações', 'Gestor de Manutenção'),
  ('Técnico Atlântico', 'tecnico1@atlanticoh.pt', 'tecnico', 'c0000000-0000-0000-0000-000000000002', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Manutenção Técnica', 'Técnico de Manutenção'),
  ('Financeiro Atlântico', 'fin1@atlanticoh.pt', 'financeiro', 'c0000000-0000-0000-0000-000000000002', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Financeiro', 'Analista Financeiro')
ON CONFLICT (email) DO NOTHING;

-- Ibérica Hotels Group
INSERT INTO users (name, email, role, company_id, password_hash, status, department, position)
VALUES
  ('Admin Ibérica', 'admin@ibericahotels.pt', 'admin', 'c0000000-0000-0000-0000-000000000003', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Administrativo', 'Administrador'),
  ('Gestor Ibérica', 'gestor@ibericahotels.pt', 'gestor', 'c0000000-0000-0000-0000-000000000003', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Gestão de Operações', 'Gestor de Manutenção'),
  ('Técnico Ibérica', 'tecnico1@ibericahotels.pt', 'tecnico', 'c0000000-0000-0000-0000-000000000003', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Manutenção Técnica', 'Técnico de Manutenção'),
  ('Engenheiro Ibérica', 'eng1@ibericahotels.pt', 'engenheiro', 'c0000000-0000-0000-0000-000000000003', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Engenharia', 'Engenheiro de Manutenção')
ON CONFLICT (email) DO NOTHING;

-- Douro Tech Lda
INSERT INTO users (name, email, role, company_id, password_hash, status, department, position)
VALUES
  ('Admin Douro', 'admin@dourtech.pt', 'admin', 'c0000000-0000-0000-0000-000000000004', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Administrativo', 'Administrador'),
  ('Gestor Douro', 'gestor@dourtech.pt', 'gestor', 'c0000000-0000-0000-0000-000000000004', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Gestão de Operações', 'Gestor de Manutenção'),
  ('Técnico Douro', 'tecnico1@dourtech.pt', 'tecnico', 'c0000000-0000-0000-0000-000000000004', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Manutenção Técnica', 'Técnico de Manutenção')
ON CONFLICT (email) DO NOTHING;

-- Lusitana Foods S.A.
INSERT INTO users (name, email, role, company_id, password_hash, status, department, position)
VALUES
  ('Admin Lusitana', 'admin@lusifoods.pt', 'admin', 'c0000000-0000-0000-0000-000000000005', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Administrativo', 'Administrador'),
  ('Gestor Lusitana', 'gestor@lusifoods.pt', 'gestor', 'c0000000-0000-0000-0000-000000000005', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Gestão de Operações', 'Gestor de Manutenção'),
  ('Técnico Lusitana', 'tecnico1@lusifoods.pt', 'tecnico', 'c0000000-0000-0000-0000-000000000005', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Manutenção Técnica', 'Técnico de Manutenção'),
  ('Financeiro Lusitana', 'fin1@lusifoods.pt', 'financeiro', 'c0000000-0000-0000-0000-000000000005', crypt('Demo@2026', gen_salt('bf', 10)), 'active', 'Financeiro', 'Analista Financeiro')
ON CONFLICT (email) DO NOTHING;

-- Atualizar o superadmin e contas demo existentes (sem company_id, ficam globais)
UPDATE users SET company_id = NULL WHERE email IN (
  'superadmin@manugent.pt',
  'admin@manugent.pt',
  'gestor@manugent.pt',
  'tecnico@manugent.pt',
  'cliente@demo.pt'
);
