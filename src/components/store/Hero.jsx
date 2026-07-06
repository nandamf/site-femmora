import React from "react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="top" className="relative w-full h-[85vh] min-h-[560px] overflow-hidden bg-parchment">
      <img
        src="https://images.unsplash.com/photo-1495121605193-b116b5b09a5d?auto=format&fit=crop&w=1600&q=80"
        alt="Mulher elegante em lingerie de renda bordô sob luz lateral suave em ambiente minimalista"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bordeaux/50 via-bordeaux/20 to-transparent" />
      <div className="relative h-full max-w-7xl mx-auto px-6 md:px-8 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="max-w-xl"
        >
          <p className="text-alabaster/80 text-xs md:text-sm tracking-[0.3em] uppercase mb-5">
            Nova Coleção · Atelier Íntimo
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-light text-alabaster leading-[1.05] mb-6">
            Sinta-se na sua melhor versão
          </h1>
          <p className="text-alabaster/85 text-base md:text-lg font-light max-w-md mb-9 leading-relaxed">
            Peças desenhadas para abraçar o seu corpo com conforto, delicadeza e uma sofisticação atemporal.
          </p>
          <a
            href="#produtos"
            className="inline-block bg-alabaster text-bordeaux px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-bordeaux hover:text-alabaster transition-colors duration-300"
          >
            Ver Coleção
          </a>
        </motion.div>
      </div>
    </section>
  );
}