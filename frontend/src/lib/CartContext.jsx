import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "femmora_cart";

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((entry, openDrawer = true) => {
    // entry: { product_id, variant_id, name, slug, size, color, color_hex, image, price, qty }
    setItems((prev) => {
      const key = `${entry.product_id}-${entry.variant_id}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + (entry.qty || 1) } : i));
      }
      return [...prev, { ...entry, qty: entry.qty || 1, key }];
    });
    if (openDrawer) setIsOpen(true);
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const updateQty = useCallback((key, delta) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clear, count, subtotal, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
