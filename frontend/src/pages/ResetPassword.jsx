import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api, { apiErrorMessage } from "@/lib/api";

const inputCls = "w-full border border-parchment bg-alabaster px-4 py-3 text-sm outline-none focus:border-bordeaux transition-colors";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const token = params.get("token");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (e) {
      setError(apiErrorMessage(e.response?.data?.detail));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-alabaster px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-3xl text-bordeaux block mb-10 text-center">Femmora</Link>
        <h1 className="font-display text-4xl text-bordeaux mb-8">Nova senha</h1>
        {done ? (
          <p className="text-sm text-bordeaux">Senha redefinida! Redirecionando...</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input type="password" required minLength={6} placeholder="Nova senha" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} data-testid="reset-password" />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button type="submit" className="w-full bg-bordeaux text-alabaster py-3.5 text-xs tracking-[0.2em] uppercase" data-testid="reset-submit">Redefinir</button>
          </form>
        )}
      </div>
    </div>
  );
}
