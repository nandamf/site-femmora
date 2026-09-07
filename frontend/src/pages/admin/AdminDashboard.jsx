import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ShoppingBag, Users, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { formatBRL, ORDER_STATUS_LABEL } from "@/lib/format";

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white border border-parchment p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs tracking-[0.15em] uppercase text-obsidian/50">{label}</span>
        <Icon className={`w-5 h-5 ${accent || "text-bordeaux"}`} />
      </div>
      <p className="font-display text-3xl text-bordeaux">{value}</p>
    </div>
  );
}

function Bars({ title, data: rawData }) {
  const data = Array.isArray(rawData) ? rawData : [];
  const max = Math.max(...(data.map((d) => d.value) || [1]), 1);
  return (
    <div className="bg-white border border-parchment p-6">
      <h3 className="text-xs tracking-[0.15em] uppercase text-obsidian/50 mb-4">{title}</h3>
      {data.length === 0 ? <p className="text-sm text-obsidian/40">Sem dados ainda.</p> : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.label}>
              <div className="flex justify-between text-sm mb-1"><span className="text-obsidian/70">{d.label}</span><span className="text-obsidian/50">{d.value}</span></div>
              <div className="h-2 bg-quartz/50"><div className="h-full bg-bordeaux" style={{ width: `${(d.value / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { data } = useQuery({ queryKey: ["admin-dashboard"], queryFn: async () => (await api.get("/admin/dashboard")).data });
  if (!data || typeof data !== "object") return <p className="text-obsidian/50">Carregando...</p>;
  const recentOrders = Array.isArray(data.recent_orders) ? data.recent_orders : [];

  return (
    <div>
      <h1 className="font-display text-4xl text-bordeaux mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <Stat icon={TrendingUp} label="Faturamento" value={formatBRL(data.revenue)} />
        <Stat icon={ShoppingBag} label="Pedidos pagos" value={data.paid_count} />
        <Stat icon={TrendingUp} label="Ticket médio" value={formatBRL(data.avg_ticket)} />
        <Stat icon={Users} label="Clientes" value={data.customers} />
      </div>
      {(data.low_stock_count > 0 || data.out_of_stock_count > 0) && (
        <div className="bg-bordeaux/5 border border-bordeaux/20 p-4 mb-6 flex items-center gap-3 text-sm text-bordeaux">
          <AlertTriangle className="w-5 h-5" /> {data.low_stock_count} variações com estoque baixo · {data.out_of_stock_count} esgotadas
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <Bars title="Produtos mais vendidos" data={data.top_products} />
        <Bars title="Tamanhos mais vendidos" data={data.top_sizes} />
        <Bars title="Cores mais vendidas" data={data.top_colors} />
      </div>
      <div className="bg-white border border-parchment p-6">
        <h3 className="text-xs tracking-[0.15em] uppercase text-obsidian/50 mb-4">Pedidos recentes</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-obsidian/50 border-b border-parchment"><th className="py-2">Pedido</th><th>Cliente</th><th>Status</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} className="border-b border-parchment/60">
                <td className="py-2.5">{o.number}</td>
                <td>{o.customer?.name}</td>
                <td>{ORDER_STATUS_LABEL[o.status] || o.status}</td>
                <td className="text-right">{formatBRL(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
