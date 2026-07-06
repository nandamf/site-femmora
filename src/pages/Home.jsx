import React from "react";
import { CartProvider } from "@/lib/CartContext";
import { StoreProvider } from "@/lib/StoreContext";
import AnnouncementBar from "@/components/store/AnnouncementBar";
import Header from "@/components/store/Header";
import Hero from "@/components/store/Hero";
import CategoryGrid from "@/components/store/CategoryGrid";
import BestSellers from "@/components/store/BestSellers";
import TrustSection from "@/components/store/TrustSection";
import Testimonials from "@/components/store/Testimonials";
import Footer from "@/components/store/Footer";
import CartDrawer from "@/components/store/CartDrawer";
import ProductModal from "@/components/store/ProductModal";

export default function Home() {
  return (
    <StoreProvider><CartProvider>
      <div className="min-h-screen bg-alabaster font-body text-obsidian antialiased">
        <AnnouncementBar />
        <Header />
        <main>
          <Hero />
          <CategoryGrid />
          <BestSellers />
          <TrustSection />
          <Testimonials />
        </main>
        <Footer />
        <CartDrawer />
        <ProductModal />
      </div>
    </CartProvider></StoreProvider>
  );
}