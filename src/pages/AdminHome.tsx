import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AdminHome() {
  const { data } = useAdminAccess();
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-widest text-bordeaux">Femmora</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Área administrativa</h1>
        <p className="mt-3 text-slate-600">
          Acesso protegido. Os módulos operacionais serão adicionados conforme o backlog aprovado.
        </p>
        <p className="mt-6 text-sm text-slate-500">Papéis: {data?.roles.join(", ")}</p>
      </div>
    </main>
  );
}
