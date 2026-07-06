-- Minimal, append-only audit foundation for storefront and ERP mutations.

create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to postgres, service_role;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid(),
  occurred_at timestamptz not null default statement_timestamp(),
  actor_id uuid,
  actor_type text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  source text not null,
  outcome text not null default 'success',
  request_id uuid,
  correlation_id uuid,
  reason text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,

  constraint audit_logs_event_id_unique unique (event_id),
  constraint audit_logs_actor_type_check
    check (actor_type in ('admin', 'system', 'service')),
  constraint audit_logs_action_format_check
    check (action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint audit_logs_entity_type_format_check
    check (entity_type ~ '^[a-z][a-z0-9_]*$'),
  constraint audit_logs_source_check
    check (source in ('erp', 'edge_function', 'database', 'system')),
  constraint audit_logs_outcome_check
    check (outcome in ('success', 'failure', 'denied')),
  constraint audit_logs_reason_length_check
    check (reason is null or char_length(reason) <= 2000),
  constraint audit_logs_user_agent_length_check
    check (user_agent is null or char_length(user_agent) <= 1000),
  constraint audit_logs_old_values_object_check
    check (old_values is null or jsonb_typeof(old_values) = 'object'),
  constraint audit_logs_new_values_object_check
    check (new_values is null or jsonb_typeof(new_values) = 'object'),
  constraint audit_logs_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint audit_logs_admin_actor_check
    check (actor_type <> 'admin' or actor_id is not null),
  constraint audit_logs_system_actor_check
    check (actor_type = 'admin' or actor_id is null)
);

comment on table public.audit_logs is
  'Immutable security and business audit ledger. Payloads must never contain secrets, credentials, payment card data, or unnecessary personal data.';
comment on column public.audit_logs.actor_id is
  'Auth user UUID snapshot. Deliberately has no FK so identity survives auth user deletion.';
comment on column public.audit_logs.old_values is
  'Sanitized pre-mutation snapshot; secrets and unnecessary PII are forbidden.';
comment on column public.audit_logs.new_values is
  'Sanitized post-mutation snapshot; secrets and unnecessary PII are forbidden.';

create index audit_logs_occurred_at_brin
  on public.audit_logs using brin (occurred_at) with (pages_per_range = 64);
create index audit_logs_actor_timeline_idx
  on public.audit_logs (actor_id, occurred_at desc)
  where actor_id is not null;
create index audit_logs_entity_timeline_idx
  on public.audit_logs (entity_type, entity_id, occurred_at desc);
create index audit_logs_action_timeline_idx
  on public.audit_logs (action, occurred_at desc);
create index audit_logs_correlation_id_idx
  on public.audit_logs (correlation_id)
  where correlation_id is not null;
create index audit_logs_request_id_idx
  on public.audit_logs (request_id)
  where request_id is not null;

alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

revoke all on table public.audit_logs from public, anon, authenticated, service_role;
revoke all on sequence public.audit_logs_id_seq from public, anon, authenticated, service_role;

create or replace function app_private.reject_audit_log_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'audit_logs is append-only';
end;
$$;

revoke all on function app_private.reject_audit_log_mutation() from public, anon, authenticated, service_role;

create trigger audit_logs_reject_update_delete
before update or delete on public.audit_logs
for each row execute function app_private.reject_audit_log_mutation();

create or replace function app_private.write_audit_log(
  p_actor_id uuid,
  p_actor_type text,
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_source text default 'database',
  p_outcome text default 'success',
  p_request_id uuid default null,
  p_correlation_id uuid default null,
  p_reason text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_metadata jsonb default '{}'::jsonb,
  p_ip_address inet default null,
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
    request_id, correlation_id, reason, old_values, new_values, metadata,
    ip_address, user_agent
  ) values (
    p_actor_id, p_actor_type, p_action, p_entity_type, p_entity_id, p_source, p_outcome,
    p_request_id, p_correlation_id, p_reason, p_old_values, p_new_values,
    coalesce(p_metadata, '{}'::jsonb), p_ip_address, p_user_agent
  )
  returning event_id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function app_private.write_audit_log(
  uuid, text, text, text, text, text, text, uuid, uuid, text,
  jsonb, jsonb, jsonb, inet, text
) from public, anon, authenticated, service_role;

create or replace function public.record_system_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_outcome text default 'success',
  p_request_id uuid default null,
  p_correlation_id uuid default null,
  p_reason text default null,
  p_old_values jsonb default null,
  p_new_values jsonb default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security definer
set search_path = pg_catalog
as $$
  select app_private.write_audit_log(
    null,
    'service',
    p_action,
    p_entity_type,
    p_entity_id,
    'edge_function',
    p_outcome,
    p_request_id,
    p_correlation_id,
    p_reason,
    p_old_values,
    p_new_values,
    p_metadata,
    null,
    null
  );
$$;

revoke all on function public.record_system_audit_event(
  text, text, text, text, uuid, uuid, text, jsonb, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.record_system_audit_event(
  text, text, text, text, uuid, uuid, text, jsonb, jsonb, jsonb
) to service_role;

comment on function public.record_system_audit_event(
  text, text, text, text, uuid, uuid, text, jsonb, jsonb, jsonb
) is 'Service-role-only audit entry point for trusted Edge Functions. Payloads must be sanitized by the caller.';
