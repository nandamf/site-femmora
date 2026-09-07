import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, Package, Heart, MapPin, LogOut, Trash2 } from "lucide-react";
import api from "@/lib/api";
import StoreLayout from "@/components/store/StoreLayout";
import ProductCard from "@/components/store/ProductCard";
import { useAuth } from "@/lib/AuthContext";
import { formatBRL, ORDER_STATUS_LABEL } from "@/lib/format";

const TABS = [
  { id: "pedidos", label: "Meus Pedidos", icon: Package },
  { id: "favoritos", label: "Favoritos", icon: Heart },
  { id: "enderecos", label: "Endereços", icon: MapPin },
  { id: "dados", label: "Meus Dados", icon: User },
];

export default function Account() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "pedidos";

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  const { data: ordersData } = useQuery({ queryKey: ["my-orders"], queryFn: async () => (await api.get("/orders/mine")).data, enabled: !!user });
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const { data: wishlist } = useQuery({ queryKey: ["my-wishlist"], queryFn: async () => (await api.get("/wishlist")).data, enabled: !!user });
  const { data: addresses = [], refetch: refetchAddr } = useQuery({ queryKey: ["my-addresses"], queryFn: async () => (await api.get("/account/addresses")).data, enabled: !!user });

  if (!user) return <StoreLayout><div className="py-32 text-center text-obsidian/50">Carregando...</div></StoreLayout>;

  const doLogout = async () => { await logout(); navigate("/"); };

  return (
    <StoreLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <h1 className="font-display text-4xl md:text-5xl font-light text-bordeaux mb-1">Olá, {user.name?.split(" ")[0]}</h1>
        <p className="text-sm text-obsidian/50 mb-10">{user.email}</p>

        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          <aside className="flex lg:flex-col gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setParams({ tab: t.id })} data-testid={`tab-${t.id}`}
                className={`flex items-center gap-3 px-4 py-3 text-sm text-left whitespace-nowrap ${tab === t.id ? "bg-bordeaux text-alabaster" : "text-obsidian/70 hover:bg-quartz/40"}`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
            <button onClick={doLogout} className="flex items-center gap-3 px-4 py-3 text-sm text-left text-obsidian/70 hover:bg-quartz/40" data-testid="logout-btn">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </aside>

          <div>
            {tab === "pedidos" && (
              <div className="space-y-4" data-testid="orders-list">
                {orders.length === 0 ? <p className="text-obsidian/50">Você ainda não tem pedidos.</p> : orders.map((o) => (
                  <div key={o.id} className="border border-parchment p-5">
                    <div className="flex flex-wrap justify-between gap-2 mb-3">
                      <span className="font-medium text-bordeaux">{o.number}</span>
                      <span className="text-xs px-3 py-1 bg-quartz/50 text-bordeaux">{ORDER_STATUS_LABEL[o.status] || o.status}</span>
                    </div>
                    <div className="flex gap-3 mb-3 overflow-x-auto">
                      {o.items.map((it, i) => <img key={i} src={it.image} alt={it.name} className="w-14 h-16 object-cover bg-parchment shrink-0" />)}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-obsidian/50">{o.items.length} item(ns)</span>
                      <span className="font-medium">{formatBRL(o.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "favoritos" && (
              <div>
                {(!wishlist || wishlist.products.length === 0) ? <p className="text-obsidian/50">Nenhum favorito ainda. <Link to="/produtos" className="text-bordeaux underline">Explore a coleção</Link></p> : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6" data-testid="wishlist-grid">
                    {wishlist.products.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                )}
              </div>
            )}

            {tab === "enderecos" && <AddressManager addresses={addresses} refetch={refetchAddr} />}

            {tab === "dados" && <ProfileForm user={user} />}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

const inputCls = "w-full border border-parchment bg-alabaster px-4 py-3 text-sm outline-none focus:border-bordeaux";

function ProfileForm({ user }) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saved, setSaved] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    await api.put("/account/profile", { name, phone });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  const requestDeletion = async () => {
    if (!window.confirm("Deseja solicitar a exclusão dos seus dados (LGPD)?")) return;
    await api.delete("/account/data");
    alert("Solicitação registrada. Entraremos em contato.");
  };
  return (
    <form onSubmit={save} className="max-w-md space-y-3">
      <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" data-testid="profile-name" />
      <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" />
      <input className={inputCls + " opacity-60"} value={user.email} disabled />
      {saved && <p className="text-sm text-bordeaux">Dados salvos!</p>}
      <button className="bg-bordeaux text-alabaster px-8 py-3 text-xs tracking-[0.2em] uppercase" data-testid="save-profile">Salvar</button>
      <button type="button" onClick={requestDeletion} className="block text-xs text-obsidian/50 underline mt-6">Solicitar exclusão dos meus dados (LGPD)</button>
    </form>
  );
}

function AddressManager({ addresses, refetch }) {
  const [form, setForm] = useState({ cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
  const [adding, setAdding] = useState(false);
  const add = async (e) => {
    e.preventDefault();
    await api.post("/account/addresses", form);
    setForm({ cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
    setAdding(false); refetch();
  };
  const remove = async (id) => { await api.delete(`/account/addresses/${id}`); refetch(); };
  return (
    <div>
      <div className="space-y-3 mb-6">
        {addresses.length === 0 && <p className="text-obsidian/50">Nenhum endereço cadastrado.</p>}
        {addresses.map((a) => (
          <div key={a.id} className="border border-parchment p-4 flex justify-between items-start">
            <div className="text-sm text-obsidian/70">
              <p>{a.street}, {a.number} {a.complement}</p>
              <p>{a.district} · {a.city}/{a.state} · {a.cep}</p>
            </div>
            <button onClick={() => remove(a.id)} className="text-obsidian/40 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <form onSubmit={add} className="max-w-md space-y-3">
          <input required className={inputCls} placeholder="CEP" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
          <input required className={inputCls} placeholder="Rua" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input required className={inputCls} placeholder="Número" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            <input className={inputCls} placeholder="Complemento" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
          </div>
          <input required className={inputCls} placeholder="Bairro" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input required className={inputCls} placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input required maxLength={2} className={inputCls} placeholder="UF" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
          </div>
          <div className="flex gap-2">
            <button className="bg-bordeaux text-alabaster px-6 py-2.5 text-xs tracking-wider uppercase">Salvar</button>
            <button type="button" onClick={() => setAdding(false)} className="border border-parchment px-6 py-2.5 text-xs tracking-wider uppercase">Cancelar</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="border border-bordeaux text-bordeaux px-8 py-3 text-xs tracking-[0.2em] uppercase" data-testid="add-address-btn">+ Novo Endereço</button>
      )}
    </div>
  );
}
