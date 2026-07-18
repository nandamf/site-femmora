import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("development environment artifacts", () => {
  it("configures the official seed for local resets", async () => {
    const config = await readFile(resolve("supabase/config.toml"), "utf8");
    expect(config).toContain("[db.seed]");
    expect(config).toContain('sql_paths = ["./seed.sql"]');
  });

  it("seeds coherent fixtures across the main domains", async () => {
    const seed = await readFile(resolve("supabase/seed.sql"), "utf8");
    for (const table of [
      "auth.users",
      "public.admin_user_roles",
      "public.products",
      "public.product_variants",
      "public.inventory",
      "public.inventory_movements",
      "public.carts",
      "public.orders",
      "public.order_items",
      "public.payments",
      "public.coupons",
      "public.settings",
    ]) {
      expect(seed).toContain(`insert into ${table}`);
    }
    expect(seed).toContain("on conflict");
  });

  it("uses the local Supabase CLI and fails fast without Docker", async () => {
    const script = await readFile(resolve("scripts/reset-dev.ps1"), "utf8");
    expect(script).toContain("Get-Command docker");
    expect(script).toContain("supabase.cmd\" db reset");
  });
});
