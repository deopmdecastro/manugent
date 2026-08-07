-- 022_work_orders_full_associations.sql
-- As OTs já ficam corretamente associadas a Cliente/Edifício/Equipamento no
-- seed (work_orders.client_id/building_id/equipment_id/supervisor_id), mas
-- as RPCs de leitura (criadas em 004, antes de work_orders.building_id
-- existir — ver 009) nunca devolviam o edifício, a empresa (via
-- clients.empresa_id) nem o nome de quem está responsável pela OT. Isto
-- fazia a app parecer "desligada" do seed de clientes/empresas mesmo com os
-- dados corretos na BD.
--
-- Mirrors supabase/migrations/20260807020000_work_orders_full_associations.sql

-- CREATE OR REPLACE não permite mudar as colunas de RETURNS TABLE; é
-- preciso apagar a versão anterior primeiro.
DROP FUNCTION IF EXISTS get_work_orders_list(text, text);
DROP FUNCTION IF EXISTS get_work_order_by_id(uuid);

CREATE FUNCTION get_work_orders_list(p_origin text, p_status text)
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
  team_name text,
  building_name text,
  supervisor_name text,
  empresa_id uuid,
  empresa_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wo.id, wo.parent_work_order_id, wo.client_id, wo.equipment_id, wo.building_id,
    wo.team_id, wo.supervisor_id, wo.type, wo.origin, wo.status,
    wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    c.name AS client_name,
    e.name AS equipment_name,
    t.name AS team_name,
    b.name AS building_name,
    u.name AS supervisor_name,
    c.empresa_id AS empresa_id,
    emp.name AS empresa_name
  FROM work_orders wo
  JOIN clients c ON c.id = wo.client_id
  JOIN equipment e ON e.id = wo.equipment_id
  LEFT JOIN teams t ON t.id = wo.team_id
  LEFT JOIN buildings b ON b.id = wo.building_id
  LEFT JOIN users u ON u.id = wo.supervisor_id
  LEFT JOIN empresas emp ON emp.id = c.empresa_id
  WHERE (p_origin IS NULL OR wo.origin = p_origin)
    AND (p_status IS NULL OR wo.status = p_status)
  ORDER BY wo.created_at DESC;
END;
$$;

CREATE FUNCTION get_work_order_by_id(p_id uuid)
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
  team_name text,
  building_name text,
  supervisor_name text,
  empresa_id uuid,
  empresa_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wo.id, wo.parent_work_order_id, wo.client_id, wo.equipment_id, wo.building_id,
    wo.team_id, wo.supervisor_id, wo.type, wo.origin, wo.status,
    wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    c.name AS client_name,
    e.name AS equipment_name,
    t.name AS team_name,
    b.name AS building_name,
    u.name AS supervisor_name,
    c.empresa_id AS empresa_id,
    emp.name AS empresa_name
  FROM work_orders wo
  JOIN clients c ON c.id = wo.client_id
  JOIN equipment e ON e.id = wo.equipment_id
  LEFT JOIN teams t ON t.id = wo.team_id
  LEFT JOIN buildings b ON b.id = wo.building_id
  LEFT JOIN users u ON u.id = wo.supervisor_id
  LEFT JOIN empresas emp ON emp.id = c.empresa_id
  WHERE wo.id = p_id;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_work_orders_list(text, text) TO anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_work_order_by_id(uuid) TO anon, authenticated';
  END IF;
END $$;
