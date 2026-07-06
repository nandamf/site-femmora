-- Administrative profiles, RBAC, protected access and first-admin bootstrap RPC.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_path text,
  status text not null default 'active',
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint profiles_full_name_length_check
    check (full_name is null or char_length(full_name) between 1 and 200),
  constraint profiles_avatar_path_length_check
    check (avatar_path is null or char_length(avatar_path) <= 1000),
  constraint profiles_status_check check (status in ('active', 'suspended'))
);

create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  constraint admin_roles_code_format_check check (code ~ '^[a-z][a-z0-9_]*$'),
  constraint admin_roles_name_length_check check (char_length(name) between 2 and 100)
);

create table public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  module text not null,
  description text not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint admin_permissions_code_format_check
    check (code ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  constraint admin_permissions_module_format_check check (module ~ '^[a-z][a-z0-9_]*$')
);

create table public.admin_role_permissions (
  role_id uuid not null references public.admin_roles (id) on delete cascade,
  permission_id uuid not null references public.admin_permissions (id) on delete cascade,
  created_at timestamptz not null default statement_timestamp(),
  primary key (role_id, permission_id)
);

create table public.admin_user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.admin_roles (id) on delete restrict,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default statement_timestamp(),
  primary key (user_id, role_id)
);

create index admin_role_permissions_permission_idx
  on public.admin_role_permissions (permission_id, role_id);
create index admin_user_roles_role_idx
  on public.admin_user_roles (role_id, user_id);
create index profiles_status_idx on public.profiles (status) where status <> 'active';

alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_user_roles enable row level security;

alter table public.profiles force row level security;
alter table public.admin_roles force row level security;
alter table public.admin_permissions force row level security;
alter table public.admin_role_permissions force row level security;
alter table public.admin_user_roles force row level security;

revoke all on table public.profiles from public, anon, authenticated, service_role;
revoke all on table public.admin_roles from public, anon, authenticated, service_role;
revoke all on table public.admin_permissions from public, anon, authenticated, service_role;
revoke all on table public.admin_role_permissions from public, anon, authenticated, service_role;
revoke all on table public.admin_user_roles from public, anon, authenticated, service_role;

grant select (id, full_name, avatar_path, status, created_at, updated_at),
  update (full_name, avatar_path) on public.profiles to authenticated;

create policy profiles_select_own
on public.profiles for select to authenticated
using (id = auth.uid());

create policy profiles_update_own
on public.profiles for update to authenticated
using (id = auth.uid() and status = 'active')
with check (id = auth.uid() and status = 'active');

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke all on function app_private.set_updated_at() from public, anon, authenticated, service_role;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

create or replace function app_private.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function app_private.create_profile_for_auth_user() from public, anon, authenticated, service_role;

create trigger auth_user_create_profile
after insert on auth.users
for each row execute function app_private.create_profile_for_auth_user();

insert into public.profiles (id, full_name, created_at)
select id, nullif(btrim(raw_user_meta_data ->> 'full_name'), ''), created_at
from auth.users
on conflict (id) do nothing;

insert into public.admin_roles (code, name, description) values
  ('superadmin', 'Superadministrador', 'Controle integral da administração.'),
  ('manager', 'Gerente', 'Gestão operacional ampla.'),
  ('catalog', 'Catálogo', 'Gestão de catálogo.'),
  ('inventory', 'Estoque', 'Gestão de estoque.'),
  ('support', 'Atendimento', 'Atendimento e pedidos.'),
  ('finance', 'Financeiro', 'Pagamentos e financeiro.'),
  ('marketing', 'Marketing', 'Campanhas e conteúdo.'),
  ('auditor', 'Auditor', 'Acesso administrativo somente leitura.');

insert into public.admin_permissions (code, module, description) values
  ('admin.access', 'admin', 'Acessar a área administrativa.'),
  ('admins.manage', 'admin', 'Atribuir e remover papéis administrativos.'),
  ('roles.manage', 'admin', 'Gerenciar papéis e permissões.'),
  ('audit.read', 'audit', 'Consultar eventos de auditoria.');

insert into public.admin_role_permissions (role_id, permission_id)
select r.id, p.id
from public.admin_roles r
cross join public.admin_permissions p
where r.code = 'superadmin'
   or (r.code = 'manager' and p.code in ('admin.access', 'audit.read'))
   or (r.code in ('catalog', 'inventory', 'support', 'finance', 'marketing', 'auditor')
       and p.code = 'admin.access')
   or (r.code = 'auditor' and p.code = 'audit.read');

create or replace function app_private.has_admin_permission(p_user_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.admin_user_roles ur on ur.user_id = profile.id
    join public.admin_role_permissions rp on rp.role_id = ur.role_id
    join public.admin_permissions permission on permission.id = rp.permission_id
    where profile.id = p_user_id
      and profile.status = 'active'
      and permission.code = p_permission
  );
$$;

revoke all on function app_private.has_admin_permission(uuid, text)
  from public, anon, authenticated, service_role;

create policy audit_logs_admin_read
on public.audit_logs for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'audit.read'));
grant select on public.audit_logs to authenticated;

create or replace function public.get_my_admin_access()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'isAdmin', app_private.has_admin_permission(auth.uid(), 'admin.access'),
    'roles', coalesce((
      select jsonb_agg(distinct role.code order by role.code)
      from public.admin_user_roles ur
      join public.admin_roles role on role.id = ur.role_id
      join public.profiles profile on profile.id = ur.user_id
      where ur.user_id = auth.uid() and profile.status = 'active'
    ), '[]'::jsonb),
    'permissions', coalesce((
      select jsonb_agg(distinct permission.code order by permission.code)
      from public.admin_user_roles ur
      join public.admin_role_permissions rp on rp.role_id = ur.role_id
      join public.admin_permissions permission on permission.id = rp.permission_id
      join public.profiles profile on profile.id = ur.user_id
      where ur.user_id = auth.uid() and profile.status = 'active'
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_my_admin_access() from public, anon;
grant execute on function public.get_my_admin_access() to authenticated;

create or replace function public.bootstrap_first_superadmin(
  p_email text,
  p_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_user_id uuid;
  v_role_id uuid;
  v_existing_count integer;
  v_result text;
begin
  perform pg_advisory_xact_lock(hashtext('femmora:first-superadmin'));

  select id into v_role_id from public.admin_roles where code = 'superadmin';
  select count(*) into v_existing_count
  from public.admin_user_roles where role_id = v_role_id;

  if v_existing_count > 0 then
    perform app_private.write_audit_log(
      null, 'service', 'bootstrap.denied', 'admin_role', null, 'edge_function',
      'denied', 1::smallint, p_request_id, null, 'A superadministrator already exists.'
    );
    return jsonb_build_object('status', 'already_bootstrapped');
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(btrim(p_email)) and email_confirmed_at is not null
  limit 1;

  if v_user_id is null then
    perform app_private.write_audit_log(
      null, 'service', 'bootstrap.denied', 'admin_role', null, 'edge_function',
      'denied', 1::smallint, p_request_id, null, 'Confirmed target user not found.'
    );
    return jsonb_build_object('status', 'user_not_found');
  end if;

  insert into public.admin_user_roles (user_id, role_id, assigned_by)
  values (v_user_id, v_role_id, null)
  on conflict (user_id, role_id) do nothing;

  perform app_private.write_audit_log(
    null, 'service', 'bootstrap.execute', 'admin_role', v_user_id::text,
    'edge_function', 'success', 1::smallint, p_request_id, null, 'First superadministrator assigned.',
    null, jsonb_build_object('role', 'superadmin')
  );

  return jsonb_build_object('status', 'created', 'userId', v_user_id);
end;
$$;

revoke all on function public.bootstrap_first_superadmin(text, uuid)
  from public, anon, authenticated;
grant execute on function public.bootstrap_first_superadmin(text, uuid) to service_role;

create or replace function public.assign_admin_role(
  p_user_id uuid,
  p_role_code text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_role_id uuid;
begin
  if not app_private.has_admin_permission(auth.uid(), 'admins.manage') then
    raise exception using errcode = '42501', message = 'insufficient_admin_permission';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception using errcode = '22023', message = 'reason_required';
  end if;

  select id into v_role_id from public.admin_roles where code = p_role_code;
  if v_role_id is null then
    raise exception using errcode = '22023', message = 'role_not_found';
  end if;

  insert into public.admin_user_roles (user_id, role_id, assigned_by)
  values (p_user_id, v_role_id, auth.uid())
  on conflict (user_id, role_id) do nothing;

  perform app_private.write_audit_log(
    auth.uid(), 'admin', 'admin_role.assign', 'admin_role', p_user_id::text,
    'erp', 'success', 1::smallint, null, null, p_reason, null,
    jsonb_build_object('role', p_role_code)
  );
end;
$$;

create or replace function public.remove_admin_role(
  p_user_id uuid,
  p_role_code text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_role_id uuid;
  v_superadmin_count integer;
begin
  if not app_private.has_admin_permission(auth.uid(), 'admins.manage') then
    raise exception using errcode = '42501', message = 'insufficient_admin_permission';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception using errcode = '22023', message = 'reason_required';
  end if;

  perform pg_advisory_xact_lock(hashtext('femmora:superadmin-role'));
  select id into v_role_id from public.admin_roles where code = p_role_code;
  if v_role_id is null then
    raise exception using errcode = '22023', message = 'role_not_found';
  end if;

  if p_role_code = 'superadmin' then
    if p_user_id = auth.uid() then
      raise exception using errcode = '42501', message = 'cannot_remove_own_superadmin_role';
    end if;
    select count(*) into v_superadmin_count
    from public.admin_user_roles where role_id = v_role_id;
    if v_superadmin_count <= 1 then
      raise exception using errcode = '55000', message = 'last_superadmin_cannot_be_removed';
    end if;
  end if;

  delete from public.admin_user_roles where user_id = p_user_id and role_id = v_role_id;
  perform app_private.write_audit_log(
    auth.uid(), 'admin', 'admin_role.remove', 'admin_role', p_user_id::text,
    'erp', 'success', 1::smallint, null, null, p_reason,
    jsonb_build_object('role', p_role_code), null
  );
end;
$$;

revoke all on function public.assign_admin_role(uuid, text, text) from public, anon;
revoke all on function public.remove_admin_role(uuid, text, text) from public, anon;
grant execute on function public.assign_admin_role(uuid, text, text) to authenticated;
grant execute on function public.remove_admin_role(uuid, text, text) to authenticated;
