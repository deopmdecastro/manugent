-- 004_rpc_functions.sql
-- Creates SECURITY DEFINER RPC functions used by the ManuGent API.
-- These mirror the Supabase migrations for Docker/PostgreSQL local dev.

-- ── Work Orders ──────────────────────────────────────────────────────────────

drop function if exists get_work_orders_list(text, text);
create or replace function get_work_orders_list(p_origin text, p_status text)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    wo.id, wo.parent_work_order_id, wo.client_id, wo.equipment_id,
    wo.team_id, wo.supervisor_id, wo.type, wo.origin, wo.status,
    wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    c.name as client_name,
    e.name as equipment_name,
    t.name as team_name
  from work_orders wo
  join clients c on c.id = wo.client_id
  join equipment e on e.id = wo.equipment_id
  left join teams t on t.id = wo.team_id
  where (p_origin is null or wo.origin = p_origin)
    and (p_status is null or wo.status = p_status)
  order by wo.created_at desc;
end;
$$;

drop function if exists get_work_order_by_id(uuid);
create or replace function get_work_order_by_id(p_id uuid)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    wo.id, wo.parent_work_order_id, wo.client_id, wo.equipment_id,
    wo.team_id, wo.supervisor_id, wo.type, wo.origin, wo.status,
    wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    c.name as client_name,
    e.name as equipment_name,
    t.name as team_name
  from work_orders wo
  join clients c on c.id = wo.client_id
  join equipment e on e.id = wo.equipment_id
  left join teams t on t.id = wo.team_id
  where wo.id = p_id;
end;
$$;

-- ── Dashboard Stats ──────────────────────────────────────────────────────────

drop function if exists get_dashboard_stats();
create or replace function get_dashboard_stats()
returns table (
  open_total bigint,
  in_progress bigint,
  urgent bigint,
  completed bigint,
  total bigint,
  equip_total bigint,
  equip_active bigint,
  unread bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    (select count(*) from work_orders where status not in ('completed', 'cancelled')) as open_total,
    (select count(*) from work_orders where status = 'in_progress') as in_progress,
    (select count(*) from work_orders where priority in ('high', 'urgent') and status not in ('completed', 'cancelled')) as urgent,
    (select count(*) from work_orders where status = 'completed') as completed,
    (select count(*) from work_orders) as total,
    (select count(*) from equipment) as equip_total,
    (select count(*) from equipment where status = 'active') as equip_active,
    (select count(*) from notifications where read_at is null) as unread;
end;
$$;

-- ── Users & Teams ────────────────────────────────────────────────────────────

drop function if exists get_users_with_teams();
create or replace function get_users_with_teams()
returns table (
  id uuid,
  team_id uuid,
  name text,
  email text,
  role text,
  created_at timestamptz,
  team_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select u.id, u.team_id, u.name, u.email, u.role, u.created_at, t.name as team_name
  from users u
  left join teams t on t.id = u.team_id
  order by u.name asc;
end;
$$;

-- ── Equipment ────────────────────────────────────────────────────────────────

drop function if exists get_equipment_with_clients(uuid);
create or replace function get_equipment_with_clients(p_client_id uuid)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select e.id, e.client_id, e.code, e.name, e.brand, e.model, e.serial,
         e.location, e.criticality, e.status, e.created_at, c.name as client_name
  from equipment e
  join clients c on c.id = e.client_id
  where (p_client_id is null or e.client_id = p_client_id)
  order by e.name asc;
end;
$$;

-- ── Search helpers ───────────────────────────────────────────────────────────

drop function if exists search_equipment();
create or replace function search_equipment()
returns table (
  id uuid,
  name text,
  code text,
  location text,
  brand text,
  model text,
  client_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select e.id, e.name, e.code, e.location, e.brand, e.model, c.name as client_name
  from equipment e
  join clients c on c.id = e.client_id
  order by e.name asc;
end;
$$;

drop function if exists search_users_staff();
create or replace function search_users_staff()
returns table (
  id uuid,
  name text,
  email text,
  role text,
  team_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select u.id, u.name, u.email, u.role, t.name as team_name
  from users u
  left join teams t on t.id = u.team_id
  where u.role in ('technician', 'admin', 'superadmin', 'supervisor')
  order by u.name asc;
end;
$$;

drop function if exists search_work_orders_active();
create or replace function search_work_orders_active()
returns table (
  id text,
  title text,
  status text,
  priority text,
  equipment_name text,
  client_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select wo.id::text, wo.title, wo.status, wo.priority,
         e.name as equipment_name, c.name as client_name
  from work_orders wo
  join equipment e on e.id = wo.equipment_id
  join clients c on c.id = wo.client_id
  where wo.status not in ('completed', 'cancelled')
  order by wo.created_at desc
  limit 100;
end;
$$;

-- ── Client Portal ────────────────────────────────────────────────────────────

drop function if exists get_client_work_orders(uuid);
create or replace function get_client_work_orders(p_client_id uuid)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    wo.id, wo.parent_work_order_id, wo.client_id, wo.equipment_id,
    wo.team_id, wo.supervisor_id, wo.type, wo.origin, wo.status,
    wo.priority, wo.title, wo.description, wo.scheduled_for,
    wo.started_at, wo.completed_at, wo.cancelled_at,
    wo.created_at, wo.updated_at,
    cl.name as client_name,
    e.name as equipment_name,
    t.name as team_name
  from work_orders wo
  join clients cl on cl.id = wo.client_id
  join equipment e on e.id = wo.equipment_id
  left join teams t on t.id = wo.team_id
  where wo.client_id = p_client_id
  order by wo.created_at desc;
end;
$$;

drop function if exists get_client_reports(uuid);
create or replace function get_client_reports(p_client_id uuid)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select ir.id, ir.work_order_id, ir.client_id, ir.equipment_id,
         ir.title, ir.summary, ir.actions_performed, ir.recommendations,
         ir.created_by, ir.created_at,
         wo.status as work_order_status,
         wo.title as work_order_title,
         e.name as equipment_name
  from intervention_reports ir
  join work_orders wo on wo.id = ir.work_order_id
  join equipment e on e.id = ir.equipment_id
  where ir.client_id = p_client_id
  order by ir.created_at desc;
end;
$$;

drop function if exists get_client_quotes(uuid);
create or replace function get_client_quotes(p_client_id uuid)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select q.id, q.work_order_id, q.client_id, q.reference, q.description,
         q.amount, q.currency, q.status, q.approved_by, q.approved_at,
         q.created_at, q.updated_at,
         wo.title as work_order_title
  from quotes q
  join work_orders wo on wo.id = q.work_order_id
  where q.client_id = p_client_id
  order by q.created_at desc;
end;
$$;

-- ── Reports ──────────────────────────────────────────────────────────────────

drop function if exists get_report_for_pdf(uuid);
create or replace function get_report_for_pdf(p_report_id uuid)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select ir.id, ir.work_order_id, ir.client_id, ir.equipment_id,
         ir.title, ir.summary, ir.actions_performed, ir.recommendations,
         ir.created_by, ir.created_at,
         cl.name as client_name,
         e.name as equipment_name,
         e.code as equipment_code,
         wo.title as work_order_title,
         wo.status as work_order_status
  from intervention_reports ir
  join clients cl on cl.id = ir.client_id
  join equipment e on e.id = ir.equipment_id
  join work_orders wo on wo.id = ir.work_order_id
  where ir.id = p_report_id;
end;
$$;

-- ── Time Entries ─────────────────────────────────────────────────────────────

drop function if exists get_time_entries(uuid);
create or replace function get_time_entries(p_work_order_id uuid)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select te.id, te.work_order_id, te.technician_id, te.status,
         te.started_at, te.paused_at, te.resumed_at, te.ended_at,
         te.effective_seconds, te.created_at, te.updated_at,
         u.name as technician_name
  from work_order_time_entries te
  join users u on u.id = te.technician_id
  where te.work_order_id = p_work_order_id
  order by te.created_at asc;
end;
$$;

-- ── Findings ─────────────────────────────────────────────────────────────────

drop function if exists create_work_order_findings(uuid, jsonb, uuid);
create or replace function create_work_order_findings(
  p_work_order_id uuid,
  p_findings jsonb,
  p_created_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_work_order record;
  v_finding record;
  v_created_findings jsonb := '[]'::jsonb;
  v_should_create_request boolean := false;
  v_intervention_request record;
  v_measurement_out_of_limits boolean;
  v_inserted record;
begin
  select * into v_work_order from work_orders where id = p_work_order_id for update;
  if not found then
    return jsonb_build_object('error', 'Work order not found');
  end if;

  for v_finding in select * from jsonb_array_elements(p_findings)
  loop
    v_measurement_out_of_limits := false;
    if (v_finding->>'measurementValue') is not null then
      if (v_finding->>'limitMin') is not null and (v_finding->>'measurementValue')::numeric < (v_finding->>'limitMin')::numeric then
        v_measurement_out_of_limits := true;
      end if;
      if (v_finding->>'limitMax') is not null and (v_finding->>'measurementValue')::numeric > (v_finding->>'limitMax')::numeric then
        v_measurement_out_of_limits := true;
      end if;
    end if;

    if v_finding->>'type' in ('nok', 'defect', 'measurement_out_of_limits', 'failure') or v_measurement_out_of_limits then
      v_should_create_request := true;
    end if;

    insert into work_order_findings (
      work_order_id, type, description, measurement_value, limit_min, limit_max, created_by
    )
    values (
      p_work_order_id,
      case when v_measurement_out_of_limits then 'measurement_out_of_limits' else v_finding->>'type' end,
      v_finding->>'description',
      nullif(v_finding->>'measurementValue', '')::numeric,
      nullif(v_finding->>'limitMin', '')::numeric,
      nullif(v_finding->>'limitMax', '')::numeric,
      p_created_by
    )
    returning * into v_inserted;

    v_created_findings := v_created_findings || jsonb_build_object(v_inserted);
  end loop;

  if v_work_order.origin = 'scheduled' and v_should_create_request then
    insert into work_orders (
      parent_work_order_id, client_id, equipment_id, team_id, supervisor_id,
      type, origin, status, priority, title, description
    )
    values (
      v_work_order.id, v_work_order.client_id, v_work_order.equipment_id,
      v_work_order.team_id, v_work_order.supervisor_id,
      'corrective', 'request', 'open', 'high',
      'Pedido de intervencao - ' || v_work_order.title,
      'Criado automaticamente por resultado NOK, defeito, medicao fora dos limites ou falha identificada.'
    )
    returning * into v_intervention_request;

    insert into work_order_links (source_work_order_id, target_work_order_id, reason)
    values (v_work_order.id, v_intervention_request.id, 'scheduled_finding')
    on conflict do nothing;

    insert into notifications (work_order_id, recipient_user_id, recipient_team_id, recipient_role, title, message)
    values
      (v_intervention_request.id, v_work_order.supervisor_id, null, 'supervisor', 'Pedido de intervencao criado',
       'Criado automaticamente a partir da OT agendada ' || v_work_order.title || '.'),
      (v_intervention_request.id, null, v_work_order.team_id, 'team', 'Pedido de intervencao criado',
       'Criado automaticamente a partir da OT agendada ' || v_work_order.title || '.');

    return jsonb_build_object(
      'findings', v_created_findings,
      'interventionRequest', to_jsonb(v_intervention_request)
    );
  end if;

  return jsonb_build_object('findings', v_created_findings, 'interventionRequest', null);
end;
$$;
