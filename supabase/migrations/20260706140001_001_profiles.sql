-- Depends on 20260706130000_rbac.sql (public.profiles).

alter table public.profiles
  add column phone text,
  add column birth_date date,
  add column marketing_consent boolean not null default false,
  add column marketing_consent_at timestamptz,
  add constraint profiles_phone_length_check
    check (phone is null or char_length(phone) between 8 and 30),
  add constraint profiles_birth_date_check
    check (birth_date is null or birth_date <= current_date),
  add constraint profiles_marketing_consent_check
    check ((marketing_consent and marketing_consent_at is not null)
      or (not marketing_consent));

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Endereço',
  recipient_name text not null,
  phone text,
  postal_code text not null,
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state_code text not null,
  country_code text not null default 'BR',
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  deleted_at timestamptz,
  constraint addresses_label_length_check check (char_length(label) between 1 and 80),
  constraint addresses_recipient_length_check check (char_length(recipient_name) between 2 and 200),
  constraint addresses_phone_length_check check (phone is null or char_length(phone) between 8 and 30),
  constraint addresses_postal_code_check check (postal_code ~ '^[0-9]{5}-?[0-9]{3}$'),
  constraint addresses_state_code_check check (state_code ~ '^[A-Z]{2}$'),
  constraint addresses_country_code_check check (country_code ~ '^[A-Z]{2}$')
);

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function app_private.set_updated_at();

comment on table public.addresses is
  'Mutable customer address book. Orders copy immutable address snapshots and never depend on this table.';
