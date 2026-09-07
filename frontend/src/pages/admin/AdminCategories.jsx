import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";

const input = "border border-parchment bg-white px-3 py-2.5 text-sm outline-none focus:border-bordeaux";

export default function AdminCategories() {
  const qc = useQueryClient();
  const { data: categoriesData } = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get("/categories")).data });
  const { data: collectionsData } = useQuery({ queryKey: ["collections"], queryFn: async () => (await api.get("/collections")).data });
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const collections = Array.isArray(collectionsData) ? collectionsData : [];
  const [cat, setCat] = useState({ name: "", image: "", description: "" });
  const [col, setCol] = useState({ name: "" });

  const addCat = async (e) => { e.preventDefault(); await api.post("/admin/categories", cat); setCat({ name: "", image: "", description: "" }); qc.invalidateQueries({ queryKey: ["categories"] }); };
  const delCat = async (id) => { await api.delete(`/admin/categories/${id}`); qc.invalidateQueries({ queryKey: ["categories"] }); };
  const addCol = async (e) => { e.preventDefault(); await api.post("/admin/collections", col); setCol({ name: "" }); qc.invalidateQueries({ queryKey: ["collections"] }); };
  const delCol = async (id) => { await api.delete(`/admin/collections/${id}`); qc.invalidateQueries({ queryKey: ["collections"] }); };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <h1 className="font-display text-4xl text-bordeaux mb-6">Categorias</h1>
        <form onSubmit={addCat} className="bg-white border border-parchment p-5 mb-5 space-y-3">
          <input required placeholder="Nome" className={input + " w-full"} value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} data-testid="cat-name" />
          <input placeholder="URL da imagem" className={input + " w-full"} value={cat.image} onChange={(e) => setCat({ ...cat, image: e.target.value })} />
          <input placeholder="Descrição" className={input + " w-full"} value={cat.description} onChange={(e) => setCat({ ...cat, description: e.target.value })} />
          <button className="bg-bordeaux text-alabaster px-5 py-2.5 text-xs tracking-[0.15em] uppercase flex items-center gap-1.5" data-testid="add-cat"><Plus className="w-4 h-4" /> Adicionar</button>
        </form>
        <div className="bg-white border border-parchment divide-y divide-parchment/60">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              {c.image && <img src={c.image} alt="" className="w-10 h-12 object-cover bg-parchment" />}
              <span className="flex-1 text-sm text-bordeaux">{c.name}</span>
              <button onClick={() => delCat(c.id)} className="text-obsidian/40 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h1 className="font-display text-4xl text-bordeaux mb-6">Coleções</h1>
        <form onSubmit={addCol} className="bg-white border border-parchment p-5 mb-5 flex gap-3">
          <input required placeholder="Nome da coleção" className={input + " flex-1"} value={col.name} onChange={(e) => setCol({ name: e.target.value })} data-testid="col-name" />
          <button className="bg-bordeaux text-alabaster px-5 py-2.5 text-xs tracking-[0.15em] uppercase flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add</button>
        </form>
        <div className="bg-white border border-parchment divide-y divide-parchment/60">
          {collections.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <span className="flex-1 text-sm text-bordeaux">{c.name}</span>
              <button onClick={() => delCol(c.id)} className="text-obsidian/40 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
