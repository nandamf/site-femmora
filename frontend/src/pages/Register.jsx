import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, apiErrorMessage } from "@/lib/AuthContext";

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-alabaster">
      <div className="hidden lg:block relative">
        <img src="https://images.unsplash.com/photo-1777462985111-9da64fb2e6e6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400" alt="Femmora" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-bordeaux/30" />
        <Link to="/" className="absolute top-8 left-8 font-display text-3xl text-alabaster">Femmora</Link>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden font-display text-3xl text-bordeaux block mb-10">Femmora</Link>
          <h1 className="font-display text-4xl text-bordeaux mb-2">{title}</h1>
          <p className="text-sm text-obsidian/60 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full border border-parchment bg-alabaster px-4 py-3 text-sm outline-none focus:border-bordeaux transition-colors";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/conta");
    } catch (e) {
      setError(apiErrorMessage(e.response?.data?.detail));
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Criar conta" subtitle="Junte-se à Femmora">
      <form onSubmit={submit} className="space-y-3">
        <input required placeholder="Nome completo" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="register-name" />
        <input type="email" required placeholder="E-mail" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="register-email" />
        <input type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="register-password" />
        {error && <p className="text-sm text-red-700" data-testid="register-error">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-bordeaux text-alabaster py-3.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-50" data-testid="register-submit">
          {loading ? "Criando..." : "Cadastrar"}
        </button>
      </form>
      <p className="mt-4 text-sm text-obsidian/60">Já tem conta? <Link to="/login" className="text-bordeaux underline">Entrar</Link></p>
    </AuthShell>
  );
}
