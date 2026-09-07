import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import api, { apiErrorMessage } from "@/lib/api";
import { formatBRL } from "@/lib/format";

const input = "border border-parchment bg-white px-3 py-2.5 text-sm outline-none focus:border-bordeaux";

export default function AdminCoupons() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-coupons"], queryFn: async () => (await api.get("/admin/coupons")).data });
  const coupons = Array.isArray(data) ? data : [];
  const [form, setForm] = useState({ code: "", type: "percent", value: "", min_subtotal: "", usage_limit: "" });
  const [error, setError] = useState("");

  const create = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/coupons", {
        code: form.code, type: form.type, value: parseFloat(form.value),
        min_subtotal: parseFloat(form.min_subtotal) || 0,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      });
      setForm({ code: "", type: "percent", value: "", min_subtotal: "", usage_limit: "" });
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch (err) { setError(apiErrorMessage(err.response?.data?.detail)); }
  };
  const remove = async (id) => { await api.delete(`/admin/coupons/${id}`); qc.invalidateQueries({ queryKey: ["admin-coupons"] }); };

  return (
    <div>
      <h1 className="font-display text-4xl text-bordeaux mb-8">Cupons</h1>
      <form onSubmit={create} className="bg-white border border-parchment p-6 mb-6 flex flex-wrap gap-3 items-end">
        <input required placeholder="CÓDIGO" className={input} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} data-testid="coupon-code" />
        <select className={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="percent">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option>
        </select>
        <input required type="number" step="0.01" placeholder="Valor" className={input} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} data-testid="coupon-value" />
        <input type="number" step="0.01" placeholder="Mín. subtotal" className={input} value={form.min_subtotal} onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })} />
        <input type="number" placeholder="Limite de uso" className={input} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
        <button className="bg-bordeaux text-alabaster px-6 py-2.5 text-xs tracking-[0.15em] uppercase flex items-center gap-1.5" data-testid="create-coupon"><Plus className="w-4 h-4" /> Criar</button>
        {error && <p className="w-full text-sm text-red-700">{error}</p>}
      </form>
      <div className="bg-white border border-parchment">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-obsidian/50 border-b border-parchment"><th className="p-4">Código</th><th>Desconto</th><th>Mínimo</th><th>Usos</th><th></th></tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-parchment/60">
                <td className="p-4 font-medium text-bordeaux">{c.code}</td>
                <td>{c.type === "percent" ? `${c.value}%` : formatBRL(c.value)}</td>
                <td>{c.min_subtotal ? formatBRL(c.min_subtotal) : "—"}</td>
                <td>{c.used_count || 0}{c.usage_limit ? `/${c.usage_limit}` : ""}</td>
                <td className="pr-4 text-right"><button onClick={() => remove(c.id)} className="text-obsidian/40 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
