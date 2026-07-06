import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import { useStore } from "@/lib/StoreContext";
import ProductCard from "./ProductCard";

// Map nav labels to product category values
const CATEGORY_MAP = {
  "Novidades": null,         // show all
  "Sutiãs": "Sutiãs",
  "Calcinhas": "Calcinhas",
  "Body & Noite": ["Bodys", "Linha Noite"],
  "Coleções": null,          // show all
};

const SECTION_TITLE = {
  "Novidades": "Mais Vendidos",
  "Sutiãs": "Sutiãs",
  "Calcinhas": "Calcinhas",
  "Body & Noite": "Body & Linha Noite",
  "Coleções": "Coleções",
};

export default function BestSellers() {
  const scroller = useRef(null);
  const { activeCategory } = useStore();

  const filter = CATEGORY_MAP[activeCategory];
  const filtered = filter
    ? PRODUCTS.filter((p) =>
        Array.isArray(filter) ? filter.includes(p.category) : p.category === filter
      )
    : PRODUCTS;

  const scroll = (dir) => {
    if (scroller.current) {
      scroller.current.scrollBy({ left: dir * 320, behavior: "smooth" });
    }
  };

  return (
    <section id="produtos" className="bg-quartz/40 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-bordeaux/60 text-xs tracking-[0.3em] uppercase mb-3">Favoritos</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-bordeaux">
              {SECTION_TITLE[activeCategory] || "Mais Vendidos"}
            </h2>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Anterior"
              className="w-11 h-11 border border-bordeaux/30 text-bordeaux flex items-center justify-center hover:bg-bordeaux hover:text-alabaster transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Próximo"
              className="w-11 h-11 border border-bordeaux/30 text-bordeaux flex items-center justify-center hover:bg-bordeaux hover:text-alabaster transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0"
        >
          {filtered.map((p) => (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[75%] sm:w-[45%] md:w-[calc(25%-18px)]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}