import React from "react";
import AnnouncementBar from "@/components/store/AnnouncementBar";
import Header from "@/components/store/Header";
import Hero from "@/components/store/Hero";
import CategoryGrid from "@/components/store/CategoryGrid";
import BestSellers from "@/components/store/BestSellers";
import TrustSection from "@/components/store/TrustSection";
import Testimonials from "@/components/store/Testimonials";
import Footer from "@/components/store/Footer";
import CartDrawer from "@/components/store/CartDrawer";
import { Link } from "react-router-dom";

function InstitutionalBanner() {
  return (
    <section className="relative overflow-hidden">
      <img src="https://images.unsplash.com/photo-1653277135616-c062b194440e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1800"
        alt="Editorial Femmora" className="w-full h-[420px] object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-obsidian/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <p className="text-alabaster/80 text-xs tracking-[0.3em] uppercase mb-4">O Atelier Femmora</p>
        <h2 className="font-display text-4xl md:text-6xl font-light text-alabaster max-w-2xl leading-tight mb-6">
          Delicadeza que veste confiança
        </h2>
        <Link to="/produtos" className="bg-alabaster text-bordeaux px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-bordeaux hover:text-alabaster transition-colors">
          Descobrir a Coleção
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-alabaster font-body text-obsidian antialiased">
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <CategoryGrid />
        <BestSellers />
        <InstitutionalBanner />
        <TrustSection />
        <Testimonials />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
