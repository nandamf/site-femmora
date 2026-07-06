import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { useStore } from "@/lib/StoreContext";
import { formatBRL } from "@/lib/products";

const SIZES = ["P", "M", "G"];

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { setSelectedProduct } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = (size) => {
    addItem(product, size);
    setDrawerOpen(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group w-full">
      <div
        className="relative aspect-[4/5] overflow-hidden bg-parchment cursor-pointer"
        onClick={() => setSelectedProduct(product)}
      >
        <img
          src={product.image}
          alt={product.alt}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
        />
        <img
          src={product.hoverImage}
          alt={product.alt + " — outro ângulo"}
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        {/* Quick add */}
        <div className="absolute bottom-3 right-3" onClick={(e) => e.stopPropagation()}>
          {drawerOpen ? (
            <div className="flex items-center gap-1 bg-alabaster/95 backdrop-blur p-1 shadow-lg">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleAdd(s)}
                  className="w-9 h-9 text-xs text-bordeaux hover:bg-bordeaux hover:text-alabaster transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Adicionar ao carrinho"
              className="w-11 h-11 bg-alabaster/95 backdrop-blur text-bordeaux flex items-center justify-center shadow-lg hover:bg-bordeaux hover:text-alabaster transition-colors md:opacity-0 md:group-hover:opacity-100"
            >
              {added ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      <div className="pt-4 text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase text-bordeaux/50 mb-1">
          {product.category}
        </p>
        <h3 className="font-display text-xl text-bordeaux leading-tight">{product.name}</h3>
        <p className="mt-2 text-obsidian font-medium">{formatBRL(product.price)}</p>

      </div>
    </div>
  );
}