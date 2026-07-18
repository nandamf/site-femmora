import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useAuth } from "@/lib/AuthContext";
import AdminErrorState from "@/modules/admin/AdminErrorState";
import AdminLoading from "@/modules/admin/AdminLoading";

export default function AdminRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const access = useAdminAccess();

  if (isLoadingAuth) return <AdminLoading label="Validando sessão" />;
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (access.isLoading) return <AdminLoading label="Validando permissões" />;
  if (access.isError) {
    return <AdminErrorState title="Falha ao validar permissões" onRetry={() => void access.refetch()} />;
  }
  if (!access.data?.isAdmin) return <Navigate to="/acesso-negado" replace />;
  return <Outlet />;
}
