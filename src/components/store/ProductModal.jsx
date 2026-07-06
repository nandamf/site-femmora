import React, { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/CartContext";
import { useStore } from "@/lib/StoreContext";
import { formatBRL } from "@/lib/products";

const SIZES = ["P", "M", "G", "GG"];

export default function ProductModal() {
  const { selectedProduct, setSelectedProduct } = useStore();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [hovering, setHovering] = useState(false);

  const close = () => {
    setSelectedProduct(null);
    setSelectedSize(null);
    setQty(1);
    setAdded(false);
  };

  const handleAdd = () => {
    if (!selectedSize) return;
    for (let i = 0; i < qty; i++) addItem(selectedProduct, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <AnimatePresence>
      {selectedProduct && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-bordeaux/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            className="fixed inset-4 md:inset-[5%] lg:inset-[8%] z-50 bg-alabaster overflow-y-auto"
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-bordeaux hover:bg-parchment transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid md:grid-cols-2 h-full">
              {/* Image */}
              <div
                className="relative aspect-[4/5] md:aspect-auto md:h-full overflow-hidden bg-parchment"
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
              >
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.alt}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hovering ? "opacity-0" : "opacity-100"}`}
                />
                <img
                  src={selectedProduct.hoverImage}
                  alt={selectedProduct.alt + " — outro ângulo"}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hovering ? "opacity-100" : "opacity-0"}`}
                />
              </div>

              {/* Info */}
              <div className="flex flex-col p-8 md:p-12 justify-center">
                <p className="text-[10px] tracking-[0.3em] uppercase text-bordeaux/50 mb-2">
                  {selectedProduct.category}
                </p>
                <h2 className="font-display text-3xl md:text-4xl text-bordeaux leading-tight mb-4">
                  {selectedProduct.name}
                </h2>
                <p className="text-xl font-medium text-obsidian mb-1">
                  {formatBRL(selectedProduct.price)}
                </p>


                <p className="text-xs tracking-[0.2em] uppercase text-obsidian/60 mb-3">Tamanho</p>
                <div className="flex gap-2 mb-8">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-12 h-12 text-sm border transition-colors ${
                        selectedSize === s
                          ? "bg-bordeaux text-alabaster border-bordeaux"
                          : "border-parchment text-obsidian hover:border-bordeaux"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-parchment">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-bordeaux">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm">{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 flex items-center justify-center text-bordeaux">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={!selectedSize}
                    className={`flex-1 py-4 text-xs tracking-[0.2em] uppercase transition-colors ${
                      !selectedSize
                        ? "bg-parchment text-obsidian/40 cursor-not-allowed"
                        : added
                        ? "bg-obsidian text-alabaster"
                        : "bg-bordeaux text-alabaster hover:bg-obsidian"
                    }`}
                  >
                    {added ? "Adicionado ✓" : selectedSize ? "Adicionar à Sacola" : "Selecione um tamanho"}
                  </button>
                </div>

                <p className="text-xs text-obsidian/50 leading-relaxed">
                  Frete grátis acima de R$ 199 · Primeira troca gratuita e discreta
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
