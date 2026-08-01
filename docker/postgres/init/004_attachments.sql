-- 004_attachments.sql
-- Tabela de anexos/ficheiros associados automaticamente a OTs, equipamentos,
-- instalações e clientes. Elimina a necessidade de modais de criação de pasta.

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('work_order', 'equipment', 'client', 'installation')),
  entity_id uuid not null,
  filename text not null,
  original_name text not null,
  mime_type text not null default 'application/octet-stream',
  file_size bigint not null default 0,
  storage_path text not null,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index if not exists attachments_entity_idx
  on attachments (entity_type, entity_id);

create index if not exists attachments_created_at_idx
  on attachments (created_at desc);

-- RPC para listar anexos de uma entidade
create or replace function get_attachments(p_entity_type text, p_entity_id uuid)
returns table (
  id uuid,
  entity_type text,
  entity_id uuid,
  filename text,
  original_name text,
  mime_type text,
  file_size bigint,
  storage_path text,
  uploaded_by uuid,
  uploader_name text,
  created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select
    a.id, a.entity_type, a.entity_id,
    a.filename, a.original_name, a.mime_type, a.file_size,
    a.storage_path, a.uploaded_by,
    u.name as uploader_name,
    a.created_at
  from attachments a
  left join users u on u.id = a.uploaded_by
  where a.entity_type = p_entity_type
    and a.entity_id = p_entity_id
  order by a.created_at desc;
end;
$$;
