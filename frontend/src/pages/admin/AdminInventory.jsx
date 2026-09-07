import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import api from "@/lib/api";

export default function AdminInventory() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-products"], queryFn: async () => (await api.get("/admin/products")).data });
  const products = Array.isArray(data) ? data : [];
  const { data: alerts } = useQuery({ queryKey: ["stock-alerts"], queryFn: async () => (await api.get("/admin/inventory/alerts")).data });
  const [selected, setSelected] = useState(null);
  const { data: detail } = useQuery({ queryKey: ["admin-product-detail", selected], queryFn: async () => (await api.get(`/admin/products/${selected}`)).data, enabled: !!selected });

  const adjust = async (variant, value) => {
    await api.post("/admin/inventory/adjust", { product_id: selected, variant_id: variant.id, new_on_hand: parseInt(value), reason: "Ajuste via painel" });
    qc.invalidateQueries({ queryKey: ["admin-product-detail", selected] });
    qc.invalidateQueries({ queryKey: ["stock-alerts"] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-bordeaux mb-8">Estoque</h1>

      {alerts && (alerts.low_stock.length > 0 || alerts.out_of_stock.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-bordeaux/20 p-5">
            <h3 className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-bordeaux mb-3"><AlertTriangle className="w-4 h-4" /> Estoque baixo ({alerts.low_stock.length})</h3>
            <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
              {alerts.low_stock.map((a, i) => <p key={i} className="text-obsidian/70">{a.name} · {a.size}/{a.color} — <b>{a.available}</b></p>)}
            </div>
          </div>
          <div className="bg-white border border-red-200 p-5">
            <h3 className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-red-700 mb-3"><AlertTriangle className="w-4 h-4" /> Esgotados ({alerts.out_of_stock.length})</h3>
            <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
              {alerts.out_of_stock.map((a, i) => <p key={i} className="text-obsidian/70">{a.name} · {a.size}/{a.color}</p>)}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <div className="bg-white border border-parchment max-h-[520px] overflow-y-auto">
          {products.map((p) => (
            <button key={p.id} onClick={() => setSelected(p.id)} className={`w-full text-left px-4 py-3 text-sm border-b border-parchment/60 ${selected === p.id ? "bg-quartz/40 text-bordeaux" : "text-obsidian/70"}`} data-testid={`inv-product-${p.sku}`}>
              {p.name} <span className="block text-xs text-obsidian/40">{p.total_available} un.</span>
            </button>
          ))}
        </div>
        <div className="bg-white border border-parchment p-6">
          {!detail ? <p className="text-obsidian/40">Selecione um produto para ajustar o estoque por variação.</p> : (
            <>
              <h2 className="font-display text-2xl text-bordeaux mb-4">{detail.name}</h2>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-obsidian/50 border-b border-parchment"><th className="py-2">SKU</th><th>Tam</th><th>Cor</th><th>Reservado</th><th>Em estoque</th></tr></thead>
                <tbody>
                  {detail.variants.map((v) => (
                    <tr key={v.id} className="border-b border-parchment/60">
                      <td className="py-2.5">{v.sku}</td><td>{v.size}</td><td>{v.color}</td><td>{v.reserved || 0}</td>
                      <td>
                        <input type="number" defaultValue={v.on_hand} className="w-20 border border-parchment px-2 py-1" data-testid={`stock-input-${v.sku}`}
                          onBlur={(e) => { if (parseInt(e.target.value) !== v.on_hand) adjust(v, e.target.value); }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-obsidian/40 mt-3">Edite a quantidade e clique fora do campo para salvar. Movimentações são registradas no histórico.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
