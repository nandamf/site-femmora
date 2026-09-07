import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Archive } from "lucide-react";
import api from "@/lib/api";
import { formatBRL } from "@/lib/format";

export default function AdminProducts() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["admin-products"], queryFn: async () => (await api.get("/admin/products")).data });
  const products = Array.isArray(data) ? data : [];

  const archive = async (id) => {
    if (!window.confirm("Arquivar este produto?")) return;
    await api.delete(`/admin/products/${id}`);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-4xl text-bordeaux">Produtos</h1>
        <Link to="/admin/produtos/novo" data-testid="new-product-btn" className="flex items-center gap-2 bg-bordeaux text-alabaster px-6 py-3 text-xs tracking-[0.15em] uppercase">
          <Plus className="w-4 h-4" /> Novo Produto
        </Link>
      </div>
      <div className="bg-white border border-parchment">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-obsidian/50 border-b border-parchment">
            <th className="p-4">Produto</th><th>SKU</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-parchment/60 hover:bg-quartz/20" data-testid={`admin-product-${p.sku}`}>
                <td className="p-4 flex items-center gap-3">
                  {p.image && <img src={p.image} alt="" className="w-10 h-12 object-cover bg-parchment" />}
                  <span className="text-bordeaux">{p.name}</span>
                </td>
                <td>{p.sku}</td>
                <td>{p.category}</td>
                <td>{formatBRL(p.price)}</td>
                <td>
                  <span className={p.total_available === 0 ? "text-red-700" : p.low_stock ? "text-bordeaux" : ""}>{p.total_available}</span>
                </td>
                <td><span className={`text-xs px-2 py-1 ${p.status === "active" ? "bg-green-100 text-green-800" : "bg-parchment text-obsidian/60"}`}>{p.status}</span></td>
                <td className="pr-4">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => navigate(`/admin/produtos/${p.id}`)} className="p-2 text-obsidian/60 hover:text-bordeaux" data-testid={`edit-${p.sku}`}><Edit className="w-4 h-4" /></button>
                    <button onClick={() => archive(p.id)} className="p-2 text-obsidian/60 hover:text-red-700"><Archive className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
