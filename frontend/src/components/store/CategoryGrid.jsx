import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function CategoryGrid() {
  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data,
  });
  const categories = Array.isArray(data) ? data : [];

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="text-center mb-12">
        <p className="text-bordeaux/60 text-xs tracking-[0.3em] uppercase mb-3">Explore</p>
        <h2 className="font-display text-4xl md:text-5xl font-light text-bordeaux">Nossas Categorias</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {categories.slice(0, 6).map((cat) => (
          <Link key={cat.id} to={`/produtos?category=${cat.slug}`} data-testid={`category-${cat.slug}`} className="group relative overflow-hidden">
            <div className="aspect-[4/5] overflow-hidden bg-parchment">
              <img src={cat.image} alt={cat.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-bordeaux/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-center">
              <h3 className="font-display text-2xl md:text-3xl text-alabaster">{cat.name}</h3>
              <span className="inline-block mt-1 text-[10px] tracking-[0.2em] uppercase text-alabaster/80 border-b border-alabaster/40 pb-0.5">Comprar</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
