import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useAuth } from "@/lib/AuthContext";
import AdminErrorBoundary from "./AdminErrorBoundary";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { adminNavigation, filterAdminNavigation } from "./navigation";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const access = useAdminAccess();
  const { logout } = useAuth();
  const navigation = useMemo(
    () => filterAdminNavigation(adminNavigation, access.data?.permissions ?? []),
    [access.data?.permissions],
  );
  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeMobileMenu, mobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <a
        href="#admin-content"
        className="sr-only z-[60] rounded bg-white px-4 py-2 text-bordeaux focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <AdminSidebar sections={navigation} mobileOpen={mobileOpen} onClose={closeMobileMenu} />
      <div className="min-w-0 flex-1">
        <AdminHeader
          roles={access.data?.roles ?? []}
          menuButtonRef={menuButtonRef}
          onOpenMenu={() => setMobileOpen(true)}
          onLogout={logout}
        />
        <main id="admin-content" tabIndex={-1} className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <AdminErrorBoundary>
              <Outlet />
            </AdminErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
