-- Depends on 001-009 and the RBAC helper app_private.has_admin_permission.

grant usage on schema app_private to authenticated;
grant execute on function app_private.has_admin_permission(uuid, text) to authenticated;

insert into public.admin_permissions (code, module, description) values
  ('profiles.read', 'profiles', 'Consultar perfis e endereços de clientes.'),
  ('catalog.read', 'catalog', 'Consultar dados administrativos do catálogo.'),
  ('catalog.write', 'catalog', 'Gerenciar o catálogo.'),
  ('inventory.read', 'inventory', 'Consultar estoque e movimentações.'),
  ('inventory.adjust', 'inventory', 'Ajustar estoque com justificativa.'),
  ('carts.read', 'carts', 'Consultar carrinhos para suporte.'),
  ('orders.read', 'orders', 'Consultar todos os pedidos.'),
  ('orders.manage', 'orders', 'Gerenciar o ciclo operacional dos pedidos.'),
  ('payments.read', 'payments', 'Consultar pagamentos.'),
  ('payments.manage', 'payments', 'Gerenciar operações financeiras.'),
  ('marketing.manage', 'marketing', 'Gerenciar campanhas e conteúdo.'),
  ('settings.manage', 'settings', 'Gerenciar configurações não secretas.')
on conflict (code) do nothing;

insert into public.admin_role_permissions (role_id, permission_id)
select role.id, permission.id
from public.admin_roles role
cross join public.admin_permissions permission
where role.code = 'superadmin'
   or (role.code = 'manager' and permission.code in (
     'profiles.read', 'catalog.read', 'catalog.write', 'inventory.read', 'inventory.adjust',
     'carts.read', 'orders.read', 'orders.manage', 'payments.read', 'marketing.manage', 'settings.manage'
   ))
   or (role.code = 'catalog' and permission.code in ('catalog.read', 'catalog.write'))
   or (role.code = 'inventory' and permission.code in ('catalog.read', 'inventory.read', 'inventory.adjust'))
   or (role.code = 'support' and permission.code in ('profiles.read', 'carts.read', 'orders.read', 'orders.manage'))
   or (role.code = 'finance' and permission.code in ('orders.read', 'payments.read', 'payments.manage'))
   or (role.code = 'marketing' and permission.code in ('catalog.read', 'marketing.manage'))
   or (role.code = 'auditor' and permission.code in (
     'profiles.read', 'catalog.read', 'inventory.read', 'carts.read', 'orders.read', 'payments.read'
   ))
on conflict do nothing;

grant select on public.profiles to authenticated;
grant update (full_name, avatar_path, phone, birth_date, marketing_consent, marketing_consent_at)
  on public.profiles to authenticated;
create policy profiles_admin_read on public.profiles for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'profiles.read'));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'addresses', 'categories', 'brands', 'collections', 'products', 'product_categories',
    'collection_products', 'option_types', 'option_values', 'product_variants',
    'variant_option_values', 'product_images', 'stock_locations', 'inventory',
    'inventory_movements', 'carts', 'cart_items', 'orders', 'order_items',
    'order_status_history', 'payments', 'coupons', 'coupon_products',
    'coupon_categories', 'coupon_redemptions', 'favorites', 'newsletter_subscribers',
    'banners', 'settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', table_name);
  end loop;
end;
$$;

grant select, insert, update, delete on public.addresses to authenticated;
create policy addresses_owner_all on public.addresses for all to authenticated
using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy addresses_admin_read on public.addresses for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'profiles.read'));

grant select on public.categories, public.brands, public.collections, public.products,
  public.product_categories, public.collection_products, public.option_types,
  public.option_values, public.product_variants, public.variant_option_values,
  public.product_images to anon, authenticated;

create policy categories_public_read on public.categories for select to anon, authenticated
using (is_active and deleted_at is null);
create policy brands_public_read on public.brands for select to anon, authenticated
using (is_active and deleted_at is null);
create policy collections_public_read on public.collections for select to anon, authenticated
using (is_active and deleted_at is null and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy products_public_read on public.products for select to anon, authenticated
using (status = 'active' and deleted_at is null and published_at <= now());
create policy product_categories_public_read on public.product_categories for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.deleted_at is null));
create policy collection_products_public_read on public.collection_products for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.deleted_at is null));
create policy option_types_public_read on public.option_types for select to anon, authenticated using (true);
create policy option_values_public_read on public.option_values for select to anon, authenticated using (true);
create policy product_variants_public_read on public.product_variants for select to anon, authenticated
using (status = 'active' and deleted_at is null and exists (
  select 1 from public.products p where p.id = product_id and p.status = 'active' and p.deleted_at is null
));
create policy variant_options_public_read on public.variant_option_values for select to anon, authenticated
using (exists (select 1 from public.product_variants v where v.id = variant_id and v.status = 'active' and v.deleted_at is null));
create policy product_images_public_read on public.product_images for select to anon, authenticated
using (deleted_at is null and exists (
  select 1 from public.products p where p.id = product_id and p.status = 'active' and p.deleted_at is null
));

grant select, insert, update, delete on public.categories, public.brands, public.collections, public.products,
  public.product_categories, public.collection_products, public.option_types,
  public.option_values, public.product_variants, public.variant_option_values,
  public.product_images to authenticated;

do $$
declare t text;
begin
  foreach t in array array['categories','brands','collections','products','product_categories',
    'collection_products','option_types','option_values','product_variants','variant_option_values','product_images'] loop
    execute format('create policy %I on public.%I for all to authenticated using (app_private.has_admin_permission(auth.uid(), ''catalog.write'')) with check (app_private.has_admin_permission(auth.uid(), ''catalog.write''))', t || '_admin_write', t);
  end loop;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['categories','brands','collections','products','product_categories',
    'collection_products','option_types','option_values','product_variants','variant_option_values','product_images'] loop
    execute format('create policy %I on public.%I for select to authenticated using (app_private.has_admin_permission(auth.uid(), ''catalog.read''))', t || '_admin_read', t);
  end loop;
end;
$$;

grant select on public.stock_locations, public.inventory, public.inventory_movements to authenticated;
create policy stock_locations_admin_read on public.stock_locations for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'inventory.read'));
create policy inventory_admin_read on public.inventory for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'inventory.read'));
create policy inventory_movements_admin_read on public.inventory_movements for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'inventory.read'));

grant select, insert, update, delete on public.carts, public.cart_items to authenticated;
create policy carts_owner_all on public.carts for all to authenticated
using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy carts_admin_read on public.carts for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'carts.read'));
create policy cart_items_owner_all on public.cart_items for all to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and c.profile_id = auth.uid()))
with check (exists (select 1 from public.carts c where c.id = cart_id and c.profile_id = auth.uid()));
create policy cart_items_admin_read on public.cart_items for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'carts.read'));

grant select on public.orders, public.order_items, public.order_status_history to authenticated;
create policy orders_owner_read on public.orders for select to authenticated using (profile_id = auth.uid());
create policy orders_admin_read on public.orders for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'orders.read'));
create policy order_items_owner_read on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()));
create policy order_items_admin_read on public.order_items for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'orders.read'));
create policy order_history_owner_read on public.order_status_history for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()));
create policy order_history_admin_read on public.order_status_history for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'orders.read'));

grant select on public.payments to authenticated;
create policy payments_owner_read on public.payments for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()));
create policy payments_admin_read on public.payments for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'payments.read'));

grant select, insert, delete on public.favorites to authenticated;
create policy favorites_owner_all on public.favorites for all to authenticated
using (profile_id = auth.uid()) with check (profile_id = auth.uid());

grant select, insert, update, delete on public.coupons, public.coupon_products, public.coupon_categories,
  public.newsletter_subscribers, public.banners to authenticated;
grant select on public.coupon_redemptions to authenticated;

create policy coupons_admin_all on public.coupons for all to authenticated
using (app_private.has_admin_permission(auth.uid(), 'marketing.manage'))
with check (app_private.has_admin_permission(auth.uid(), 'marketing.manage'));
create policy coupon_products_admin_all on public.coupon_products for all to authenticated
using (app_private.has_admin_permission(auth.uid(), 'marketing.manage'))
with check (app_private.has_admin_permission(auth.uid(), 'marketing.manage'));
create policy coupon_categories_admin_all on public.coupon_categories for all to authenticated
using (app_private.has_admin_permission(auth.uid(), 'marketing.manage'))
with check (app_private.has_admin_permission(auth.uid(), 'marketing.manage'));
create policy coupon_redemptions_admin_read on public.coupon_redemptions for select to authenticated
using (app_private.has_admin_permission(auth.uid(), 'marketing.manage') or app_private.has_admin_permission(auth.uid(), 'orders.read'));
create policy newsletter_admin_all on public.newsletter_subscribers for all to authenticated
using (app_private.has_admin_permission(auth.uid(), 'marketing.manage'))
with check (app_private.has_admin_permission(auth.uid(), 'marketing.manage'));
create policy banners_admin_all on public.banners for all to authenticated
using (app_private.has_admin_permission(auth.uid(), 'marketing.manage'))
with check (app_private.has_admin_permission(auth.uid(), 'marketing.manage'));

grant select on public.banners to anon;
create policy banners_public_read on public.banners for select to anon, authenticated
using (status = 'active' and deleted_at is null and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));

grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;
create policy settings_public_read on public.settings for select to anon, authenticated using (is_public);
create policy settings_admin_all on public.settings for all to authenticated
using (app_private.has_admin_permission(auth.uid(), 'settings.manage'))
with check (app_private.has_admin_permission(auth.uid(), 'settings.manage'));
