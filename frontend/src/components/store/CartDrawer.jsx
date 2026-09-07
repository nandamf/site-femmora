import React from "react";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/lib/CartContext";
import { formatBRL } from "@/lib/format";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQty, removeItem, subtotal, count } = useCart();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" data-testid="cart-drawer">
      <div className="absolute inset-0 bg-obsidian/40" onClick={() => setIsOpen(false)} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-alabaster shadow-2xl flex flex-col">
        <div className="h-16 flex items-center justify-between px-6 border-b border-parchment">
          <span className="font-display text-2xl text-bordeaux">Sacola ({count})</span>
          <button onClick={() => setIsOpen(false)} aria-label="Fechar" className="p-2 text-bordeaux"><X className="w-5 h-5" /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <ShoppingBag className="w-10 h-10 text-bordeaux/40 mb-4" strokeWidth={1.2} />
            <p className="text-obsidian/60 mb-6">Sua sacola está vazia.</p>
            <Link to="/produtos" onClick={() => setIsOpen(false)} className="border border-bordeaux text-bordeaux px-8 py-3 text-xs tracking-[0.2em] uppercase hover:bg-bordeaux hover:text-alabaster transition-colors">Explorar Coleção</Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.map((it) => (
                <div key={it.key} className="flex gap-4" data-testid={`cart-item-${it.key}`}>
                  <img src={it.image} alt={it.name} className="w-20 h-24 object-cover bg-parchment" />
                  <div className="flex-1">
                    <h4 className="font-display text-lg text-bordeaux leading-tight">{it.name}</h4>
                    <p className="text-xs text-obsidian/60 mt-0.5">{it.color} · {it.size}</p>
                    <p className="text-sm text-obsidian mt-1">{formatBRL(it.price)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-parchment">
                        <button onClick={() => updateQty(it.key, -1)} className="p-1.5 text-bordeaux" aria-label="Diminuir"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="px-3 text-sm">{it.qty}</span>
                        <button onClick={() => updateQty(it.key, 1)} className="p-1.5 text-bordeaux" aria-label="Aumentar"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <button onClick={() => removeItem(it.key)} className="text-xs text-obsidian/50 underline hover:text-bordeaux">Remover</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-parchment px-6 py-5">
              <div className="flex justify-between mb-4">
                <span className="text-sm tracking-wide text-obsidian/70">Subtotal</span>
                <span className="font-medium text-bordeaux">{formatBRL(subtotal)}</span>
              </div>
              <Link to="/checkout" onClick={() => setIsOpen(false)} data-testid="checkout-link"
                className="block text-center bg-bordeaux text-alabaster py-4 text-xs tracking-[0.2em] uppercase hover:opacity-90 transition-opacity">
                Finalizar Compra
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
