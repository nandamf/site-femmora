import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import { normalizeSearchTerm } from "@/lib/utils";
import ProductCard from "@/components/store/ProductCard";
import ProductModal from "@/components/store/ProductModal";
import { CartProvider } from "@/lib/CartContext";
import { StoreProvider } from "@/lib/StoreContext";
import CartDrawer from "@/components/store/CartDrawer";

export default function SearchResults() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  const normalizedQuery = normalizeSearchTerm(query);

  const filtered = PRODUCTS.filter((p) => {
    const normalizedName = normalizeSearchTerm(p.name);
    const normalizedCategory = normalizeSearchTerm(p.category);
    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedCategory.includes(normalizedQuery)
    );
  });

  return (
    <StoreProvider><CartProvider>
      <div className="min-h-screen bg-alabaster">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-bordeaux text-sm mb-8 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à loja
          </button>

          <div className="mb-10">
            <p className="text-bordeaux/50 text-xs tracking-[0.3em] uppercase mb-2">Resultados para</p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-bordeaux">
              "{query}"
            </h1>
            <p className="text-obsidian/50 text-sm mt-2">
              {filtered.length} {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-3xl text-bordeaux/40 mb-3">Nenhum resultado</p>
              <p className="text-obsidian/50 text-sm">Tente outra palavra-chave</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
        <CartDrawer />
        <ProductModal />
      </div>
    </CartProvider></StoreProvider>
  );
}
