-- Depends on 001_profiles and 002_catalog.

create type public.cart_status as enum ('active', 'converted', 'abandoned', 'expired');

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  guest_token_hash text,
  status public.cart_status not null default 'active',
  currency text not null default 'BRL',
  expires_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint carts_owner_check check (profile_id is not null or guest_token_hash is not null),
  constraint carts_guest_hash_check
    check (guest_token_hash is null or guest_token_hash ~ '^[a-f0-9]{64}$'),
  constraint carts_currency_check check (currency ~ '^[A-Z]{3}$')
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  quantity integer not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (cart_id, variant_id),
  constraint cart_items_quantity_check check (quantity between 1 and 999)
);

create unique index carts_one_active_profile_idx
  on public.carts (profile_id, currency)
  where status = 'active' and profile_id is not null;
create unique index carts_guest_token_idx
  on public.carts (guest_token_hash) where guest_token_hash is not null;

create trigger carts_set_updated_at before update on public.carts
for each row execute function app_private.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items
for each row execute function app_private.set_updated_at();
