-- Depends on 009_indexes and 010_rls. Views use invoker security so base RLS remains authoritative.

create view public.admin_inventory_summary
with (security_invoker = true)
as
select
  variant.id as variant_id,
  variant.sku,
  product.id as product_id,
  product.name as product_name,
  variant.title as variant_title,
  location.id as location_id,
  location.name as location_name,
  inventory.on_hand,
  inventory.reserved,
  inventory.on_hand - inventory.reserved as available,
  inventory.updated_at
from public.inventory inventory
join public.product_variants variant on variant.id = inventory.variant_id
join public.products product on product.id = variant.product_id
join public.stock_locations location on location.id = inventory.location_id;

create view public.admin_order_summary
with (security_invoker = true)
as
select
  orders.id,
  orders.order_number,
  orders.profile_id,
  orders.customer_name,
  orders.customer_email,
  orders.status,
  orders.currency,
  orders.total_amount,
  orders.placed_at,
  count(order_items.id)::integer as item_count,
  coalesce(sum(order_items.quantity), 0)::integer as unit_count
from public.orders orders
left join public.order_items order_items on order_items.order_id = orders.id
group by orders.id;

revoke all on public.admin_inventory_summary, public.admin_order_summary from public, anon;
grant select on public.admin_inventory_summary, public.admin_order_summary to authenticated;

comment on view public.admin_inventory_summary is
  'Administrative stock projection; security_invoker preserves inventory and catalog RLS.';
comment on view public.admin_order_summary is
  'Administrative order list projection; security_invoker preserves order RLS.';
