import React, { createContext, useContext, useState } from "react";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [activeCategory, setActiveCategory] = useState("Novidades");
  const [selectedProduct, setSelectedProduct] = useState(null);
  return (
    <StoreContext.Provider value={{ activeCategory, setActiveCategory, selectedProduct, setSelectedProduct }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);