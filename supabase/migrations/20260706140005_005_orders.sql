-- Depends on profiles, catalog and carts. Creates immutable commercial snapshots.

create type public.order_status as enum (
  'pending', 'awaiting_payment', 'paid', 'processing',
  'shipped', 'delivered', 'cancelled', 'refunded'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  profile_id uuid references public.profiles (id) on delete set null,
  cart_id uuid references public.carts (id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  status public.order_status not null default 'pending',
  currency text not null default 'BRL',
  items_subtotal_amount bigint not null,
  discount_amount bigint not null default 0,
  shipping_amount bigint not null default 0,
  tax_amount bigint not null default 0,
  total_amount bigint not null,
  coupon_code_snapshot text,
  shipping_method_snapshot jsonb not null default '{}'::jsonb,
  shipping_address_snapshot jsonb not null,
  billing_address_snapshot jsonb not null,
  customer_notes text,
  placed_at timestamptz not null default statement_timestamp(),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint orders_email_length_check check (char_length(customer_email) between 3 and 320),
  constraint orders_customer_name_check check (char_length(customer_name) between 2 and 200),
  constraint orders_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint orders_amounts_check check (
    items_subtotal_amount >= 0 and discount_amount >= 0 and shipping_amount >= 0
    and tax_amount >= 0 and total_amount >= 0
  ),
  constraint orders_total_check check (
    total_amount = items_subtotal_amount - discount_amount + shipping_amount + tax_amount
    and discount_amount <= items_subtotal_amount
  ),
  constraint orders_shipping_method_object_check check (jsonb_typeof(shipping_method_snapshot) = 'object'),
  constraint orders_shipping_address_object_check check (jsonb_typeof(shipping_address_snapshot) = 'object'),
  constraint orders_billing_address_object_check check (jsonb_typeof(billing_address_snapshot) = 'object'),
  constraint orders_notes_length_check check (customer_notes is null or char_length(customer_notes) <= 2000)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  sku_snapshot text not null,
  image_snapshot jsonb,
  attributes_snapshot jsonb not null default '{}'::jsonb,
  unit_price_amount bigint not null,
  unit_discount_amount bigint not null default 0,
  quantity integer not null,
  line_total_amount bigint not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint order_items_name_check check (char_length(product_name_snapshot) between 2 and 200),
  constraint order_items_sku_check check (char_length(sku_snapshot) between 1 and 100),
  constraint order_items_image_object_check check (image_snapshot is null or jsonb_typeof(image_snapshot) = 'object'),
  constraint order_items_attributes_object_check check (jsonb_typeof(attributes_snapshot) = 'object'),
  constraint order_items_amounts_check check (
    unit_price_amount >= 0 and unit_discount_amount >= 0
    and unit_discount_amount <= unit_price_amount and line_total_amount >= 0
  ),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_total_check check (
    line_total_amount = (unit_price_amount - unit_discount_amount) * quantity
  )
);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  order_id uuid not null references public.orders (id) on delete restrict,
  from_status public.order_status,
  to_status public.order_status not null,
  reason text,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default statement_timestamp(),
  constraint order_status_history_transition_check check (from_status is null or from_status <> to_status),
  constraint order_status_history_reason_check check (reason is null or char_length(reason) <= 2000)
);

create or replace function app_private.protect_order_snapshot()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  if row(
    new.profile_id, new.cart_id, new.customer_email, new.customer_name, new.currency,
    new.items_subtotal_amount, new.discount_amount, new.shipping_amount, new.tax_amount,
    new.total_amount, new.coupon_code_snapshot, new.shipping_method_snapshot,
    new.shipping_address_snapshot, new.billing_address_snapshot, new.placed_at, new.created_at
  ) is distinct from row(
    old.profile_id, old.cart_id, old.customer_email, old.customer_name, old.currency,
    old.items_subtotal_amount, old.discount_amount, old.shipping_amount, old.tax_amount,
    old.total_amount, old.coupon_code_snapshot, old.shipping_method_snapshot,
    old.shipping_address_snapshot, old.billing_address_snapshot, old.placed_at, old.created_at
  ) then
    raise exception using errcode = '55000', message = 'order commercial snapshot is immutable';
  end if;
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create or replace function app_private.reject_immutable_row_mutation()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  raise exception using errcode = '55000', message = format('%s is immutable', tg_table_name);
end;
$$;

create trigger orders_protect_snapshot before update on public.orders
for each row execute function app_private.protect_order_snapshot();
create trigger orders_reject_delete before delete on public.orders
for each row execute function app_private.reject_immutable_row_mutation();
create trigger order_items_reject_update_delete before update or delete on public.order_items
for each row execute function app_private.reject_immutable_row_mutation();
create trigger order_status_history_reject_update_delete before update or delete on public.order_status_history
for each row execute function app_private.reject_immutable_row_mutation();

revoke all on function app_private.protect_order_snapshot() from public, anon, authenticated, service_role;
revoke all on function app_private.reject_immutable_row_mutation() from public, anon, authenticated, service_role;
