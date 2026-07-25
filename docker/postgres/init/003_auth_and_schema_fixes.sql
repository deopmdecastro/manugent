-- 003_auth_and_schema_fixes.sql
-- Fixes schema drift between 001/002 init scripts and columns the API actually
-- uses (clients.email/phone, equipment.brand/model/serial/criticality/status,
-- users.email), and adds real password-based authentication.

create extension if not exists pgcrypto;

-- ── Schema drift fixes ──────────────────────────────────────────────────────

alter table clients
  add column if not exists email text,
  add column if not exists phone text;

alter table equipment
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists serial text,
  add column if not exists criticality text not null default 'normal',
  add column if not exists status text not null default 'active';

-- ── Authentication ───────────────────────────────────────────────────────────

alter table users
  add column if not exists email text,
  add column if not exists password_hash text;

-- Backfill NULL emails so we can safely enforce uniqueness (existing rows
-- created before this migration, e.g. via the demo bootstrap route).
update users set email = lower(id::text) || '@manugent.invalid'
where email is null;

alter table users alter column email set not null;

create unique index if not exists users_email_unique_idx on users (lower(email));

-- Seed/update the 4 demo accounts referenced by the frontend's role-picker
-- (admin / gestor / tecnico / cliente). Default demo password: "Demo@2026"
-- (documented in README.md). Real deployments should rotate this immediately.
insert into users (name, email, role, password_hash)
values
  ('Admin ManuGent', 'admin@manugent.pt', 'admin', crypt('Demo@2026', gen_salt('bf', 10))),
  ('Gestor Silva', 'gestor@manugent.pt', 'gestor', crypt('Demo@2026', gen_salt('bf', 10))),
  ('Tecnico Costa', 'tecnico@manugent.pt', 'tecnico', crypt('Demo@2026', gen_salt('bf', 10))),
  ('Cliente Demo', 'cliente@demo.pt', 'cliente', crypt('Demo@2026', gen_salt('bf', 10)))
on conflict (lower(email)) do update
  set password_hash = excluded.password_hash,
      role = excluded.role;
