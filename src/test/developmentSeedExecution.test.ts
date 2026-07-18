import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("official development seed", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin;
      create schema auth;
      create table auth.users (
        instance_id uuid,
        id uuid primary key,
        aud text,
        role text,
        email text unique,
        encrypted_password text,
        email_confirmed_at timestamptz,
        created_at timestamptz not null default statement_timestamp(),
        updated_at timestamptz not null default statement_timestamp(),
        raw_app_meta_data jsonb not null default '{}'::jsonb,
        raw_user_meta_data jsonb not null default '{}'::jsonb,
        confirmation_token text,
        recovery_token text
      );
      create table auth.identities (
        id uuid primary key,
        provider_id text not null,
        user_id uuid not null references auth.users(id),
        identity_data jsonb not null,
        provider text not null,
        last_sign_in_at timestamptz,
        created_at timestamptz,
        updated_at timestamptz,
        unique (provider_id, provider)
      );
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      create function public.gen_salt(text) returns text language sql immutable as $$ select 'development-salt' $$;
      create function public.crypt(text, text) returns text language sql immutable as $$ select 'development-password-hash' $$;
    `);

    const migrationDirectory = resolve("supabase/migrations");
    for (const name of (await readdir(migrationDirectory)).filter((file) => file.endsWith(".sql")).sort()) {
      await db.exec(await readFile(resolve(migrationDirectory, name), "utf8"));
    }
    await db.exec(await readFile(resolve("supabase/seed.sql"), "utf8"));
  }, 60_000);

  afterAll(async () => db.close());

  it("creates both development identities and the superadministrator", async () => {
    const result = await db.query<{ users: number; admins: number }>(`
      select
        (select count(*)::integer from auth.users) as users,
        (select count(*)::integer from public.admin_user_roles ur
          join public.admin_roles role on role.id = ur.role_id
          where role.code = 'superadmin') as admins
    `);
    expect(result.rows[0]).toEqual({ users: 2, admins: 1 });
  });

  it("keeps every seeded inventory balance backed by a movement", async () => {
    const result = await db.query<{ unmatched: number }>(`
      select count(*)::integer as unmatched
      from public.inventory inventory
      where not exists (
        select 1 from public.inventory_movements movement
        where movement.variant_id = inventory.variant_id
          and movement.location_id = inventory.location_id
          and movement.balance_on_hand = inventory.on_hand
          and movement.balance_reserved = inventory.reserved
      )
    `);
    expect(result.rows[0]?.unmatched).toBe(0);
  });

  it("creates coherent cart, order, item and payment references", async () => {
    const result = await db.query<{ carts: number; orders: number; orphan_payments: number }>(`
      select
        (select count(*)::integer from public.carts) as carts,
        (select count(*)::integer from public.orders) as orders,
        (select count(*)::integer from public.payments payment
          left join public.orders orders on orders.id = payment.order_id
          where orders.id is null) as orphan_payments
    `);
    expect(result.rows[0]).toEqual({ carts: 1, orders: 1, orphan_payments: 0 });
  });
});
