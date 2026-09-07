import React, { useState } from "react";
import { Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const subscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSent(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-alabaster border-t border-parchment">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-display text-3xl text-bordeaux mb-3">Femmora</h3>
            <p className="text-sm text-obsidian/60 leading-relaxed max-w-xs">
              Lingerie de alta qualidade para celebrar a sua autoestima com conforto e sofisticação.
            </p>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-4">Ajuda</h4>
            <ul className="space-y-3 text-sm text-obsidian/70">
              <li><a href="#produtos" className="hover:text-bordeaux transition-colors">Guia de Tamanhos</a></li>
              <li><a href="#produtos" className="hover:text-bordeaux transition-colors">Políticas de Troca</a></li>
              <li><a href="#produtos" className="hover:text-bordeaux transition-colors">Rastrear Pedido</a></li>
              <li><a href="#produtos" className="hover:text-bordeaux transition-colors">Fale Conosco</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-4">Social</h4>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="w-10 h-10 border border-bordeaux/30 flex items-center justify-center text-bordeaux hover:bg-bordeaux hover:text-alabaster transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-10 h-10 border border-bordeaux/30 flex items-center justify-center text-bordeaux hover:bg-bordeaux hover:text-alabaster transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="text-xs tracking-[0.2em] uppercase text-bordeaux mb-4">Newsletter</h4>
            {sent ? (
              <p className="text-sm text-bordeaux">Obrigada! Fique de olho no seu e-mail 💌</p>
            ) : (
              <form onSubmit={subscribe} className="flex border border-bordeaux/30">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-obsidian/40"
                />
                <button type="submit" className="bg-bordeaux text-alabaster px-4 text-xs tracking-[0.15em] uppercase">
                  Assinar
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-parchment flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-obsidian/50 order-2 md:order-1">
            © {new Date().getFullYear()} Femmora. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 order-1 md:order-2">
            {["Visa", "Master", "Elo", "Pix"].map((p) => (
              <span
                key={p}
                className="text-[10px] font-medium tracking-wide text-obsidian/70 border border-parchment px-2.5 py-1 rounded"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}