import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, apiErrorMessage } from "@/lib/AuthContext";

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-alabaster">
      <div className="hidden lg:block relative">
        <img src="https://images.unsplash.com/photo-1767125336493-cc8d660ef78c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400" alt="Femmora" className="absolute inset-0 w-full h-full object-cover" />
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const u = await login(email, password);
      navigate(u.role === "admin" ? "/admin" : "/conta");
    } catch (e) {
      setError(apiErrorMessage(e.response?.data?.detail));
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Bem-vinda de volta" subtitle="Acesse a sua conta Femmora">
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required placeholder="E-mail" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" />
        <input type="password" required placeholder="Senha" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" />
        {error && <p className="text-sm text-red-700" data-testid="login-error">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-bordeaux text-alabaster py-3.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-50" data-testid="login-submit">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <div className="flex justify-between mt-4 text-sm">
        <Link to="/forgot-password" className="text-obsidian/60 hover:text-bordeaux">Esqueci a senha</Link>
        <Link to="/register" className="text-bordeaux underline">Criar conta</Link>
      </div>
    </AuthShell>
  );
}
