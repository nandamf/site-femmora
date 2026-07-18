import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const adminId = "10000000-0000-4000-8000-000000000001";
const customerId = "10000000-0000-4000-8000-000000000002";
const otherCustomerId = "10000000-0000-4000-8000-000000000003";
const brandId = "20000000-0000-4000-8000-000000000001";
const productId = "30000000-0000-4000-8000-000000000001";
const variantId = "40000000-0000-4000-8000-000000000001";
const locationId = "50000000-0000-4000-8000-000000000001";
const customerOrderId = "60000000-0000-4000-8000-000000000001";
const otherOrderId = "60000000-0000-4000-8000-000000000002";

describe.sequential("complete ecommerce database domain", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin;
      create schema auth;
      create table auth.users (
        id uuid primary key,
        email text unique,
        email_confirmed_at timestamptz,
        raw_user_meta_data jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default statement_timestamp()
      );
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
    `);

    const migrationDirectory = resolve(process.cwd(), "supabase", "migrations");
    const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
    for (const migration of migrations) {
      await db.exec(await readFile(resolve(migrationDirectory, migration), "utf8"));
    }

    await db.query(
      `insert into auth.users (id, email, email_confirmed_at) values
       ($1, 'admin@example.com', now()),
       ($2, 'customer@example.com', now()),
       ($3, 'other@example.com', now())`,
      [adminId, customerId, otherCustomerId],
    );
    await db.query("select public.bootstrap_first_superadmin('admin@example.com')");

    await db.query("insert into public.brands (id, name, slug) values ($1, 'Femmora', 'femmora')", [brandId]);
    await db.query(
      `insert into public.products (id, brand_id, name, slug, status, published_at)
       values ($1, $2, 'Produto Ativo', 'produto-ativo', 'active', now())`,
      [productId, brandId],
    );
    await db.query(
      `insert into public.product_variants (id, product_id, sku, price_amount)
       values ($1, $2, 'FEM-001-P', 18990)`,
      [variantId, productId],
    );
    await db.query(
      `insert into public.stock_locations (id, code, name, is_default)
       values ($1, 'MAIN', 'Estoque principal', true)`,
      [locationId],
    );
  }, 60_000);

  afterAll(async () => {
    await db.close();
  });

  async function resetRole() {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }

  async function authenticate(userId: string, role = "authenticated") {
    await resetRole();
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
    await db.exec(`set role ${role}`);
  }

  it("creates every required table with RLS enabled", async () => {
    const required = [
      "profiles", "addresses", "categories", "brands", "collections", "products",
      "product_variants", "product_images", "stock_locations", "inventory",
      "inventory_movements", "carts", "cart_items", "orders", "order_items",
      "payments", "coupons", "coupon_redemptions", "favorites",
      "newsletter_subscribers", "banners", "settings",
    ];
    const result = await db.query<{ relname: string; relrowsecurity: boolean }>(`
      select relname, relrowsecurity
      from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace
      where nspname = 'public' and relkind = 'r'
    `);
    const actualNames = result.rows.map((row) => row.relname);
    expect(actualNames).toEqual(expect.arrayContaining(required));
    expect(result.rows.every((row) => row.relrowsecurity)).toBe(true);
  });

  it("enforces foreign keys and commercial constraints", async () => {
    await expect(
      db.query(
        "insert into public.products (name, slug) values ('Inválido', 'invalido') returning id",
      ),
    ).resolves.toBeDefined();
    await expect(
      db.query(
        "insert into public.product_variants (product_id, sku, price_amount) values ($1, 'lowercase', 100)",
        [productId],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        "insert into public.inventory (variant_id, location_id, on_hand) values ($1, $2, -1)",
        [variantId, locationId],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        "insert into public.products (brand_id, name, slug) values (gen_random_uuid(), 'Sem marca', 'sem-marca')",
      ),
    ).rejects.toThrow();
  });

  it("preserves immutable order snapshots", async () => {
    await resetRole();
    await db.query(
      `insert into public.orders (
        id, profile_id, customer_email, customer_name, items_subtotal_amount,
        total_amount, shipping_address_snapshot, billing_address_snapshot
      ) values ($1, $2, 'customer@example.com', 'Cliente', 18990, 18990, '{}', '{}')`,
      [customerOrderId, customerId],
    );
    await db.query(
      `insert into public.order_items (
        order_id, product_id, variant_id, product_name_snapshot, sku_snapshot,
        unit_price_amount, quantity, line_total_amount
      ) values ($1, $2, $3, 'Produto Ativo', 'FEM-001-P', 18990, 1, 18990)`,
      [customerOrderId, productId, variantId],
    );
    await expect(
      db.query("update public.orders set total_amount = 1 where id = $1", [customerOrderId]),
    ).rejects.toThrow("immutable");
    await expect(
      db.query("update public.order_items set product_name_snapshot = 'Outro' where order_id = $1", [
        customerOrderId,
      ]),
    ).rejects.toThrow("immutable");
  });

  it("isolates customer orders and hides inventory from storefront roles", async () => {
    await resetRole();
    await db.query(
      `insert into public.orders (
        id, profile_id, customer_email, customer_name, items_subtotal_amount,
        total_amount, shipping_address_snapshot, billing_address_snapshot
      ) values ($1, $2, 'other@example.com', 'Outro', 1000, 1000, '{}', '{}')`,
      [otherOrderId, otherCustomerId],
    );

    await authenticate(customerId);
    const orders = await db.query<{ id: string }>("select id from public.orders");
    expect(orders.rows).toEqual([{ id: customerOrderId }]);
    const hiddenInventory = await db.query("select * from public.inventory");
    expect(hiddenInventory.rows).toEqual([]);

    await authenticate(customerId, "anon");
    const products = await db.query<{ id: string }>("select id from public.products");
    expect(products.rows).toEqual([{ id: productId }]);
  });

  it("adjusts inventory atomically, idempotently and with two ledgers", async () => {
    await authenticate(adminId);
    const first = await db.query<{ adjust_inventory: { onHand: number; idempotentReplay: boolean } }>(
      "select public.adjust_inventory($1, $2, 10, 'Saldo inicial', 'test-adjust-1')",
      [variantId, locationId],
    );
    const replay = await db.query<{ adjust_inventory: { onHand: number; idempotentReplay: boolean } }>(
      "select public.adjust_inventory($1, $2, 10, 'Saldo inicial', 'test-adjust-1')",
      [variantId, locationId],
    );
    expect(first.rows[0]?.adjust_inventory).toMatchObject({ onHand: 10, idempotentReplay: false });
    expect(replay.rows[0]?.adjust_inventory).toMatchObject({ onHand: 10, idempotentReplay: true });

    await resetRole();
    const counts = await db.query<{ movements: number; audits: number }>(`
      select
        (select count(*)::integer from public.inventory_movements) as movements,
        (select count(*)::integer from public.audit_logs where action = 'inventory.adjust') as audits
    `);
    expect(counts.rows[0]).toEqual({ movements: 1, audits: 1 });
  });

  it("creates indexes for SKU, category, stock, orders, payments and carts", async () => {
    const result = await db.query<{ indexname: string }>(`
      select indexname from pg_indexes where schemaname = 'public'
    `);
    const names = result.rows.map((row) => row.indexname);
    expect(names).toEqual(expect.arrayContaining([
      "product_variants_sku_key",
      "product_categories_category_idx",
      "inventory_movements_variant_timeline_idx",
      "orders_profile_timeline_idx",
      "payments_order_timeline_idx",
      "carts_one_active_profile_idx",
    ]));

    await db.exec("set enable_seqscan = off");
    const plan = await db.query<Record<string, string>>(
      "explain select * from public.product_variants where sku = 'FEM-001-P'",
    );
    expect(JSON.stringify(plan.rows)).toContain("product_variants_sku_key");
    await db.exec("reset enable_seqscan");
  });
});
