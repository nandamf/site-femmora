import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const migrationUrls = [
  "../../supabase/migrations/20260706113000_audit_foundation.sql",
  "../../supabase/migrations/20260706120000_audit_event_evolution.sql",
].map((path) => new URL(path, import.meta.url));

describe("audit foundation migration", () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    `);
    for (const migrationUrl of migrationUrls) {
      await db.exec(await readFile(fileURLToPath(migrationUrl), "utf8"));
    }
  });

  afterEach(async () => {
    await db.close();
  });

  it("permite que somente service_role use o ponto público de escrita", async () => {
    await db.exec("set role authenticated");
    await expect(
      db.query("select public.record_system_audit_event('bootstrap.execute', 'admin')"),
    ).rejects.toThrow();

    await db.exec("reset role; set role service_role");
    const result = await db.query<{ record_system_audit_event: string }>(
      "select public.record_system_audit_event('bootstrap.execute', 'admin')",
    );
    expect(result.rows[0]?.record_system_audit_event).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("nega leitura e inserção direta para usuários autenticados", async () => {
    await db.exec("set role authenticated");
    await expect(db.query("select * from public.audit_logs")).rejects.toThrow();
    await expect(
      db.query(`
        insert into public.audit_logs
          (actor_type, action, entity_type, source)
        values ('service', 'test.execute', 'test', 'system')
      `),
    ).rejects.toThrow();
  });

  it("bloqueia update e delete mesmo para o proprietário da tabela", async () => {
    await db.query("select public.record_system_audit_event('audit.create', 'audit_log')");
    await expect(db.query("update public.audit_logs set outcome = 'failure'")).rejects.toThrow(
      "append-only",
    );
    await expect(db.query("delete from public.audit_logs")).rejects.toThrow("append-only");
  });

  it("rejeita payloads e taxonomias inválidas", async () => {
    await expect(
      db.query(
        "select public.record_system_audit_event('INVALID', 'audit_log')",
      ),
    ).rejects.toThrow();
  });

  it("versiona eventos e mantém metadados de requisição opcionais", async () => {
    await db.query(
      "select public.record_system_audit_event('audit.create', 'audit_log', null, 'success', 2::smallint)",
    );
    const result = await db.query<{
      event_version: number;
      request_ip: string | null;
      user_agent: string | null;
    }>("select event_version, request_ip, user_agent from public.audit_logs");

    expect(result.rows[0]).toEqual({ event_version: 2, request_ip: null, user_agent: null });
  });

  it("cria os índices previstos para consultas operacionais", async () => {
    const result = await db.query<{ indexname: string }>(`
      select indexname
      from pg_indexes
      where schemaname = 'public' and tablename = 'audit_logs'
    `);
    const indexes = result.rows.map(({ indexname }) => indexname);

    expect(indexes).toEqual(
      expect.arrayContaining([
        "audit_logs_occurred_at_brin",
        "audit_logs_actor_timeline_idx",
        "audit_logs_entity_timeline_idx",
        "audit_logs_action_timeline_idx",
        "audit_logs_correlation_id_idx",
        "audit_logs_request_id_idx",
      ]),
    );
  });
});
