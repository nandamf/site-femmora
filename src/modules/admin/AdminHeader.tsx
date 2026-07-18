import { LogOut, Menu } from "lucide-react";
import type { RefObject } from "react";
import AdminBreadcrumb from "./AdminBreadcrumb";

type AdminHeaderProps = {
  roles: string[];
  onOpenMenu: () => void;
  onLogout: () => Promise<void>;
  menuButtonRef: RefObject<HTMLButtonElement>;
};

export default function AdminHeader({ roles, onOpenMenu, onLogout, menuButtonRef }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-bordeaux lg:hidden"
          aria-label="Abrir menu administrativo"
        >
          <Menu className="h-5 w-5" />
        </button>
        <AdminBreadcrumb />
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden max-w-48 truncate text-xs text-slate-500 sm:block">
            {roles.join(", ") || "Administrador"}
          </span>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-bordeaux"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
