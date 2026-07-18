-- Depends on 002_catalog (product_variants).

alter type public.audit_action add value if not exists 'inventory.adjust';

create type public.inventory_movement_type as enum (
  'initial', 'purchase', 'sale', 'return', 'adjustment',
  'reservation', 'release', 'transfer_in', 'transfer_out'
);

create table public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint stock_locations_code_check check (code ~ '^[A-Z][A-Z0-9_-]*$'),
  constraint stock_locations_name_length_check check (char_length(name) between 2 and 150)
);

create table public.inventory (
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  location_id uuid not null references public.stock_locations (id) on delete restrict,
  on_hand integer not null default 0,
  reserved integer not null default 0,
  version bigint not null default 1,
  updated_at timestamptz not null default statement_timestamp(),
  primary key (variant_id, location_id),
  constraint inventory_on_hand_check check (on_hand >= 0),
  constraint inventory_reserved_check check (reserved >= 0 and reserved <= on_hand),
  constraint inventory_version_check check (version > 0)
);

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  location_id uuid not null references public.stock_locations (id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  quantity_delta integer not null default 0,
  reservation_delta integer not null default 0,
  balance_on_hand integer not null,
  balance_reserved integer not null,
  reference_type text,
  reference_id uuid,
  idempotency_key text unique,
  reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default statement_timestamp(),
  constraint inventory_movements_delta_check
    check (quantity_delta <> 0 or reservation_delta <> 0),
  constraint inventory_movements_balance_check
    check (balance_on_hand >= 0 and balance_reserved >= 0 and balance_reserved <= balance_on_hand),
  constraint inventory_movements_reference_check
    check ((reference_type is null) = (reference_id is null)),
  constraint inventory_movements_reason_length_check
    check (reason is null or char_length(reason) <= 2000)
);

create unique index stock_locations_one_default_idx
  on public.stock_locations (is_default) where is_default and is_active;

create trigger stock_locations_set_updated_at before update on public.stock_locations
for each row execute function app_private.set_updated_at();

create or replace function app_private.reject_inventory_movement_mutation()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  raise exception using errcode = '55000', message = 'inventory_movements is append-only';
end;
$$;

create trigger inventory_movements_reject_update_delete
before update or delete on public.inventory_movements
for each row execute function app_private.reject_inventory_movement_mutation();

revoke all on function app_private.reject_inventory_movement_mutation()
from public, anon, authenticated, service_role;
