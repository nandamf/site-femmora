import React from "react";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/CartContext";
import { formatBRL } from "@/lib/products";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQty, removeItem, total } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-bordeaux/40 backdrop-blur-sm z-50"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-alabaster z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-parchment">
              <h2 className="font-display text-2xl text-bordeaux">Sua Sacola</h2>
              <button onClick={() => setIsOpen(false)} aria-label="Fechar" className="p-2 text-bordeaux">
                <X className="w-5 h-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <ShoppingBag className="w-10 h-10 text-bordeaux/30 mb-4" />
                <p className="text-obsidian/60">Sua sacola está vazia.</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-6 text-xs tracking-[0.2em] uppercase text-bordeaux border-b border-bordeaux pb-1"
                >
                  Continuar comprando
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                  {items.map((item) => (
                    <div key={item.key} className="flex gap-4">
                      <img src={item.image} alt={item.alt} className="w-20 h-24 object-cover bg-parchment" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-display text-lg text-bordeaux leading-tight">{item.name}</h3>
                          <button onClick={() => removeItem(item.key)} className="text-obsidian/40 hover:text-bordeaux">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-obsidian/50 mt-0.5">Tamanho: {item.size}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-parchment">
                            <button onClick={() => updateQty(item.key, -1)} className="w-8 h-8 flex items-center justify-center text-bordeaux">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.qty}</span>
                            <button onClick={() => updateQty(item.key, 1)} className="w-8 h-8 flex items-center justify-center text-bordeaux">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-medium text-obsidian">{formatBRL(item.price * item.qty)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-parchment p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-obsidian/60">Subtotal</span>
                    <span className="font-medium text-obsidian">{formatBRL(total)}</span>
                  </div>
                  <p className="text-xs text-obsidian/50">
                    ou 6x de {formatBRL(total / 6)} sem juros · Frete calculado no checkout
                  </p>
                  <button className="w-full bg-bordeaux text-alabaster py-4 text-xs tracking-[0.2em] uppercase hover:bg-obsidian transition-colors">
                    Finalizar Compra
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}