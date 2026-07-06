import React, { useState, useEffect } from "react";
import { Quote } from "lucide-react";

const REVIEWS = [
  {
    text: "O caimento é impecável e o tecido é de uma qualidade que eu nunca tinha sentido. Me sinto poderosa.",
    name: "Marina A.",
    detail: "Body Séduction Bordeaux",
  },
  {
    text: "Conforto de usar o dia inteiro sem perceber. A renda é delicada e a entrega foi super discreta.",
    name: "Camila R.",
    detail: "Bralette Fleur Noir",
  },
  {
    text: "Comprei para presentear e a embalagem é um espetáculo à parte. Elegância do início ao fim.",
    name: "Beatriz L.",
    detail: "Camisola Seda Lumière",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % REVIEWS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const r = REVIEWS[index];

  return (
    <section className="bg-bordeaux text-alabaster py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <Quote className="w-9 h-9 mx-auto mb-8 text-alabaster/40" />
        <p className="font-display text-2xl md:text-4xl font-light leading-snug min-h-[140px] md:min-h-[160px] transition-opacity duration-500">
          “{r.text}”
        </p>
        <div className="mt-8">
          <p className="text-sm tracking-[0.15em] uppercase">{r.name}</p>
          <p className="text-xs text-alabaster/60 mt-1">{r.detail}</p>
        </div>
        <div className="flex justify-center gap-2 mt-8">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Depoimento ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-alabaster" : "w-1.5 bg-alabaster/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}