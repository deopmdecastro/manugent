create extension if not exists pgcrypto;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  code text not null,
  name text not null,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id),
  name text not null,
  role text not null default 'technician',
  created_at timestamptz not null default now()
);

create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  parent_work_order_id uuid references work_orders(id),
  client_id uuid not null references clients(id),
  equipment_id uuid not null references equipment(id),
  team_id uuid references teams(id),
  supervisor_id uuid references users(id),
  type text not null check (type in ('preventive', 'inspection', 'round', 'checklist', 'corrective', 'breakdown', 'emergency', 'customer_request')),
  origin text not null check (origin in ('scheduled', 'request')),
  status text not null default 'open' check (status in ('open', 'scheduled', 'in_progress', 'paused', 'waiting_material', 'waiting_customer', 'completed', 'cancelled')),
  priority text not null default 'normal',
  title text not null,
  description text,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists work_order_findings (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  type text not null check (type in ('ok', 'nok', 'defect', 'measurement_out_of_limits', 'failure', 'note')),
  description text not null,
  measurement_value numeric,
  limit_min numeric,
  limit_max numeric,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists work_order_links (
  id uuid primary key default gen_random_uuid(),
  source_work_order_id uuid not null references work_orders(id) on delete cascade,
  target_work_order_id uuid not null references work_orders(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (source_work_order_id, target_work_order_id, reason)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  recipient_user_id uuid references users(id),
  recipient_team_id uuid references teams(id),
  recipient_role text,
  channel text not null default 'in_app',
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists work_order_time_entries (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  technician_id uuid not null references users(id),
  status text not null default 'joined' check (status in ('joined', 'running', 'paused', 'finished')),
  started_at timestamptz,
  paused_at timestamptz,
  resumed_at timestamptz,
  ended_at timestamptz,
  effective_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists active_work_order_technician
  on work_order_time_entries (work_order_id, technician_id)
  where status in ('joined', 'running', 'paused');

create table if not exists intervention_reports (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  client_id uuid not null references clients(id),
  equipment_id uuid not null references equipment(id),
  title text not null,
  summary text not null,
  actions_performed text,
  recommendations text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  client_id uuid not null references clients(id),
  reference text not null,
  description text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
