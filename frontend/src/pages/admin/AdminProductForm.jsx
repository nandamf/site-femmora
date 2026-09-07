import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import api, { apiErrorMessage } from "@/lib/api";

const input = "w-full border border-parchment bg-white px-3 py-2.5 text-sm outline-none focus:border-bordeaux";
const label = "block text-xs tracking-[0.12em] uppercase text-obsidian/50 mb-1.5";

const emptyProduct = {
  name: "", sku: "", short_description: "", description: "", category: "", collection: "",
  price: "", compare_at_price: "", status: "active", is_featured: false, is_new: false,
  low_stock_threshold: 3, composition: "", care: "",
  variants: [], images: [], size_guide: [], tags: [],
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = id && id !== "novo";
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProduct);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: categoriesData } = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get("/categories")).data });
  const { data: collectionsData } = useQuery({ queryKey: ["collections"], queryFn: async () => (await api.get("/collections")).data });
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const collections = Array.isArray(collectionsData) ? collectionsData : [];

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/products/${id}`).then(({ data }) => {
        setForm({
          ...emptyProduct, ...data,
          price: data.price ?? "", compare_at_price: data.compare_at_price ?? "",
          variants: data.variants || [], images: data.images || [], size_guide: data.size_guide || [], tags: data.tags || [],
        });
      });
    }
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addVariant = () => set("variants", [...form.variants, { sku: "", size: "", color: "", color_hex: "#cccccc", price: "", on_hand: 0, low_stock_threshold: 3 }]);
  const updVariant = (i, k, v) => set("variants", form.variants.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const delVariant = (i) => set("variants", form.variants.filter((_, idx) => idx !== i));

  const addImage = () => set("images", [...form.images, { url: "", alt: "", role: form.images.length === 0 ? "primary" : "gallery", sort_order: form.images.length }]);
  const updImage = (i, k, v) => set("images", form.images.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const delImage = (i) => set("images", form.images.filter((_, idx) => idx !== i));

  const addGuide = () => set("size_guide", [...form.size_guide, { size: "", bust: "", waist: "", hips: "" }]);
  const updGuide = (i, k, v) => set("size_guide", form.size_guide.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const delGuide = (i) => set("size_guide", form.size_guide.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 3,
      variants: form.variants.map((v) => ({
        ...v, price: v.price ? parseFloat(v.price) : null,
        compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        on_hand: parseInt(v.on_hand) || 0, low_stock_threshold: parseInt(v.low_stock_threshold) || 3,
      })),
    };
    try {
      if (isEdit) await api.put(`/admin/products/${id}`, payload);
      else await api.post("/admin/products", payload);
      navigate("/admin/produtos");
    } catch (err) {
      setError(apiErrorMessage(err.response?.data?.detail));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-4xl">
      <h1 className="font-display text-4xl text-bordeaux mb-8">{isEdit ? "Editar Produto" : "Novo Produto"}</h1>
      {error && <p className="bg-red-50 text-red-700 p-3 text-sm mb-5" data-testid="product-form-error">{error}</p>}

      <section className="bg-white border border-parchment p-6 mb-6">
        <h2 className="text-xs tracking-[0.15em] uppercase text-bordeaux mb-4">Geral</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={label}>Nome</label><input required className={input} value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="pf-name" /></div>
          <div><label className={label}>SKU</label><input required className={input} value={form.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} data-testid="pf-sku" /></div>
          <div><label className={label}>Categoria</label>
            <select required className={input} value={form.category} onChange={(e) => set("category", e.target.value)} data-testid="pf-category">
              <option value="">Selecione</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div><label className={label}>Coleção</label>
            <select className={input} value={form.collection || ""} onChange={(e) => set("collection", e.target.value)}>
              <option value="">Nenhuma</option>
              {collections.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4"><label className={label}>Descrição curta</label><input className={input} value={form.short_description} onChange={(e) => set("short_description", e.target.value)} /></div>
        <div className="mt-4"><label className={label}>Descrição</label><textarea rows={4} className={input} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
      </section>

      <section className="bg-white border border-parchment p-6 mb-6">
        <h2 className="text-xs tracking-[0.15em] uppercase text-bordeaux mb-4">Preço & Status</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div><label className={label}>Preço (R$)</label><input required type="number" step="0.01" className={input} value={form.price} onChange={(e) => set("price", e.target.value)} data-testid="pf-price" /></div>
          <div><label className={label}>Preço "de" (promo)</label><input type="number" step="0.01" className={input} value={form.compare_at_price} onChange={(e) => set("compare_at_price", e.target.value)} /></div>
          <div><label className={label}>Status</label>
            <select className={input} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="active">Ativo</option><option value="draft">Rascunho</option><option value="archived">Arquivado</option>
            </select>
          </div>
          <div><label className={label}>Estoque mínimo</label><input type="number" className={input} value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} /></div>
        </div>
        <div className="flex gap-6 mt-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="accent-bordeaux" /> Destaque</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_new} onChange={(e) => set("is_new", e.target.checked)} className="accent-bordeaux" /> Novidade</label>
        </div>
      </section>

      <section className="bg-white border border-parchment p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs tracking-[0.15em] uppercase text-bordeaux">Variações (tamanho + cor + estoque)</h2>
          <button type="button" onClick={addVariant} className="flex items-center gap-1.5 text-xs text-bordeaux" data-testid="add-variant"><Plus className="w-4 h-4" /> Adicionar</button>
        </div>
        {form.variants.length === 0 && <p className="text-sm text-obsidian/40">Nenhuma variação. Adicione ao menos uma.</p>}
        <div className="space-y-2">
          {form.variants.map((v, i) => (
            <div key={i} className="grid grid-cols-[1.4fr_0.8fr_1fr_0.6fr_0.9fr_0.7fr_auto] gap-2 items-center" data-testid={`variant-row-${i}`}>
              <input placeholder="SKU" className={input} value={v.sku} onChange={(e) => updVariant(i, "sku", e.target.value.toUpperCase())} />
              <input placeholder="Tam" className={input} value={v.size || ""} onChange={(e) => updVariant(i, "size", e.target.value)} />
              <input placeholder="Cor" className={input} value={v.color || ""} onChange={(e) => updVariant(i, "color", e.target.value)} />
              <input type="color" className="w-full h-10 border border-parchment" value={v.color_hex || "#cccccc"} onChange={(e) => updVariant(i, "color_hex", e.target.value)} />
              <input type="number" step="0.01" placeholder="Preço" className={input} value={v.price ?? ""} onChange={(e) => updVariant(i, "price", e.target.value)} />
              <input type="number" placeholder="Qtd" className={input} value={v.on_hand} onChange={(e) => updVariant(i, "on_hand", e.target.value)} />
              <button type="button" onClick={() => delVariant(i)} className="text-obsidian/40 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <p className="text-xs text-obsidian/40 mt-2">Deixe o preço da variação em branco para usar o preço base.</p>
      </section>

      <section className="bg-white border border-parchment p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs tracking-[0.15em] uppercase text-bordeaux">Imagens</h2>
          <button type="button" onClick={addImage} className="flex items-center gap-1.5 text-xs text-bordeaux" data-testid="add-image"><Plus className="w-4 h-4" /> Adicionar</button>
        </div>
        <div className="space-y-2">
          {form.images.map((im, i) => (
            <div key={i} className="grid grid-cols-[60px_2fr_1fr_1fr_auto] gap-2 items-center">
              <div className="w-14 h-14 bg-parchment overflow-hidden">{im.url && <img src={im.url} alt="" className="w-full h-full object-cover" />}</div>
              <input placeholder="URL da imagem" className={input} value={im.url} onChange={(e) => updImage(i, "url", e.target.value)} />
              <input placeholder="Texto alt" className={input} value={im.alt} onChange={(e) => updImage(i, "alt", e.target.value)} />
              <select className={input} value={im.role} onChange={(e) => updImage(i, "role", e.target.value)}>
                <option value="primary">Principal</option><option value="hover">Hover</option><option value="gallery">Galeria</option>
              </select>
              <button type="button" onClick={() => delImage(i)} className="text-obsidian/40 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-parchment p-6 mb-6">
        <h2 className="text-xs tracking-[0.15em] uppercase text-bordeaux mb-4">Informações</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={label}>Composição</label><textarea rows={3} className={input} value={form.composition} onChange={(e) => set("composition", e.target.value)} /></div>
          <div><label className={label}>Cuidados</label><textarea rows={3} className={input} value={form.care} onChange={(e) => set("care", e.target.value)} /></div>
        </div>
        <div className="flex justify-between items-center mt-6 mb-3">
          <h3 className="text-xs tracking-[0.15em] uppercase text-obsidian/50">Tabela de Medidas</h3>
          <button type="button" onClick={addGuide} className="flex items-center gap-1.5 text-xs text-bordeaux"><Plus className="w-4 h-4" /> Linha</button>
        </div>
        <div className="space-y-2">
          {form.size_guide.map((g, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
              <input placeholder="Tamanho" className={input} value={g.size} onChange={(e) => updGuide(i, "size", e.target.value)} />
              <input placeholder="Busto" className={input} value={g.bust} onChange={(e) => updGuide(i, "bust", e.target.value)} />
              <input placeholder="Cintura" className={input} value={g.waist} onChange={(e) => updGuide(i, "waist", e.target.value)} />
              <input placeholder="Quadril" className={input} value={g.hips} onChange={(e) => updGuide(i, "hips", e.target.value)} />
              <button type="button" onClick={() => delGuide(i)} className="text-obsidian/40 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-bordeaux text-alabaster px-10 py-3.5 text-xs tracking-[0.2em] uppercase disabled:opacity-50" data-testid="save-product">{saving ? "Salvando..." : "Publicar"}</button>
        <button type="button" onClick={() => navigate("/admin/produtos")} className="border border-parchment px-10 py-3.5 text-xs tracking-[0.2em] uppercase">Cancelar</button>
      </div>
    </form>
  );
}
