import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const labels: Record<string, string> = { admin: "Visão geral" };

export default function AdminBreadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm text-slate-500">
        <li>
          <Link
            to="/admin"
            aria-label="Início da administração"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-bordeaux"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </Link>
        </li>
        {segments.slice(1).map((segment, index) => (
          <li key={segment} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span aria-current={index === segments.length - 2 ? "page" : undefined} className="truncate">
              {labels[segment] ?? segment}
            </span>
          </li>
        ))}
        {segments.length === 1 && <li aria-current="page">Visão geral</li>}
      </ol>
    </nav>
  );
}
