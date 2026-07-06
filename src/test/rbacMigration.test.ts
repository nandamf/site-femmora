import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const migrations = [
  "../../supabase/migrations/20260706113000_audit_foundation.sql",
  "../../supabase/migrations/20260706120000_audit_event_evolution.sql",
  "../../supabase/migrations/20260706130000_rbac.sql",
].map((path) => new URL(path, import.meta.url));

const adminId = "00000000-0000-4000-8000-000000000001";
const managerId = "00000000-0000-4000-8000-000000000002";

describe("RBAC migration", () => {
  let db: PGlite;

  beforeEach(async () => {
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
    for (const migration of migrations) {
      await db.exec(await readFile(fileURLToPath(migration), "utf8"));
    }
    await db.query(
      `insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
       values ($1, 'owner@example.com', now(), '{"full_name":"Owner"}'),
              ($2, 'manager@example.com', now(), '{"full_name":"Manager"}')`,
      [adminId, managerId],
    );
  });

  afterEach(async () => {
    await db.close();
  });

  async function bootstrap() {
    await db.exec("set role service_role");
    const result = await db.query<{ bootstrap_first_superadmin: { status: string } }>(
      "select public.bootstrap_first_superadmin('owner@example.com')",
    );
    await db.exec("reset role");
    return result.rows[0]?.bootstrap_first_superadmin;
  }

  async function authenticate(userId: string) {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
    await db.exec("set role authenticated");
  }

  it("cria automaticamente perfis para usuários do Auth", async () => {
    const result = await db.query<{ full_name: string }>(
      "select full_name from public.profiles where id = $1",
      [adminId],
    );
    expect(result.rows[0]?.full_name).toBe("Owner");
  });

  it("executa o bootstrap uma única vez e audita todas as execuções", async () => {
    expect(await bootstrap()).toEqual({ status: "created", userId: adminId });
    expect(await bootstrap()).toEqual({ status: "already_bootstrapped" });

    const roles = await db.query<{ count: number }>(
      "select count(*)::integer as count from public.admin_user_roles",
    );
    const events = await db.query<{ action: string; outcome: string }>(
      "select action::text, outcome from public.audit_logs order by id",
    );
    expect(roles.rows[0]?.count).toBe(1);
    expect(events.rows).toEqual([
      { action: "bootstrap.execute", outcome: "success" },
      { action: "bootstrap.denied", outcome: "denied" },
    ]);
  });

  it("nega bootstrap para usuário não confirmado", async () => {
    await db.query("update auth.users set email_confirmed_at = null where id = $1", [adminId]);
    await db.exec("set role service_role");
    const result = await db.query<{ bootstrap_first_superadmin: { status: string } }>(
      "select public.bootstrap_first_superadmin('owner@example.com')",
    );
    expect(result.rows[0]?.bootstrap_first_superadmin.status).toBe("user_not_found");
  });

  it("retorna somente os papéis e permissões do usuário autenticado", async () => {
    await bootstrap();
    await authenticate(adminId);
    const result = await db.query<{
      get_my_admin_access: { isAdmin: boolean; roles: string[]; permissions: string[] };
    }>("select public.get_my_admin_access()");

    expect(result.rows[0]?.get_my_admin_access.isAdmin).toBe(true);
    expect(result.rows[0]?.get_my_admin_access.roles).toEqual(["superadmin"]);
    expect(result.rows[0]?.get_my_admin_access.permissions).toContain("admins.manage");
  });

  it("permite atribuição auditada e bloqueia acesso direto às tabelas", async () => {
    await bootstrap();
    await authenticate(adminId);
    await db.query("select public.assign_admin_role($1, 'manager', 'Delegação operacional')", [
      managerId,
    ]);
    await expect(db.query("select * from public.admin_user_roles")).rejects.toThrow();

    await db.exec("reset role");
    await authenticate(managerId);
    const result = await db.query<{ get_my_admin_access: { isAdmin: boolean; roles: string[] } }>(
      "select public.get_my_admin_access()",
    );
    expect(result.rows[0]?.get_my_admin_access).toMatchObject({
      isAdmin: true,
      roles: ["manager"],
    });
  });

  it("bloqueia auto-remoção do papel superadmin", async () => {
    await bootstrap();
    await authenticate(adminId);
    await expect(
      db.query("select public.remove_admin_role($1, 'superadmin', 'Teste de segurança')", [
        adminId,
      ]),
    ).rejects.toThrow("cannot_remove_own_superadmin_role");
  });

  it("nega atribuição de papel a usuário comum", async () => {
    await bootstrap();
    await authenticate(managerId);
    await expect(
      db.query("select public.assign_admin_role($1, 'manager', 'Tentativa indevida')", [adminId]),
    ).rejects.toThrow("insufficient_admin_permission");
  });

  it("possui índices para os caminhos críticos de autorização", async () => {
    const result = await db.query<{ tablename: string; indexname: string }>(`
      select tablename, indexname
      from pg_indexes
      where schemaname = 'public'
        and tablename in ('admin_user_roles', 'admin_role_permissions', 'admin_permissions')
    `);
    const indexes = result.rows.map(({ indexname }) => indexname);
    expect(indexes).toEqual(
      expect.arrayContaining([
        "admin_user_roles_pkey",
        "admin_user_roles_role_idx",
        "admin_role_permissions_pkey",
        "admin_role_permissions_permission_idx",
        "admin_permissions_code_key",
      ]),
    );
  });
});

describe("bootstrap Edge Function contract", () => {
  it("mantém service_role e segredo apenas no código servidor", async () => {
    const source = await readFile(
      fileURLToPath(
        new URL("../../supabase/functions/bootstrap-superadmin/index.ts", import.meta.url),
      ),
      "utf8",
    );
    expect(source).toContain('Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")');
    expect(source).toContain('Deno.env.get("BOOTSTRAP_SUPERADMIN_SECRET")');
    expect(source).not.toMatch(/delete|remove_admin_role/i);
  });
});
