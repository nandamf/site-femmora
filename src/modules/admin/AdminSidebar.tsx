import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import type { AdminNavigationSection } from "./navigation";

type AdminSidebarProps = {
  sections: AdminNavigationSection[];
  mobileOpen: boolean;
  onClose: () => void;
};

export default function AdminSidebar({ sections, mobileOpen, onClose }: AdminSidebarProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    focusable[0]?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trapFocus);
    return () => dialog.removeEventListener("keydown", trapFocus);
  }, [mobileOpen]);

  const content = (navigationLabel: string) => (
    <>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <NavLink to="/admin" onClick={onClose} className="font-display text-2xl text-white">
          Femmora
          <span className="ml-2 align-middle font-body text-[10px] uppercase tracking-[0.2em] text-white/50">ERP</span>
        </NavLink>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-white/80 hover:bg-white/10 lg:hidden"
          aria-label="Fechar menu administrativo"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav aria-label={navigationLabel} className="flex-1 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {section.label}
            </p>
            <ul className="mt-2 space-y-1">
              {section.items.map(({ label, href, icon: Icon, exact }) => (
                <li key={href}>
                  <NavLink
                    to={href}
                    end={exact}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                        isActive ? "bg-white text-bordeaux" : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-xs text-white/45">Ambiente administrativo</div>
    </>
  );

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 flex-col bg-bordeaux lg:sticky lg:top-0 lg:flex">
        {content("Navegação administrativa principal")}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            onClick={onClose}
            aria-label="Fechar menu administrativo"
          />
          <div
            ref={dialogRef}
            className="relative flex h-full w-[min(20rem,85vw)] flex-col bg-bordeaux shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menu administrativo"
          >
            {content("Navegação administrativa móvel")}
          </div>
        </div>
      )}
    </>
  );
}
