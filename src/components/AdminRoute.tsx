import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useAuth } from "@/lib/AuthContext";

function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" role="status">
      <span className="sr-only">Validando acesso administrativo</span>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
    </div>
  );
}

export default function AdminRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const access = useAdminAccess();

  if (isLoadingAuth) return <Loading />;
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (access.isLoading) return <Loading />;
  if (access.isError || !access.data?.isAdmin) return <Navigate to="/acesso-negado" replace />;
  return <Outlet />;
}
