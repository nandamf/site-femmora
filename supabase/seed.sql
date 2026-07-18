-- Official idempotent development seed. Never use these credentials in production.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
    'admin@femmora.local', crypt('FemmoraAdmin123!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Femmora"}', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
    'cliente@femmora.local', crypt('FemmoraCliente123!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Cliente Exemplo"}', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '{"sub":"11111111-1111-4111-8111-111111111111","email":"admin@femmora.local"}',
    'email', now(), now(), now()
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    '{"sub":"22222222-2222-4222-8222-222222222222","email":"cliente@femmora.local"}',
    'email', now(), now(), now()
  )
on conflict (provider_id, provider) do nothing;

insert into public.admin_user_roles (user_id, role_id, assigned_by)
select '11111111-1111-4111-8111-111111111111', id, null
from public.admin_roles where code = 'superadmin'
on conflict do nothing;

select app_private.write_audit_log(
  null, 'service', 'bootstrap.execute', 'admin_role',
  '11111111-1111-4111-8111-111111111111', 'system', 'success', 1::smallint,
  null, null, 'Development seed assigned the first superadministrator.',
  null, '{"role":"superadmin","fixture":true}'::jsonb
)
where not exists (
  select 1 from public.audit_logs
  where action = 'bootstrap.execute'
    and entity_id = '11111111-1111-4111-8111-111111111111'
);

insert into public.addresses (
  id, profile_id, label, recipient_name, phone, postal_code, street,
  number, district, city, state_code, is_default_shipping, is_default_billing
) values (
  '33333333-3333-4333-8333-333333333333',
  '22222222-2222-4222-8222-222222222222', 'Casa', 'Cliente Exemplo',
  '11999999999', '01310-100', 'Avenida Paulista', '1000', 'Bela Vista',
  'São Paulo', 'SP', true, true
) on conflict (id) do nothing;

insert into public.brands (id, name, slug, description) values
  ('44444444-4444-4444-8444-444444444444', 'Femmora', 'femmora', 'Marca própria Femmora.')
on conflict (id) do nothing;

insert into public.categories (id, name, slug, description, sort_order) values
  ('55555555-5555-4555-8555-555555555551', 'Sutiãs', 'sutias', 'Sutiãs e bralettes.', 10),
  ('55555555-5555-4555-8555-555555555552', 'Calcinhas', 'calcinhas', 'Calcinhas femininas.', 20),
  ('55555555-5555-4555-8555-555555555553', 'Linha Noite', 'linha-noite', 'Peças para a noite.', 30)
on conflict (id) do nothing;

insert into public.collections (id, name, slug, description) values
  ('66666666-6666-4666-8666-666666666666', 'Atelier Íntimo', 'atelier-intimo', 'Coleção de desenvolvimento.')
on conflict (id) do nothing;

insert into public.products (
  id, brand_id, name, slug, short_description, description, status,
  is_featured, published_at, seo_title, seo_description
) values
  (
    '77777777-7777-4777-8777-777777777771', '44444444-4444-4444-8444-444444444444',
    'Bralette Fleur Noir', 'bralette-fleur-noir', 'Bralette de renda floral.',
    'Produto fictício para desenvolvimento local.', 'active', true, now(),
    'Bralette Fleur Noir | Femmora', 'Bralette fictício para validar o catálogo local.'
  ),
  (
    '77777777-7777-4777-8777-777777777772', '44444444-4444-4444-8444-444444444444',
    'Camisola Lumière', 'camisola-lumiere', 'Camisola leve de toque acetinado.',
    'Produto fictício para desenvolvimento local.', 'active', false, now(),
    'Camisola Lumière | Femmora', 'Camisola fictícia para validar o catálogo local.'
  )
on conflict (id) do nothing;

insert into public.product_categories (product_id, category_id, is_primary) values
  ('77777777-7777-4777-8777-777777777771', '55555555-5555-4555-8555-555555555551', true),
  ('77777777-7777-4777-8777-777777777772', '55555555-5555-4555-8555-555555555553', true)
on conflict do nothing;

insert into public.collection_products (collection_id, product_id, sort_order) values
  ('66666666-6666-4666-8666-666666666666', '77777777-7777-4777-8777-777777777771', 10),
  ('66666666-6666-4666-8666-666666666666', '77777777-7777-4777-8777-777777777772', 20)
on conflict do nothing;

insert into public.option_values (id, option_type_id, code, value, metadata, sort_order)
select seed.id::uuid, type.id, seed.code, seed.value, seed.metadata::jsonb, seed.sort_order
from (values
  ('88888888-8888-4888-8888-888888888881', 'size', 'p', 'P', '{}', 10),
  ('88888888-8888-4888-8888-888888888882', 'size', 'm', 'M', '{}', 20),
  ('88888888-8888-4888-8888-888888888883', 'color', 'preto', 'Preto', '{"hex":"#111111"}', 10),
  ('88888888-8888-4888-8888-888888888884', 'color', 'champagne', 'Champagne', '{"hex":"#E8D6B3"}', 20)
) as seed(id, type_code, code, value, metadata, sort_order)
join public.option_types type on type.code = seed.type_code
on conflict (id) do nothing;

insert into public.product_variants (
  id, product_id, sku, title, price_amount, compare_at_amount, cost_amount, status
) values
  ('99999999-9999-4999-8999-999999999991', '77777777-7777-4777-8777-777777777771', 'FEM-BFN-P-PRE', 'P / Preto', 18990, 21990, 7800, 'active'),
  ('99999999-9999-4999-8999-999999999992', '77777777-7777-4777-8777-777777777771', 'FEM-BFN-M-PRE', 'M / Preto', 18990, 21990, 7800, 'active'),
  ('99999999-9999-4999-8999-999999999993', '77777777-7777-4777-8777-777777777772', 'FEM-CAM-M-CHA', 'M / Champagne', 25990, null, 11000, 'active')
on conflict (id) do nothing;

insert into public.variant_option_values (variant_id, option_value_id) values
  ('99999999-9999-4999-8999-999999999991', '88888888-8888-4888-8888-888888888881'),
  ('99999999-9999-4999-8999-999999999991', '88888888-8888-4888-8888-888888888883'),
  ('99999999-9999-4999-8999-999999999992', '88888888-8888-4888-8888-888888888882'),
  ('99999999-9999-4999-8999-999999999992', '88888888-8888-4888-8888-888888888883'),
  ('99999999-9999-4999-8999-999999999993', '88888888-8888-4888-8888-888888888882'),
  ('99999999-9999-4999-8999-999999999993', '88888888-8888-4888-8888-888888888884')
on conflict do nothing;

insert into public.product_images (
  id, product_id, storage_bucket, object_path, alt_text, role, sort_order
) values
  ('abababab-abab-4bab-8bab-ababababab01', '77777777-7777-4777-8777-777777777771', 'products', 'development/bralette-primary.webp', 'Bralette Fleur Noir', 'primary', 10),
  ('abababab-abab-4bab-8bab-ababababab02', '77777777-7777-4777-8777-777777777771', 'products', 'development/bralette-hover.webp', 'Bralette Fleur Noir em outro ângulo', 'hover', 20),
  ('abababab-abab-4bab-8bab-ababababab03', '77777777-7777-4777-8777-777777777772', 'products', 'development/camisola-primary.webp', 'Camisola Lumière', 'primary', 10)
on conflict (id) do nothing;

insert into public.stock_locations (id, code, name, is_default) values
  ('acacacac-acac-4cac-8cac-acacacacacac', 'MAIN', 'Estoque principal', true)
on conflict (id) do nothing;

insert into public.inventory (variant_id, location_id, on_hand, reserved) values
  ('99999999-9999-4999-8999-999999999991', 'acacacac-acac-4cac-8cac-acacacacacac', 12, 1),
  ('99999999-9999-4999-8999-999999999992', 'acacacac-acac-4cac-8cac-acacacacacac', 8, 0),
  ('99999999-9999-4999-8999-999999999993', 'acacacac-acac-4cac-8cac-acacacacacac', 5, 0)
on conflict (variant_id, location_id) do nothing;

insert into public.inventory_movements (
  variant_id, location_id, movement_type, quantity_delta, reservation_delta,
  balance_on_hand, balance_reserved, idempotency_key, reason
) values
  ('99999999-9999-4999-8999-999999999991', 'acacacac-acac-4cac-8cac-acacacacacac', 'initial', 12, 1, 12, 1, 'seed-stock-1', 'Seed de desenvolvimento'),
  ('99999999-9999-4999-8999-999999999992', 'acacacac-acac-4cac-8cac-acacacacacac', 'initial', 8, 0, 8, 0, 'seed-stock-2', 'Seed de desenvolvimento'),
  ('99999999-9999-4999-8999-999999999993', 'acacacac-acac-4cac-8cac-acacacacacac', 'initial', 5, 0, 5, 0, 'seed-stock-3', 'Seed de desenvolvimento')
on conflict (idempotency_key) do nothing;

insert into public.carts (id, profile_id, status) values
  ('adadadad-adad-4dad-8dad-adadadadadad', '22222222-2222-4222-8222-222222222222', 'active')
on conflict (id) do nothing;
insert into public.cart_items (cart_id, variant_id, quantity) values
  ('adadadad-adad-4dad-8dad-adadadadadad', '99999999-9999-4999-8999-999999999992', 1)
on conflict (cart_id, variant_id) do nothing;

insert into public.orders (
  id, profile_id, customer_email, customer_name, status, items_subtotal_amount,
  total_amount, shipping_method_snapshot, shipping_address_snapshot, billing_address_snapshot
) values (
  'aeaeaeae-aeae-4eae-8eae-aeaeaeaeaeae', '22222222-2222-4222-8222-222222222222',
  'cliente@femmora.local', 'Cliente Exemplo', 'paid', 18990, 18990,
  '{"name":"Entrega padrão"}',
  '{"postalCode":"01310-100","city":"São Paulo","state":"SP"}',
  '{"postalCode":"01310-100","city":"São Paulo","state":"SP"}'
) on conflict (id) do nothing;

insert into public.order_items (
  id, order_id, product_id, variant_id, product_name_snapshot, variant_name_snapshot,
  sku_snapshot, image_snapshot, attributes_snapshot, unit_price_amount, quantity, line_total_amount
) values (
  'afafafaf-afaf-4faf-8faf-afafafafafaf', 'aeaeaeae-aeae-4eae-8eae-aeaeaeaeaeae',
  '77777777-7777-4777-8777-777777777771', '99999999-9999-4999-8999-999999999991',
  'Bralette Fleur Noir', 'P / Preto', 'FEM-BFN-P-PRE',
  '{"bucket":"products","path":"development/bralette-primary.webp"}',
  '{"size":"P","color":"Preto"}', 18990, 1, 18990
) on conflict (id) do nothing;

insert into public.order_status_history (order_id, from_status, to_status, reason)
select 'aeaeaeae-aeae-4eae-8eae-aeaeaeaeaeae', 'awaiting_payment', 'paid', 'Pagamento fictício do seed'
where not exists (
  select 1 from public.order_status_history
  where order_id = 'aeaeaeae-aeae-4eae-8eae-aeaeaeaeaeae' and to_status = 'paid'
);

insert into public.payments (
  id, order_id, provider, provider_payment_id, status, amount, payment_method,
  installments, idempotency_key, approved_at
) values (
  'b0b0b0b0-b0b0-40b0-80b0-b0b0b0b0b0b0', 'aeaeaeae-aeae-4eae-8eae-aeaeaeaeaeae',
  'development', 'dev-payment-001', 'approved', 18990, 'credit_card', 1,
  'seed-payment-001', now()
) on conflict (id) do nothing;

insert into public.coupons (
  id, code, description, discount_type, discount_value, minimum_order_amount
) values (
  'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1', 'BEMVINDA10',
  'Cupom fictício de desenvolvimento.', 'percentage', 1000, 10000
) on conflict (id) do nothing;

insert into public.favorites (profile_id, product_id) values
  ('22222222-2222-4222-8222-222222222222', '77777777-7777-4777-8777-777777777771')
on conflict do nothing;

insert into public.newsletter_subscribers (
  id, email, profile_id, status, source, consent_at, confirmed_at
) values (
  'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2', 'cliente@femmora.local',
  '22222222-2222-4222-8222-222222222222', 'subscribed', 'development_seed', now(), now()
) on conflict (id) do nothing;

insert into public.banners (
  id, name, placement, title, subtitle, cta_label, cta_url,
  desktop_image_path, mobile_image_path, status, sort_order
) values (
  'b3b3b3b3-b3b3-43b3-83b3-b3b3b3b3b3b3', 'Hero desenvolvimento', 'home_hero',
  'Sinta-se na sua melhor versão', 'Banner fictício para desenvolvimento.', 'Ver coleção', '/#produtos',
  'development/banner-desktop.webp', 'development/banner-mobile.webp', 'active', 10
) on conflict (id) do nothing;

insert into public.settings (key, value, value_version, is_public, description) values
  ('store.free_shipping_threshold', '{"amount":19900,"currency":"BRL"}', 1, true, 'Limite fictício de frete grátis.'),
  ('store.installments', '{"maximum":6,"interestFree":true}', 1, true, 'Parcelamento exibido no desenvolvimento.')
on conflict (key) do nothing;
