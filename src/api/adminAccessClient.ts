import { requireSupabase } from "@/lib/supabase";

export type AdminAccess = {
  isAdmin: boolean;
  roles: string[];
  permissions: string[];
};

const noAccess: AdminAccess = { isAdmin: false, roles: [], permissions: [] };

export async function getMyAdminAccess(): Promise<AdminAccess> {
  const { data, error } = await requireSupabase().rpc("get_my_admin_access");
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) return noAccess;

  const value = data as Record<string, unknown>;
  return {
    isAdmin: value.isAdmin === true,
    roles: Array.isArray(value.roles)
      ? value.roles.filter((item): item is string => typeof item === "string")
      : [],
    permissions: Array.isArray(value.permissions)
      ? value.permissions.filter((item): item is string => typeof item === "string")
      : [],
  };
}
