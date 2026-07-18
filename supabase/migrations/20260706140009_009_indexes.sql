-- Depends on all domain tables (001-008). Query-path indexes only.

create unique index addresses_default_shipping_idx
  on public.addresses (profile_id) where is_default_shipping and deleted_at is null;
create unique index addresses_default_billing_idx
  on public.addresses (profile_id) where is_default_billing and deleted_at is null;
create index addresses_profile_idx on public.addresses (profile_id, created_at desc)
  where deleted_at is null;

create index categories_parent_sort_idx on public.categories (parent_id, sort_order)
  where deleted_at is null;
create index brands_active_name_idx on public.brands (is_active, name)
  where deleted_at is null;
create index collections_active_period_idx on public.collections (is_active, starts_at, ends_at)
  where deleted_at is null;
create index products_status_published_idx on public.products (status, published_at desc)
  where deleted_at is null;
create index products_brand_idx on public.products (brand_id, status)
  where deleted_at is null;
create index product_categories_category_idx
  on public.product_categories (category_id, sort_order, product_id);
create index collection_products_order_idx
  on public.collection_products (collection_id, sort_order, product_id);
create index product_variants_product_status_idx
  on public.product_variants (product_id, status) where deleted_at is null;
create index variant_option_values_value_idx
  on public.variant_option_values (option_value_id, variant_id);
create index product_images_product_order_idx
  on public.product_images (product_id, sort_order) where deleted_at is null;
create index product_images_variant_order_idx
  on public.product_images (variant_id, sort_order)
  where variant_id is not null and deleted_at is null;

create index inventory_location_idx on public.inventory (location_id, variant_id);
create index inventory_available_idx on public.inventory (variant_id, location_id)
  where on_hand > reserved;
create index inventory_movements_variant_timeline_idx
  on public.inventory_movements (variant_id, created_at desc);
create index inventory_movements_location_timeline_idx
  on public.inventory_movements (location_id, created_at desc);
create index inventory_movements_reference_idx
  on public.inventory_movements (reference_type, reference_id)
  where reference_id is not null;
create index inventory_movements_created_at_brin
  on public.inventory_movements using brin (created_at) with (pages_per_range = 64);

create index carts_status_expiration_idx on public.carts (status, expires_at)
  where status in ('active', 'abandoned');
create index cart_items_variant_idx on public.cart_items (variant_id, cart_id);

create index orders_profile_timeline_idx on public.orders (profile_id, created_at desc)
  where profile_id is not null;
create index orders_status_timeline_idx on public.orders (status, created_at desc);
create index orders_email_timeline_idx on public.orders (lower(customer_email), created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_timeline_idx on public.order_items (variant_id, created_at desc)
  where variant_id is not null;
create index order_items_sku_idx on public.order_items (sku_snapshot);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

create index payments_order_timeline_idx on public.payments (order_id, created_at desc);
create unique index payments_provider_id_idx on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;
create index payments_status_updated_idx on public.payments (status, updated_at);

create index coupons_active_period_idx on public.coupons (is_active, starts_at, ends_at)
  where deleted_at is null;
create index coupon_products_product_idx on public.coupon_products (product_id, coupon_id);
create index coupon_categories_category_idx on public.coupon_categories (category_id, coupon_id);
create index coupon_redemptions_coupon_timeline_idx
  on public.coupon_redemptions (coupon_id, redeemed_at desc);
create index coupon_redemptions_profile_idx
  on public.coupon_redemptions (coupon_id, profile_id)
  where profile_id is not null;
create index favorites_product_idx on public.favorites (product_id, created_at desc);
create index newsletter_status_created_idx on public.newsletter_subscribers (status, created_at);
create index banners_placement_schedule_idx
  on public.banners (placement, status, starts_at, ends_at, sort_order)
  where deleted_at is null;

comment on index public.inventory_movements_created_at_brin is
  'Low-overhead chronological index for the append-only stock ledger.';
comment on index public.orders_profile_timeline_idx is
  'Supports customer order history without scanning the global order table.';
comment on index public.product_categories_category_idx is
  'Supports category storefront listings ordered by merchandising position.';
