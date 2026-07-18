-- Store configuration only. Secrets are forbidden.

create table public.settings (
  key text primary key,
  value jsonb not null,
  value_version smallint not null default 1,
  is_public boolean not null default false,
  description text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default statement_timestamp(),
  constraint settings_key_check check (key ~ '^[a-z][a-z0-9_.-]*$'),
  constraint settings_version_check check (value_version > 0),
  constraint settings_description_check check (description is null or char_length(description) <= 1000)
);

comment on table public.settings is
  'Non-secret versioned store configuration. API keys, tokens and provider credentials are forbidden.';

create trigger settings_set_updated_at before update on public.settings
for each row execute function app_private.set_updated_at();
