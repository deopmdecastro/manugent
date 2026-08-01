-- 005_user_status_and_admin_actions.sql
-- Adds account status (active / blocked / banned) so SuperAdmin can block or
-- ban accounts, plus an admin-only password reset RPC. Mirrors
-- supabase/migrations/20260801170000_user_status_and_admin_actions.sql.

-- ── Schema: account status ───────────────────────────────────────────────────

alter table users
  add column if not exists status text not null default 'active',
  add column if not exists status_reason text,
  add column if not exists status_updated_at timestamptz,
  add column if not exists status_updated_by uuid references users(id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_status_check'
  ) then
    alter table users
      add constraint users_status_check check (status in ('active', 'blocked', 'banned'));
  end if;
end $$;

-- ── RPC: verify_user_password (now status-aware) ────────────────────────────
-- The login endpoint still authenticates purely on email/password here; the
-- API layer decides whether a blocked/banned account is allowed to sign in
-- using the returned `status`.

drop function if exists verify_user_password(text, text);

create or replace function verify_user_password(p_email text, p_password text)
returns table (
  id uuid,
  name text,
  email text,
  role text,
  team_id uuid,
  status text,
  status_reason text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select u.id, u.name, u.email, u.role, u.team_id, u.status, u.status_reason
  from users u
  where lower(u.email) = lower(p_email)
    and u.password_hash is not null
    and u.password_hash = crypt(p_password, u.password_hash)
  limit 1;
end;
$$;

-- ── RPC: get_users_with_teams (now includes status) ─────────────────────────

drop function if exists get_users_with_teams();

create or replace function get_users_with_teams()
returns table (
  id uuid,
  team_id uuid,
  name text,
  email text,
  role text,
  created_at timestamptz,
  team_name text,
  status text,
  status_reason text,
  status_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select u.id, u.team_id, u.name, u.email, u.role, u.created_at, t.name as team_name,
         u.status, u.status_reason, u.status_updated_at
  from users u
  left join teams t on t.id = u.team_id
  order by u.name asc;
end;
$$;

grant execute on function get_users_with_teams() to anon, authenticated;

-- ── RPC: admin_set_user_status ───────────────────────────────────────────────
-- Blocks, bans, or reactivates an account. Called only from the SuperAdmin
-- API (already gated by requireSuperAdminUser), so p_actor_id here is used
-- for guardrails (can't act on yourself) and for the audit trail, not as the
-- sole authorization check.

drop function if exists admin_set_user_status(uuid, uuid, text, text);

create or replace function admin_set_user_status(
  p_actor_id uuid,
  p_user_id uuid,
  p_status text,
  p_reason text default null
)
returns table (
  id uuid,
  name text,
  email text,
  role text,
  status text,
  status_reason text,
  status_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('active', 'blocked', 'banned') then
    raise exception 'Estado inválido: %', p_status;
  end if;

  if p_actor_id = p_user_id then
    raise exception 'Não pode alterar o estado da sua própria conta.';
  end if;

  update users
  set status = p_status,
      status_reason = case when p_status = 'active' then null else p_reason end,
      status_updated_at = now(),
      status_updated_by = p_actor_id
  where users.id = p_user_id;

  if not found then
    raise exception 'Utilizador não encontrado.';
  end if;

  return query
  select u.id, u.name, u.email, u.role, u.status, u.status_reason, u.status_updated_at
  from users u
  where u.id = p_user_id;
end;
$$;

-- ── RPC: admin_reset_user_password ───────────────────────────────────────────
-- Sets a new password hash for a user on behalf of SuperAdmin (password
-- recovery flow when a user can't reset it themselves).

drop function if exists admin_reset_user_password(uuid, uuid, text);

create or replace function admin_reset_user_password(
  p_actor_id uuid,
  p_user_id uuid,
  p_new_password text
)
returns table (
  id uuid,
  name text,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_new_password is null or length(p_new_password) < 8 then
    raise exception 'A nova password deve ter pelo menos 8 caracteres.';
  end if;

  update users
  set password_hash = crypt(p_new_password, gen_salt('bf', 10))
  where users.id = p_user_id;

  if not found then
    raise exception 'Utilizador não encontrado.';
  end if;

  return query
  select u.id, u.name, u.email
  from users u
  where u.id = p_user_id;
end;
$$;
