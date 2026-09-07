import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatBRL } from "@/lib/format";

export default function AdminCustomers() {
  const { data } = useQuery({ queryKey: ["admin-customers"], queryFn: async () => (await api.get("/admin/customers")).data });
  const customers = Array.isArray(data) ? data : [];
  return (
    <div>
      <h1 className="font-display text-4xl text-bordeaux mb-8">Clientes</h1>
      <div className="bg-white border border-parchment">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-obsidian/50 border-b border-parchment"><th className="p-4">Nome</th><th>E-mail</th><th>Pedidos</th><th>Total gasto</th><th>Último pedido</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-parchment/60">
                <td className="p-4 text-bordeaux">{c.name}</td>
                <td>{c.email}</td>
                <td>{c.orders_count}</td>
                <td>{formatBRL(c.total_spent)}</td>
                <td>{c.last_order ? new Date(c.last_order).toLocaleDateString("pt-BR") : "—"}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-obsidian/40">Nenhum cliente ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
