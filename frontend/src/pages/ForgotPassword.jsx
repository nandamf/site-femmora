import React, { useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "@/lib/api";

const inputCls = "w-full border border-parchment bg-alabaster px-4 py-3 text-sm outline-none focus:border-bordeaux transition-colors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (e) {
      setError(apiErrorMessage(e.response?.data?.detail));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-alabaster px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-3xl text-bordeaux block mb-10 text-center">Femmora</Link>
        <h1 className="font-display text-4xl text-bordeaux mb-2">Recuperar senha</h1>
        <p className="text-sm text-obsidian/60 mb-8">Enviaremos as instruções para o seu e-mail.</p>
        {sent ? (
          <p className="text-sm text-bordeaux">Se o e-mail existir, você receberá o link de redefinição.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input type="email" required placeholder="E-mail" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} data-testid="forgot-email" />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button type="submit" className="w-full bg-bordeaux text-alabaster py-3.5 text-xs tracking-[0.2em] uppercase" data-testid="forgot-submit">Enviar</button>
          </form>
        )}
        <p className="mt-4 text-sm text-center"><Link to="/login" className="text-bordeaux underline">Voltar ao login</Link></p>
      </div>
    </div>
  );
}
