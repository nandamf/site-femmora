import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function AdminLogs() {
  const { data } = useQuery({ queryKey: ["admin-logs"], queryFn: async () => (await api.get("/admin/audit-logs")).data });
  const logs = Array.isArray(data) ? data : [];
  return (
    <div>
      <h1 className="font-display text-4xl text-bordeaux mb-8">Logs & Auditoria</h1>
      <div className="bg-white border border-parchment">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-obsidian/50 border-b border-parchment"><th className="p-4">Data</th><th>Usuário</th><th>Ação</th><th>Descrição</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-parchment/60">
                <td className="p-4 whitespace-nowrap">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                <td>{l.user_email}</td>
                <td><span className="text-xs bg-quartz/50 px-2 py-1 text-bordeaux">{l.action}</span></td>
                <td className="text-obsidian/70">{l.description}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-obsidian/40">Nenhum log registrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
