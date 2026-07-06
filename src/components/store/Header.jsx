import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { useStore } from "@/lib/StoreContext";
import { useNavigate } from "react-router-dom";
import { normalizeSearchTerm } from "@/lib/utils";

const NAV = ["Novidades", "Sutiãs", "Calcinhas", "Body & Noite", "Coleções"];

export default function Header() {
  const { count, setIsOpen } = useCart();
  const { activeCategory, setActiveCategory } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const navigate = useNavigate();

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const normalized = normalizeSearchTerm(searchQuery);
    if (!normalized) return;
    navigate(`/busca?q=${encodeURIComponent(normalized)}`);
    closeSearch();
  };

  const handleNav = (item) => {
    setActiveCategory(item);
    setMobileOpen(false);
    document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-alabaster/80 backdrop-blur-xl border-b border-parchment"
          : "bg-alabaster border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <button
          className="md:hidden p-2 -ml-2 text-bordeaux"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="hidden md:flex items-center gap-8 flex-1">
          {NAV.map((item) => (
            <button
              key={item}
              onClick={() => handleNav(item)}
              className={`text-xs tracking-[0.15em] uppercase transition-colors ${
                activeCategory === item
                  ? "text-bordeaux border-b border-bordeaux pb-0.5"
                  : "text-obsidian/80 hover:text-bordeaux"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <a
          href="#top"
          className="font-display text-2xl md:text-3xl tracking-tight text-bordeaux md:absolute md:left-1/2 md:-translate-x-1/2"
        >
          Femmora
        </a>

        <div className="flex items-center gap-3 md:gap-5 flex-1 justify-end">
          <button onClick={openSearch} className="text-obsidian/80 hover:text-bordeaux transition-colors" aria-label="Buscar">
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="relative text-obsidian/80 hover:text-bordeaux transition-colors"
            aria-label="Carrinho"
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-bordeaux text-alabaster text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-alabaster/95 backdrop-blur-md flex flex-col">
          <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-parchment">
            <span className="font-display text-2xl text-bordeaux">Femmora</span>
            <button onClick={closeSearch} className="p-2 text-bordeaux" aria-label="Fechar busca">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-start pt-16 px-4">
            <form onSubmit={handleSearch} className="w-full max-w-xl flex border-b border-bordeaux/40">
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que você procura?"
                className="flex-1 bg-transparent py-4 text-xl text-bordeaux placeholder:text-bordeaux/30 outline-none font-display"
              />
              <button type="submit" className="p-4 text-bordeaux hover:opacity-70">
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-alabaster md:hidden">
          <div className="h-16 flex items-center justify-between px-4 border-b border-parchment">
            <span className="font-display text-2xl text-bordeaux">Femmora</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Fechar menu" className="p-2">
              <X className="w-5 h-5 text-bordeaux" />
            </button>
          </div>
          <nav className="flex flex-col p-6 gap-6">
            {NAV.map((item) => (
              <button
                key={item}
                onClick={() => handleNav(item)}
                className={`font-display text-2xl text-left ${
                  activeCategory === item ? "text-bordeaux underline underline-offset-4" : "text-bordeaux"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}