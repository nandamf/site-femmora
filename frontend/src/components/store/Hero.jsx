import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="top" className="relative w-full h-[80vh] min-h-[520px] overflow-hidden bg-parchment">
      <img
        src="https://images.unsplash.com/photo-1642945680515-faada4c0ca7b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1800"
        alt="Mulher em lingerie de renda sob luz suave"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bordeaux/60 via-bordeaux/25 to-transparent" />
      <div className="relative h-full max-w-7xl mx-auto px-6 md:px-8 flex flex-col justify-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: "easeOut" }} className="max-w-xl">
          <p className="text-alabaster/80 text-xs md:text-sm tracking-[0.3em] uppercase mb-5">Nova Coleção · Atelier Íntimo</p>
          <h1 className="font-display text-5xl md:text-7xl font-light text-alabaster leading-[1.05] mb-6">Sinta-se na sua melhor versão</h1>
          <p className="text-alabaster/85 text-base md:text-lg font-light max-w-md mb-9 leading-relaxed">
            Peças desenhadas para abraçar o seu corpo com conforto, delicadeza e uma sofisticação atemporal.
          </p>
          <Link to="/produtos" data-testid="hero-cta"
            className="inline-block bg-alabaster text-bordeaux px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-bordeaux hover:text-alabaster transition-colors duration-300">
            Comprar Coleção
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
