import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

async function digest(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function secretsMatch(received: string, expected: string) {
  const [left, right] = await Promise.all([digest(received), digest(expected)]);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const expectedSecret = Deno.env.get("BOOTSTRAP_SUPERADMIN_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !expectedSecret) {
    return response(503, { code: "BOOTSTRAP_NOT_CONFIGURED", requestId });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const recordDenied = async (reason: string) => {
    await adminClient.rpc("record_system_audit_event", {
      p_action: "bootstrap.denied",
      p_entity_type: "admin_role",
      p_outcome: "denied",
      p_request_id: requestId,
      p_reason: reason,
    });
  };

  if (request.method !== "POST") {
    await recordDenied("Unsupported HTTP method.");
    return response(405, { code: "METHOD_NOT_ALLOWED", requestId });
  }

  const receivedSecret = request.headers.get("x-bootstrap-secret") ?? "";
  if (!(await secretsMatch(receivedSecret, expectedSecret))) {
    await recordDenied("Invalid bootstrap secret.");
    return response(401, { code: "UNAUTHORIZED", requestId });
  }

  const rawBody = await request.text();
  if (rawBody.length > 4096) {
    await recordDenied("Bootstrap payload too large.");
    return response(413, { code: "PAYLOAD_TOO_LARGE", requestId });
  }

  let email = "";
  try {
    const body = JSON.parse(rawBody) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    await recordDenied("Invalid JSON payload.");
    return response(400, { code: "INVALID_PAYLOAD", requestId });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    await recordDenied("Invalid target email.");
    return response(400, { code: "INVALID_EMAIL", requestId });
  }

  const { data, error } = await adminClient.rpc("bootstrap_first_superadmin", {
    p_email: email,
    p_request_id: requestId,
  });

  if (error) {
    await recordDenied("Bootstrap database operation failed.");
    return response(500, { code: "BOOTSTRAP_FAILED", requestId });
  }

  return response(200, { ...data, requestId });
});
