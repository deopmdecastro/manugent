/*
# Account status + SuperAdmin admin actions

1. Schema changes
- `users.status` ('active' | 'blocked' | 'banned', default 'active')
- `users.status_reason`, `users.status_updated_at`, `users.status_updated_by`

2. Updated functions
- `verify_user_password` now also returns `status`/`status_reason` so the
  login endpoint can reject blocked/banned accounts with a clear message.
- `get_users_with_teams` now also returns status columns for the SuperAdmin
  users table.

3. New functions
- `admin_set_user_status(p_actor_id, p_user_id, p_status, p_reason)` — block,
  ban, or reactivate an account. Callable by anon/authenticated because the
  API layer already restricts this route to SuperAdmin via JWT; the function
  itself still guards against an actor targeting their own account.
- `admin_reset_user_password(p_actor_id, p_user_id, p_new_password)` —
  SuperAdmin password-recovery flow: sets a new bcrypt hash for a user who
  can't reset their own password.
*/

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

grant execute on function verify_user_password(text, text) to anon, authenticated;

-- ── RPC: get_users_with_teams (now includes status) ─────────────────────────

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

grant execute on function admin_set_user_status(uuid, uuid, text, text) to anon, authenticated;

-- ── RPC: admin_reset_user_password ───────────────────────────────────────────

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

grant execute on function admin_reset_user_password(uuid, uuid, text) to anon, authenticated;
