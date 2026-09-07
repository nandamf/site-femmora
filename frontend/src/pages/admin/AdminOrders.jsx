import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatBRL, ORDER_STATUS_LABEL } from "@/lib/format";

const STATUSES = ["aguardando_pagamento", "pagamento_aprovado", "em_preparacao", "enviado", "entregue", "cancelado", "devolvido"];

export default function AdminOrders() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const { data } = useQuery({ queryKey: ["admin-orders"], queryFn: async () => (await api.get("/admin/orders")).data });
  const orders = Array.isArray(data) ? data : [];

  const changeStatus = async (id, status) => {
    await api.put(`/admin/orders/${id}/status`, { status });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-bordeaux mb-8">Pedidos</h1>
      <div className="bg-white border border-parchment">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-obsidian/50 border-b border-parchment">
            <th className="p-4">Pedido</th><th>Cliente</th><th>Data</th><th>Pgto</th><th>Status</th><th className="text-right pr-4">Total</th>
          </tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-parchment/60 hover:bg-quartz/20 cursor-pointer" onClick={() => setSelected(o)} data-testid={`order-${o.number}`}>
                <td className="p-4 text-bordeaux">{o.number}</td>
                <td>{o.customer?.name}</td>
                <td>{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                <td><span className={`text-xs ${o.payment_status === "paid" ? "text-green-700" : "text-obsidian/50"}`}>{o.payment_status === "paid" ? "Pago" : "Pendente"}</span></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} className="text-xs border border-parchment px-2 py-1 bg-white" data-testid={`status-${o.number}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td className="text-right pr-4">{formatBRL(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-obsidian/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto p-8">
            <h2 className="font-display text-3xl text-bordeaux mb-1">{selected.number}</h2>
            <p className="text-sm text-obsidian/50 mb-6">{ORDER_STATUS_LABEL[selected.status]}</p>
            <div className="space-y-4 mb-6">
              {selected.items.map((it, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <img src={it.image} alt="" className="w-12 h-14 object-cover bg-parchment" />
                  <div className="flex-1"><p className="text-bordeaux">{it.name}</p><p className="text-obsidian/50">{it.sku} · {it.color}/{it.size} · {it.qty}x</p></div>
                  <span>{formatBRL(it.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="text-sm space-y-1 border-t border-parchment pt-4 mb-6">
              <div className="flex justify-between"><span className="text-obsidian/50">Subtotal</span><span>{formatBRL(selected.subtotal)}</span></div>
              {selected.discount > 0 && <div className="flex justify-between text-bordeaux"><span>Desconto</span><span>-{formatBRL(selected.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-obsidian/50">Frete</span><span>{formatBRL(selected.shipping)}</span></div>
              <div className="flex justify-between font-medium text-bordeaux"><span>Total</span><span>{formatBRL(selected.total)}</span></div>
            </div>
            <div className="text-sm text-obsidian/70 mb-6">
              <p className="font-medium text-bordeaux mb-1">Cliente</p>
              <p>{selected.customer?.name} · {selected.customer?.email} · {selected.customer?.phone}</p>
              <p className="font-medium text-bordeaux mt-3 mb-1">Entrega</p>
              <p>{selected.address?.street}, {selected.address?.number} — {selected.address?.district}, {selected.address?.city}/{selected.address?.state} — {selected.address?.cep}</p>
            </div>
            <button onClick={() => setSelected(null)} className="border border-parchment px-8 py-3 text-xs tracking-[0.2em] uppercase">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
