-- Depends on 001_profiles only for media ownership metadata.

create type public.product_status as enum ('draft', 'active', 'archived');
create type public.variant_status as enum ('active', 'inactive', 'discontinued');
create type public.image_role as enum ('primary', 'hover', 'gallery');
create type public.option_display_type as enum ('text', 'color_swatch');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  seo_title text,
  seo_description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  deleted_at timestamptz,
  constraint categories_not_own_parent_check check (parent_id is null or parent_id <> id),
  constraint categories_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_name_length_check check (char_length(name) between 2 and 150),
  constraint categories_sort_order_check check (sort_order >= 0)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  deleted_at timestamptz,
  constraint brands_name_length_check check (char_length(name) between 2 and 150),
  constraint brands_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  deleted_at timestamptz,
  constraint collections_name_length_check check (char_length(name) between 2 and 150),
  constraint collections_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint collections_period_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands (id) on delete restrict,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_path text,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  deleted_at timestamptz,
  constraint products_name_length_check check (char_length(name) between 2 and 200),
  constraint products_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_publish_check check (status <> 'active' or published_at is not null)
);

create table public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  primary key (product_id, category_id),
  constraint product_categories_sort_check check (sort_order >= 0)
);

create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  primary key (collection_id, product_id),
  constraint collection_products_sort_check check (sort_order >= 0)
);

create table public.option_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  display_type public.option_display_type not null default 'text',
  sort_order integer not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  constraint option_types_code_check check (code ~ '^[a-z][a-z0-9_]*$'),
  constraint option_types_sort_check check (sort_order >= 0)
);

create table public.option_values (
  id uuid primary key default gen_random_uuid(),
  option_type_id uuid not null references public.option_types (id) on delete restrict,
  code text not null,
  value text not null,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  unique (option_type_id, code),
  constraint option_values_code_check check (code ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint option_values_value_length_check check (char_length(value) between 1 and 100),
  constraint option_values_metadata_check check (jsonb_typeof(metadata) = 'object'),
  constraint option_values_sort_check check (sort_order >= 0)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  sku text not null unique,
  barcode text unique,
  title text,
  price_amount bigint not null,
  compare_at_amount bigint,
  cost_amount bigint,
  currency text not null default 'BRL',
  weight_grams integer,
  status public.variant_status not null default 'active',
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  deleted_at timestamptz,
  constraint product_variants_sku_check check (sku = upper(sku) and sku ~ '^[A-Z0-9][A-Z0-9._-]*$'),
  constraint product_variants_price_check check (price_amount >= 0),
  constraint product_variants_compare_price_check
    check (compare_at_amount is null or compare_at_amount >= price_amount),
  constraint product_variants_cost_check check (cost_amount is null or cost_amount >= 0),
  constraint product_variants_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint product_variants_weight_check check (weight_grams is null or weight_grams > 0)
);

create table public.variant_option_values (
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  option_value_id uuid not null references public.option_values (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  primary key (variant_id, option_value_id)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  storage_bucket text not null default 'products',
  object_path text not null,
  alt_text text,
  role public.image_role not null default 'gallery',
  sort_order integer not null default 0,
  created_at timestamptz not null default statement_timestamp(),
  deleted_at timestamptz,
  unique (storage_bucket, object_path),
  constraint product_images_path_check check (object_path !~ '(^/|\.\.)'),
  constraint product_images_alt_length_check check (alt_text is null or char_length(alt_text) <= 500),
  constraint product_images_sort_check check (sort_order >= 0)
);

create unique index product_categories_one_primary_idx
  on public.product_categories (product_id) where is_primary;
create unique index product_images_one_primary_idx
  on public.product_images (product_id) where role = 'primary' and deleted_at is null and variant_id is null;
create unique index product_images_one_hover_idx
  on public.product_images (product_id) where role = 'hover' and deleted_at is null and variant_id is null;

insert into public.option_types (code, name, display_type, sort_order) values
  ('size', 'Tamanho', 'text', 10),
  ('color', 'Cor', 'color_swatch', 20);

create trigger categories_set_updated_at before update on public.categories
for each row execute function app_private.set_updated_at();
create trigger brands_set_updated_at before update on public.brands
for each row execute function app_private.set_updated_at();
create trigger collections_set_updated_at before update on public.collections
for each row execute function app_private.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function app_private.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants
for each row execute function app_private.set_updated_at();

create or replace function app_private.validate_category_hierarchy()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  if new.parent_id is null then return new; end if;
  if exists (
    with recursive descendants as (
      select id from public.categories where parent_id = new.id
      union all
      select category.id from public.categories category
      join descendants d on category.parent_id = d.id
    )
    select 1 from descendants where id = new.parent_id
  ) then
    raise exception using errcode = '23514', message = 'category hierarchy cycle detected';
  end if;
  return new;
end;
$$;

create or replace function app_private.validate_variant_option()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
declare v_type_id uuid;
begin
  select option_type_id into v_type_id from public.option_values where id = new.option_value_id;
  if exists (
    select 1 from public.variant_option_values existing
    join public.option_values value on value.id = existing.option_value_id
    where existing.variant_id = new.variant_id and value.option_type_id = v_type_id
  ) then
    raise exception using errcode = '23505', message = 'variant already has a value for this option type';
  end if;
  return new;
end;
$$;

create or replace function app_private.validate_product_image_variant()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  if new.variant_id is not null and not exists (
    select 1 from public.product_variants v
    where v.id = new.variant_id and v.product_id = new.product_id
  ) then
    raise exception using errcode = '23514', message = 'image variant must belong to the same product';
  end if;
  return new;
end;
$$;

create trigger categories_validate_hierarchy before insert or update of parent_id on public.categories
for each row execute function app_private.validate_category_hierarchy();
create trigger variant_options_validate before insert or update on public.variant_option_values
for each row execute function app_private.validate_variant_option();
create trigger product_images_validate_variant before insert or update on public.product_images
for each row execute function app_private.validate_product_image_variant();

revoke all on function app_private.validate_category_hierarchy() from public, anon, authenticated, service_role;
revoke all on function app_private.validate_variant_option() from public, anon, authenticated, service_role;
revoke all on function app_private.validate_product_image_variant() from public, anon, authenticated, service_role;
