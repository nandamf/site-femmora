import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState([]);

  const load = useCallback(async () => {
    if (!isAuthenticated) { setIds([]); return; }
    try {
      const { data } = await api.get("/wishlist");
      setIds(data.product_ids || []);
    } catch { /* noop */ }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (productId) => {
    const { data } = await api.post("/wishlist/toggle", { product_id: productId });
    setIds(data.product_ids || []);
    return data.active;
  };

  const has = (id) => ids.includes(id);

  return (
    <WishlistContext.Provider value={{ ids, toggle, has, reload: load }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
