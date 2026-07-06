import React from "react";
import { Ruler, RefreshCw, Gift } from "lucide-react";

const ITEMS = [
  {
    icon: Ruler,
    title: "Tabela de Medidas Inteligente",
    text: "Encontre o caimento perfeito com nosso guia personalizado de tamanhos.",
  },
  {
    icon: RefreshCw,
    title: "Troca Fácil e Discreta",
    text: "Primeira troca gratuita, com total privacidade e sem complicação.",
  },
  {
    icon: Gift,
    title: "Embalagem Especial",
    text: "Cada peça chega em embalagem sofisticada, pronta para presentear.",
  },
];

export default function TrustSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border border-bordeaux/30 flex items-center justify-center mb-5">
              <Icon className="w-6 h-6 text-bordeaux" strokeWidth={1.4} />
            </div>
            <h3 className="font-display text-2xl text-bordeaux mb-2">{title}</h3>
            <p className="text-sm text-obsidian/60 max-w-xs leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}