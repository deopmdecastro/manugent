/*
# Create helper RPC functions for ManuGent API

Creates SECURITY DEFINER functions for complex queries that can't be done
via the Supabase JS query builder (joins, aggregates, conditional logic).

1. New Functions
- `get_work_orders_list(p_origin text, p_status text)` — list work orders with client/equipment/team names
- `get_work_order_by_id(p_id uuid)` — single work order with joined names
- `get_dashboard_stats()` — aggregated KPIs for the dashboard
- `get_user_team_name(p_user_id uuid)` — get team name for a user

2. Security
- All functions are SECURITY DEFINER
- Callable by anon, authenticated roles

3. Notes
- These functions return the same shape as the original pg queries
*/

-- Get work orders list with joins
CREATE OR REPLACE FUNCTION get_work_orders_list(p_origin text, p_status text)
RETURNS TABLE (
  id uuid,
  parent_work_order_id uuid,
  client_id uuid,
  equipment_id uuid,
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
    wo.team_id, wo.supervisor_id, wo.type, wo.origin, wo.status,
    wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    c.name AS client_name,
    e.name AS equipment_name,
    t.name AS team_name
  FROM work_orders wo
  JOIN clients c ON c.id = wo.client_id
  JOIN equipment e ON e.id = wo.equipment_id
  LEFT JOIN teams t ON t.id = wo.team_id
  WHERE (p_origin IS NULL OR wo.origin = p_origin)
    AND (p_status IS NULL OR wo.status = p_status)
  ORDER BY wo.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_work_orders_list(text, text) TO anon, authenticated;

-- Get single work order by ID with joins
CREATE OR REPLACE FUNCTION get_work_order_by_id(p_id uuid)
RETURNS TABLE (
  id uuid,
  parent_work_order_id uuid,
  client_id uuid,
  equipment_id uuid,
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
    wo.team_id, wo.supervisor_id, wo.type, wo.origin, wo.status,
    wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    c.name AS client_name,
    e.name AS equipment_name,
    t.name AS team_name
  FROM work_orders wo
  JOIN clients c ON c.id = wo.client_id
  JOIN equipment e ON e.id = wo.equipment_id
  LEFT JOIN teams t ON t.id = wo.team_id
  WHERE wo.id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_work_order_by_id(uuid) TO anon, authenticated;

-- Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  open_total bigint,
  in_progress bigint,
  urgent bigint,
  completed bigint,
  total bigint,
  equip_total bigint,
  equip_active bigint,
  unread bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM work_orders WHERE status NOT IN ('completed', 'cancelled')) AS open_total,
    (SELECT count(*) FROM work_orders WHERE status = 'in_progress') AS in_progress,
    (SELECT count(*) FROM work_orders WHERE priority IN ('high', 'urgent') AND status NOT IN ('completed', 'cancelled')) AS urgent,
    (SELECT count(*) FROM work_orders WHERE status = 'completed') AS completed,
    (SELECT count(*) FROM work_orders) AS total,
    (SELECT count(*) FROM equipment) AS equip_total,
    (SELECT count(*) FROM equipment WHERE status = 'active') AS equip_active,
    (SELECT count(*) FROM notifications WHERE read_at IS NULL) AS unread;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon, authenticated;

-- Get users with team names
CREATE OR REPLACE FUNCTION get_users_with_teams()
RETURNS TABLE (
  id uuid,
  team_id uuid,
  name text,
  email text,
  role text,
  created_at timestamptz,
  team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.team_id, u.name, u.email, u.role, u.created_at, t.name AS team_name
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  ORDER BY u.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_users_with_teams() TO anon, authenticated;

-- Get equipment with client names
CREATE OR REPLACE FUNCTION get_equipment_with_clients(p_client_id uuid)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  code text,
  name text,
  brand text,
  model text,
  serial text,
  location text,
  criticality text,
  status text,
  created_at timestamptz,
  client_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.client_id, e.code, e.name, e.brand, e.model, e.serial,
         e.location, e.criticality, e.status, e.created_at, c.name AS client_name
  FROM equipment e
  JOIN clients c ON c.id = e.client_id
  WHERE (p_client_id IS NULL OR e.client_id = p_client_id)
  ORDER BY e.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_equipment_with_clients(uuid) TO anon, authenticated;

-- Get client portal work orders
CREATE OR REPLACE FUNCTION get_client_work_orders(p_client_id uuid)
RETURNS TABLE (
  id uuid,
  parent_work_order_id uuid,
  client_id uuid,
  equipment_id uuid,
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
    wo.team_id, wo.supervisor_id, wo.type, wo.origin, wo.status,
    wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    cl.name AS client_name,
    e.name AS equipment_name,
    t.name AS team_name
  FROM work_orders wo
  JOIN clients cl ON cl.id = wo.client_id
  JOIN equipment e ON e.id = wo.equipment_id
  LEFT JOIN teams t ON t.id = wo.team_id
  WHERE wo.client_id = p_client_id
  ORDER BY wo.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_client_work_orders(uuid) TO anon, authenticated;

-- Get client reports
CREATE OR REPLACE FUNCTION get_client_reports(p_client_id uuid)
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
  WHERE ir.client_id = p_client_id
  ORDER BY ir.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_client_reports(uuid) TO anon, authenticated;

-- Get client quotes
CREATE OR REPLACE FUNCTION get_client_quotes(p_client_id uuid)
RETURNS TABLE (
  id uuid,
  work_order_id uuid,
  client_id uuid,
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
  SELECT q.id, q.work_order_id, q.client_id, q.reference, q.description,
         q.amount, q.currency, q.status, q.approved_by, q.approved_at,
         q.created_at, q.updated_at,
         wo.title AS work_order_title
  FROM quotes q
  JOIN work_orders wo ON wo.id = q.work_order_id
  WHERE q.client_id = p_client_id
  ORDER BY q.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_client_quotes(uuid) TO anon, authenticated;

-- Get report for PDF
CREATE OR REPLACE FUNCTION get_report_for_pdf(p_report_id uuid)
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
  client_name text,
  equipment_name text,
  equipment_code text,
  work_order_title text,
  work_order_status text
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
         cl.name AS client_name,
         e.name AS equipment_name,
         e.code AS equipment_code,
         wo.title AS work_order_title,
         wo.status AS work_order_status
  FROM intervention_reports ir
  JOIN clients cl ON cl.id = ir.client_id
  JOIN equipment e ON e.id = ir.equipment_id
  JOIN work_orders wo ON wo.id = ir.work_order_id
  WHERE ir.id = p_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_report_for_pdf(uuid) TO anon, authenticated;

-- Get time entries for work order
CREATE OR REPLACE FUNCTION get_time_entries(p_work_order_id uuid)
RETURNS TABLE (
  id uuid,
  work_order_id uuid,
  technician_id uuid,
  status text,
  started_at timestamptz,
  paused_at timestamptz,
  resumed_at timestamptz,
  ended_at timestamptz,
  effective_seconds integer,
  created_at timestamptz,
  updated_at timestamptz,
  technician_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT te.id, te.work_order_id, te.technician_id, te.status,
         te.started_at, te.paused_at, te.resumed_at, te.ended_at,
         te.effective_seconds, te.created_at, te.updated_at,
         u.name AS technician_name
  FROM work_order_time_entries te
  JOIN users u ON u.id = te.technician_id
  WHERE te.work_order_id = p_work_order_id
  ORDER BY te.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_time_entries(uuid) TO anon, authenticated;

-- Fuzzy search helpers
CREATE OR REPLACE FUNCTION search_equipment()
RETURNS TABLE (
  id uuid,
  name text,
  code text,
  location text,
  brand text,
  model text,
  client_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.name, e.code, e.location, e.brand, e.model, c.name AS client_name
  FROM equipment e
  JOIN clients c ON c.id = e.client_id
  ORDER BY e.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION search_equipment() TO anon, authenticated;

CREATE OR REPLACE FUNCTION search_users_staff()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role, t.name AS team_name
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  WHERE u.role IN ('technician', 'admin', 'superadmin', 'supervisor')
  ORDER BY u.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION search_users_staff() TO anon, authenticated;

CREATE OR REPLACE FUNCTION search_work_orders_active()
RETURNS TABLE (
  id text,
  title text,
  status text,
  priority text,
  equipment_name text,
  client_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT wo.id::text, wo.title, wo.status, wo.priority,
         e.name AS equipment_name, c.name AS client_name
  FROM work_orders wo
  JOIN equipment e ON e.id = wo.equipment_id
  JOIN clients c ON c.id = wo.client_id
  WHERE wo.status NOT IN ('completed', 'cancelled')
  ORDER BY wo.created_at DESC
  LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION search_work_orders_active() TO anon, authenticated;