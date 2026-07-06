import { useQuery } from "@tanstack/react-query";
import { getMyAdminAccess } from "@/api/adminAccessClient";
import { useAuth } from "@/lib/AuthContext";

export function useAdminAccess() {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["admin-access", user?.id],
    queryFn: getMyAdminAccess,
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });
}
