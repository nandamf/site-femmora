import React from "react";
import { X } from "lucide-react";

export default function SizeGuideModal({ rows = [], onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="size-guide-modal">
      <div className="absolute inset-0 bg-obsidian/50" onClick={onClose} />
      <div className="relative bg-alabaster w-full max-w-lg p-8 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-bordeaux" aria-label="Fechar"><X className="w-5 h-5" /></button>
        <h3 className="font-display text-3xl text-bordeaux mb-2">Guia de Tamanhos</h3>
        <p className="text-sm text-obsidian/60 mb-6">Meça-se sem roupas ou com peças leves. Use uma fita métrica.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bordeaux/20 text-left text-bordeaux">
              <th className="py-2">Tamanho</th><th className="py-2">Busto</th><th className="py-2">Cintura</th><th className="py-2">Quadril</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className="border-b border-parchment">
                <td className="py-2.5 font-medium">{r.size}</td>
                <td className="py-2.5">{r.bust}</td>
                <td className="py-2.5">{r.waist}</td>
                <td className="py-2.5">{r.hips}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
