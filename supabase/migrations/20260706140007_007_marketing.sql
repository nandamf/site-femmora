-- Depends on profiles, catalog and orders.

create type public.coupon_discount_type as enum ('percentage', 'fixed_amount', 'free_shipping');
create type public.newsletter_status as enum ('pending', 'subscribed', 'unsubscribed');
create type public.banner_status as enum ('draft', 'active', 'archived');

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type public.coupon_discount_type not null,
  discount_value bigint not null default 0,
  currency text not null default 'BRL',
  minimum_order_amount bigint not null default 0,
  maximum_discount_amount bigint,
  usage_limit_total integer,
  usage_limit_per_profile integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  deleted_at timestamptz,
  constraint coupons_code_check check (code = upper(code) and code ~ '^[A-Z0-9_-]+$'),
  constraint coupons_value_check check (
    (discount_type = 'percentage' and discount_value between 1 and 10000)
    or (discount_type = 'fixed_amount' and discount_value > 0)
    or (discount_type = 'free_shipping' and discount_value = 0)
  ),
  constraint coupons_amounts_check check (
    minimum_order_amount >= 0 and (maximum_discount_amount is null or maximum_discount_amount > 0)
  ),
  constraint coupons_limits_check check (
    (usage_limit_total is null or usage_limit_total > 0)
    and (usage_limit_per_profile is null or usage_limit_per_profile > 0)
  ),
  constraint coupons_period_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.coupon_products (
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (coupon_id, product_id)
);

create table public.coupon_categories (
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (coupon_id, category_id)
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete restrict,
  profile_id uuid references public.profiles (id) on delete set null,
  order_id uuid not null unique references public.orders (id) on delete restrict,
  discount_amount bigint not null,
  redeemed_at timestamptz not null default statement_timestamp(),
  constraint coupon_redemptions_amount_check check (discount_amount >= 0)
);

create table public.favorites (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default statement_timestamp(),
  primary key (profile_id, product_id)
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  profile_id uuid references public.profiles (id) on delete set null,
  status public.newsletter_status not null default 'pending',
  source text not null default 'storefront',
  consent_at timestamptz not null,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint newsletter_email_length_check check (char_length(email) between 3 and 320),
  constraint newsletter_source_check check (source ~ '^[a-z][a-z0-9_-]*$'),
  constraint newsletter_status_dates_check check (
    (status <> 'subscribed' or confirmed_at is not null)
    and (status <> 'unsubscribed' or unsubscribed_at is not null)
  )
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  placement text not null,
  title text,
  subtitle text,
  cta_label text,
  cta_url text,
  desktop_image_path text not null,
  mobile_image_path text,
  status public.banner_status not null default 'draft',
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  deleted_at timestamptz,
  constraint banners_name_length_check check (char_length(name) between 2 and 150),
  constraint banners_placement_check check (placement ~ '^[a-z][a-z0-9_-]*$'),
  constraint banners_paths_check check (desktop_image_path !~ '(^/|\.\.)'),
  constraint banners_sort_check check (sort_order >= 0),
  constraint banners_period_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create trigger coupons_set_updated_at before update on public.coupons
for each row execute function app_private.set_updated_at();
create trigger newsletter_set_updated_at before update on public.newsletter_subscribers
for each row execute function app_private.set_updated_at();
create trigger banners_set_updated_at before update on public.banners
for each row execute function app_private.set_updated_at();

create trigger coupon_redemptions_reject_update_delete before update or delete on public.coupon_redemptions
for each row execute function app_private.reject_immutable_row_mutation();
