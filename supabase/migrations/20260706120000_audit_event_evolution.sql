-- Evolves the audit contract without rewriting the approved foundation.

create type public.audit_action as enum (
  'audit.create',
  'bootstrap.execute',
  'bootstrap.denied',
  'profile.create',
  'profile.update',
  'admin_role.assign',
  'admin_role.remove',
  'admin_permission.assign',
  'admin_permission.remove'
);

drop function public.record_system_audit_event(
  text, text, text, text, uuid, uuid, text, jsonb, jsonb, jsonb
);
drop function app_private.write_audit_log(
  uuid, text, text, text, text, text, text, uuid, uuid, text,
  jsonb, jsonb, jsonb, inet, text
);

alter table public.audit_logs
  drop constraint audit_logs_action_format_check;
alter table public.audit_logs
  alter column action type public.audit_action
  using action::public.audit_action;
alter table public.audit_logs
  add column event_version smallint not null default 1,
  add constraint audit_logs_event_version_check check (event_version > 0);
alter table public.audit_logs
  rename column ip_address to request_ip;

comment on column public.audit_logs.event_version is
  'Version of the event payload contract. Consumers must default to version 1 semantics.';
comment on column public.audit_logs.request_ip is
  'Optional request IP. Collect only when justified, minimize retention, and never use it as authentication proof.';
comment on column public.audit_logs.user_agent is
  'Optional, untrusted request metadata. Collect only when operationally necessary and avoid fingerprinting.';

create or replace function app_private.write_audit_log(
  p_actor_id uuid,
  p_actor_type text,
  p_action public.audit_action,
  p_entity_type text,
  p_entity_id text default null,
  p_source text default 'database',
  p_outcome text default 'success',
  p_event_version smallint default 1,
  p_request_id uuid default null,
  p_correlation_id uuid default null,
  p_reason text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_metadata jsonb default '{}'::jsonb,
  p_request_ip inet default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_event_id uuid;
begin
  insert into public.audit_logs (
    actor_id, actor_type, action, entity_type, entity_id, source, outcome,
    event_version, request_id, correlation_id, reason, old_values, new_values,
    metadata, request_ip, user_agent
  ) values (
    p_actor_id, p_actor_type, p_action, p_entity_type, p_entity_id, p_source, p_outcome,
    p_event_version, p_request_id, p_correlation_id, p_reason, p_old_values, p_new_values,
    coalesce(p_metadata, '{}'::jsonb), p_request_ip, p_user_agent
  )
  returning event_id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function app_private.write_audit_log(
  uuid, text, public.audit_action, text, text, text, text, smallint,
  uuid, uuid, text, jsonb, jsonb, jsonb, inet, text
) from public, anon, authenticated, service_role;

create or replace function public.record_system_audit_event(
  p_action public.audit_action,
  p_entity_type text,
  p_entity_id text default null,
  p_outcome text default 'success',
  p_event_version smallint default 1,
  p_request_id uuid default null,
  p_correlation_id uuid default null,
  p_reason text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_metadata jsonb default '{}'::jsonb,
  p_request_ip inet default null,
  p_user_agent text default null
)
returns uuid
language sql
security definer
set search_path = pg_catalog
as $$
  select app_private.write_audit_log(
    null, 'service', p_action, p_entity_type, p_entity_id, 'edge_function', p_outcome,
    p_event_version, p_request_id, p_correlation_id, p_reason, p_old_values,
    p_new_values, p_metadata, p_request_ip, p_user_agent
  );
$$;

revoke all on function public.record_system_audit_event(
  public.audit_action, text, text, text, smallint, uuid, uuid, text,
  jsonb, jsonb, jsonb, inet, text
) from public, anon, authenticated;
grant execute on function public.record_system_audit_event(
  public.audit_action, text, text, text, smallint, uuid, uuid, text,
  jsonb, jsonb, jsonb, inet, text
) to service_role;
