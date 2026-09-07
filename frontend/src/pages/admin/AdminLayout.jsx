import React from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, Boxes, Tag, Layers, Users, FileText, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/estoque", label: "Estoque", icon: Boxes },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/categorias", label: "Categorias", icon: Layers },
  { to: "/admin/cupons", label: "Cupons", icon: Tag },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/logs", label: "Logs", icon: FileText },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-alabaster text-obsidian/50">Carregando...</div>;
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-alabaster text-center px-6">
        <h1 className="font-display text-3xl text-bordeaux mb-3">Acesso restrito</h1>
        <p className="text-obsidian/60 mb-6">Esta área é exclusiva para administradores.</p>
        <Link to="/login" className="bg-bordeaux text-alabaster px-8 py-3 text-xs tracking-[0.2em] uppercase">Entrar</Link>
      </div>
    );
  }

  const doLogout = async () => { await logout(); navigate("/"); };

  return (
    <div className="min-h-screen flex bg-[#faf8f4] font-body text-obsidian">
      <aside className="w-60 bg-obsidian text-alabaster flex flex-col fixed h-full">
        <Link to="/" className="font-display text-2xl px-6 py-6 border-b border-white/10">Femmora <span className="text-[10px] tracking-widest uppercase text-alabaster/50 block">Admin</span></Link>
        <nav className="flex-1 py-4">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`admin-nav-${n.label.toLowerCase()}`}
              className={({ isActive }) => `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${isActive ? "bg-white/10 text-alabaster border-l-2 border-alabaster" : "text-alabaster/60 hover:text-alabaster hover:bg-white/5"}`}>
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={doLogout} className="flex items-center gap-3 px-6 py-4 text-sm text-alabaster/60 hover:text-alabaster border-t border-white/10">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </aside>
      <main className="flex-1 ml-60 p-8"><Outlet /></main>
    </div>
  );
}
