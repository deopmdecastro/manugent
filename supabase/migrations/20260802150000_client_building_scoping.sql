-- 009_client_building_scoping.sql
-- Garante que cada cliente só vê OT, ficheiros, orçamentos, incidentes,
-- calendário, relatórios e checklists do seu edifício (sucursal).
--
-- Espelha supabase/migrations/20260802150000_client_building_scoping.sql
-- (adaptado ao Postgres standalone, sem RLS/roles anon/authenticated).

-- ── 1. work_orders.building_id ─────────────────────────────────────────────

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS building_id uuid REFERENCES buildings(id);

CREATE INDEX IF NOT EXISTS work_orders_building_idx ON work_orders(building_id);

-- ── 2. RPCs de listagem por edifício ───────────────────────────────────────

CREATE OR REPLACE FUNCTION get_client_buildings(p_client_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  city text,
  type text,
  area_m2 numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.name, b.address, b.city, b.type, b.area_m2, b.created_at
  FROM buildings b
  WHERE b.client_id = p_client_id
  ORDER BY b.name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION get_building_work_orders(p_building_id uuid)
RETURNS TABLE (
  id uuid,
  parent_work_order_id uuid,
  client_id uuid,
  equipment_id uuid,
  building_id uuid,
  team_id uuid,
  supervisor_id uuid,
  type text,
  origin text,
  status text,
  priority text,
  title text,
  description text,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  client_name text,
  equipment_name text,
  building_name text,
  team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wo.id, wo.parent_work_order_id, wo.client_id, wo.equipment_id,
    wo.building_id, wo.team_id, wo.supervisor_id, wo.type, wo.origin,
    wo.status, wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    cl.name AS client_name,
    e.name AS equipment_name,
    b.name AS building_name,
    t.name AS team_name
  FROM work_orders wo
  JOIN clients cl ON cl.id = wo.client_id
  JOIN equipment e ON e.id = wo.equipment_id
  LEFT JOIN buildings b ON b.id = wo.building_id
  LEFT JOIN teams t ON t.id = wo.team_id
  WHERE wo.building_id = p_building_id
  ORDER BY wo.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_building_documents(p_building_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  folder_id uuid,
  entity_type text,
  entity_id uuid,
  uploaded_by uuid,
  uploaded_at timestamptz,
  size_kb integer,
  url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.name, d.type, d.folder_id, d.entity_type, d.entity_id,
         d.uploaded_by, d.uploaded_at, d.size_kb, d.url
  FROM documents d
  WHERE d.entity_type = 'building' AND d.entity_id = p_building_id
  ORDER BY d.uploaded_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_building_quotes(p_building_id uuid)
RETURNS TABLE (
  id uuid,
  work_order_id uuid,
  client_id uuid,
  building_id uuid,
  reference text,
  description text,
  amount numeric,
  currency text,
  status text,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  work_order_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.work_order_id, q.client_id, q.building_id,
         q.reference, q.description, q.amount, q.currency, q.status,
         q.approved_by, q.approved_at, q.created_at, q.updated_at,
         wo.title AS work_order_title
  FROM quotes q
  LEFT JOIN work_orders wo ON wo.id = q.work_order_id
  WHERE COALESCE(q.building_id, wo.building_id) = p_building_id
  ORDER BY q.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_building_incidents(p_building_id uuid)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  building_id uuid,
  equipment_id uuid,
  type text,
  title text,
  description text,
  status text,
  priority text,
  reported_by uuid,
  assigned_to uuid,
  work_order_id uuid,
  photos jsonb,
  occurred_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.client_id, i.building_id, i.equipment_id, i.type,
         i.title, i.description, i.status, i.priority,
         i.reported_by, i.assigned_to, i.work_order_id, i.photos,
         i.occurred_at, i.resolved_at, i.created_at
  FROM incidents i
  WHERE i.building_id = p_building_id
  ORDER BY i.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_building_calendar_events(p_building_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  type text,
  related_id text,
  start_at timestamptz,
  end_at timestamptz,
  client_id uuid,
  equipment_id uuid,
  priority text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ce.id, ce.title, ce.type, ce.related_id, ce.start_at, ce.end_at,
         ce.client_id, ce.equipment_id, ce.priority, ce.status, ce.created_at
  FROM calendar_events ce
  WHERE ce.building_id = p_building_id
  ORDER BY ce.start_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION get_building_reports(p_building_id uuid)
RETURNS TABLE (
  id uuid,
  work_order_id uuid,
  client_id uuid,
  equipment_id uuid,
  title text,
  summary text,
  actions_performed text,
  recommendations text,
  created_by uuid,
  created_at timestamptz,
  work_order_status text,
  work_order_title text,
  equipment_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ir.id, ir.work_order_id, ir.client_id, ir.equipment_id,
         ir.title, ir.summary, ir.actions_performed, ir.recommendations,
         ir.created_by, ir.created_at,
         wo.status AS work_order_status,
         wo.title AS work_order_title,
         e.name AS equipment_name
  FROM intervention_reports ir
  JOIN work_orders wo ON wo.id = ir.work_order_id
  JOIN equipment e ON e.id = ir.equipment_id
  WHERE wo.building_id = p_building_id
  ORDER BY ir.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_building_checklists(p_building_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  items jsonb,
  equipment_category text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT c.id, c.name, c.items, c.equipment_category, c.created_at
  FROM checklists c
  LEFT JOIN equipment e ON e.code = c.equipment_category
  LEFT JOIN preventive_plans pp ON pp.checklist_id = c.id
  LEFT JOIN equipment pe ON pe.id = pp.equipment_id
  WHERE (e.building_id = p_building_id OR pe.building_id = p_building_id)
  ORDER BY c.name ASC;
END;
$$;

-- ── 3. get_client_work_orders com filtro opcional por building_id ──────────

CREATE OR REPLACE FUNCTION get_client_work_orders(p_client_id uuid, p_building_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  parent_work_order_id uuid,
  client_id uuid,
  equipment_id uuid,
  building_id uuid,
  team_id uuid,
  supervisor_id uuid,
  type text,
  origin text,
  status text,
  priority text,
  title text,
  description text,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  client_name text,
  equipment_name text,
  building_name text,
  team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wo.id, wo.parent_work_order_id, wo.client_id, wo.equipment_id,
    wo.building_id, wo.team_id, wo.supervisor_id, wo.type, wo.origin,
    wo.status, wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    cl.name AS client_name,
    e.name AS equipment_name,
    b.name AS building_name,
    t.name AS team_name
  FROM work_orders wo
  JOIN clients cl ON cl.id = wo.client_id
  JOIN equipment e ON e.id = wo.equipment_id
  LEFT JOIN buildings b ON b.id = wo.building_id
  LEFT JOIN teams t ON t.id = wo.team_id
  WHERE wo.client_id = p_client_id
    AND (p_building_id IS NULL OR wo.building_id = p_building_id)
  ORDER BY wo.created_at DESC;
END;
$$;
