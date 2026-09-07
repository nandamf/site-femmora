import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Menu, X, User, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { label: "Novidades", to: "/produtos?is_new=true" },
  { label: "Sutiãs", to: "/produtos?category=sutias" },
  { label: "Calcinhas", to: "/produtos?category=calcinhas" },
  { label: "Conjuntos", to: "/produtos?category=conjuntos" },
  { label: "Bodies", to: "/produtos?category=bodies" },
  { label: "Noite", to: "/produtos?category=camisolas" },
  { label: "Promoções", to: "/produtos?on_sale=true" },
];

export default function Header() {
  const { count, setIsOpen } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/produtos?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setQ("");
  };

  return (
    <header
      data-testid="site-header"
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-alabaster/85 backdrop-blur-xl border-b border-parchment" : "bg-alabaster border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center gap-4">
        <button className="lg:hidden p-2 -ml-2 text-bordeaux" onClick={() => setMobileOpen(true)} aria-label="Abrir menu" data-testid="mobile-menu-btn">
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="font-display text-2xl md:text-3xl tracking-tight text-bordeaux shrink-0" data-testid="logo">
          Femmora
        </Link>

        <nav className="hidden lg:flex items-center justify-center gap-6 flex-1">
          {NAV.map((item) => (
            <Link key={item.label} to={item.to} data-testid={`nav-${item.label.toLowerCase()}`}
              className="text-[11px] tracking-[0.15em] uppercase text-obsidian/80 hover:text-bordeaux transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-5 justify-end lg:shrink-0 flex-1 lg:flex-none">
          <button onClick={() => setSearchOpen(true)} className="text-obsidian/80 hover:text-bordeaux transition-colors" aria-label="Buscar" data-testid="search-btn">
            <Search className="w-5 h-5" />
          </button>
          <Link to="/conta" className="hidden md:block text-obsidian/80 hover:text-bordeaux transition-colors" aria-label="Conta" data-testid="account-btn">
            <User className="w-5 h-5" />
          </Link>
          <Link to="/conta?tab=favoritos" className="hidden md:block text-obsidian/80 hover:text-bordeaux transition-colors" aria-label="Favoritos" data-testid="wishlist-btn">
            <Heart className="w-5 h-5" />
          </Link>
          <button onClick={() => setIsOpen(true)} className="relative text-obsidian/80 hover:text-bordeaux transition-colors" aria-label="Carrinho" data-testid="cart-btn">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-bordeaux text-alabaster text-[10px] w-4 h-4 rounded-full flex items-center justify-center" data-testid="cart-count">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-obsidian text-alabaster text-center text-[10px] tracking-[0.2em] uppercase py-1.5">
          <Link to="/admin" data-testid="admin-link" className="hover:underline">Acessar Painel Administrativo →</Link>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-alabaster/97 backdrop-blur-md flex flex-col" data-testid="search-overlay">
          <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-parchment">
            <span className="font-display text-2xl text-bordeaux">Femmora</span>
            <button onClick={() => setSearchOpen(false)} className="p-2 text-bordeaux" aria-label="Fechar"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 flex flex-col items-center pt-16 px-4">
            <form onSubmit={submitSearch} className="w-full max-w-xl flex border-b border-bordeaux/40">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="O que você procura?" data-testid="search-input"
                className="flex-1 bg-transparent py-4 text-xl text-bordeaux placeholder:text-bordeaux/30 outline-none font-display" />
              <button type="submit" className="p-4 text-bordeaux hover:opacity-70"><Search className="w-5 h-5" /></button>
            </form>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-alabaster lg:hidden" data-testid="mobile-menu">
          <div className="h-16 flex items-center justify-between px-4 border-b border-parchment">
            <span className="font-display text-2xl text-bordeaux">Femmora</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Fechar" className="p-2"><X className="w-5 h-5 text-bordeaux" /></button>
          </div>
          <nav className="flex flex-col p-6 gap-5">
            {NAV.map((item) => (
              <Link key={item.label} to={item.to} onClick={() => setMobileOpen(false)} className="font-display text-2xl text-bordeaux">
                {item.label}
              </Link>
            ))}
            <Link to="/conta" onClick={() => setMobileOpen(false)} className="mt-4 text-sm tracking-[0.15em] uppercase text-obsidian/70">
              {isAuthenticated ? "Minha Conta" : "Entrar / Cadastrar"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
