import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import api from "@/lib/api";
import StoreLayout from "@/components/store/StoreLayout";
import ProductCard from "@/components/store/ProductCard";
import { formatBRL } from "@/lib/format";

const SORTS = [
  { value: "relevance", label: "Relevância" },
  { value: "newest", label: "Novidades" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name", label: "Nome A-Z" },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const category = params.get("category") || "";
  const q = params.get("q") || "";
  const on_sale = params.get("on_sale") || "";
  const is_new = params.get("is_new") || "";
  const size = params.get("size") || "";
  const color = params.get("color") || "";
  const availability = params.get("availability") || "";
  const maxPrice = params.get("max_price") || "";
  const collection = params.get("collection") || "";
  const sort = params.get("sort") || "relevance";

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const { data: filters } = useQuery({ queryKey: ["filters"], queryFn: async () => (await api.get("/products/filters")).data });

  const queryParams = useMemo(() => {
    const p = { sort, limit: 48 };
    if (category) p.category = category;
    if (q) p.q = q;
    if (on_sale) p.on_sale = true;
    if (is_new) p.is_new = true;
    if (size) p.size = size;
    if (color) p.color = color;
    if (availability) p.availability = availability;
    if (maxPrice) p.max_price = maxPrice;
    if (collection) p.collection = collection;
    return p;
  }, [category, q, on_sale, is_new, size, color, availability, maxPrice, collection, sort]);

  const { data, isLoading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: async () => (await api.get("/products", { params: queryParams })).data,
  });

  const products = data?.products || [];
  const title = q ? `Busca: "${q}"` : category ? (filters?.categories?.find((c) => c.slug === category)?.name || "Produtos") : on_sale ? "Promoções" : is_new ? "Novidades" : "Todos os Produtos";

  const clearAll = () => setParams(new URLSearchParams(q ? { q } : {}));

  const FilterPanel = () => (
    <div className="space-y-8" data-testid="filter-panel">
      <div>
        <h4 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-3">Categoria</h4>
        <div className="flex flex-col gap-2">
          {(filters?.categories || []).map((c) => (
            <button key={c.slug} onClick={() => setParam("category", category === c.slug ? "" : c.slug)}
              className={`text-left text-sm ${category === c.slug ? "text-bordeaux font-medium" : "text-obsidian/70 hover:text-bordeaux"}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-3">Tamanho</h4>
        <div className="flex flex-wrap gap-2">
          {(filters?.sizes || []).map((s) => (
            <button key={s} onClick={() => setParam("size", size === s ? "" : s)} data-testid={`filter-size-${s}`}
              className={`w-10 h-10 text-xs border ${size === s ? "bg-bordeaux text-alabaster border-bordeaux" : "border-parchment text-obsidian/70 hover:border-bordeaux"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-3">Cor</h4>
        <div className="flex flex-wrap gap-2.5">
          {(filters?.colors || []).map((c) => (
            <button key={c.name} title={c.name} onClick={() => setParam("color", color === c.name ? "" : c.name)}
              className={`w-7 h-7 rounded-full border-2 ${color === c.name ? "border-bordeaux ring-2 ring-bordeaux/20" : "border-obsidian/15"}`}
              style={{ backgroundColor: c.hex }} />
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-3">Preço máximo</h4>
        <input type="range" min="50" max={filters?.max_price || 400} value={maxPrice || filters?.max_price || 400}
          onChange={(e) => setParam("max_price", e.target.value)} className="w-full accent-bordeaux" />
        <p className="text-sm text-obsidian/60 mt-1">Até {formatBRL(maxPrice || filters?.max_price || 400)}</p>
      </div>
      <div>
        <h4 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-3">Disponibilidade</h4>
        <div className="flex flex-col gap-2">
          {[{ v: "in_stock", l: "Disponível" }, { v: "low", l: "Últimas unidades" }].map((o) => (
            <button key={o.v} onClick={() => setParam("availability", availability === o.v ? "" : o.v)}
              className={`text-left text-sm ${availability === o.v ? "text-bordeaux font-medium" : "text-obsidian/70 hover:text-bordeaux"}`}>{o.l}</button>
          ))}
        </div>
      </div>
      <button onClick={clearAll} className="text-xs underline text-obsidian/60 hover:text-bordeaux">Limpar filtros</button>
    </div>
  );

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-light text-bordeaux">{title}</h1>
          <p className="text-sm text-obsidian/50 mt-2">{data?.total || 0} peças</p>
        </div>

        <div className="flex gap-10">
          <aside className="hidden lg:block w-60 shrink-0">
            <FilterPanel />
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setShowFilters(true)} className="lg:hidden flex items-center gap-2 text-sm text-bordeaux border border-parchment px-4 py-2" data-testid="open-filters">
                <SlidersHorizontal className="w-4 h-4" /> Filtros
              </button>
              <select value={sort} onChange={(e) => setParam("sort", e.target.value)} data-testid="sort-select"
                className="ml-auto bg-transparent border border-parchment text-sm px-4 py-2 text-obsidian/80 outline-none">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {isLoading ? (
              <div className="py-24 text-center text-obsidian/50">Carregando...</div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center text-obsidian/50" data-testid="empty-products">Nenhum produto encontrado com esses filtros.</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8" data-testid="products-grid">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-obsidian/40" onClick={() => setShowFilters(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-alabaster p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <span className="font-display text-2xl text-bordeaux">Filtros</span>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5 text-bordeaux" /></button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </StoreLayout>
  );
}
