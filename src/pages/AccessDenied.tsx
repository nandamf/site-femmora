import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Acesso não autorizado</h1>
        <p className="mt-3 text-slate-600">Sua conta não possui acesso à área administrativa.</p>
        <Link className="mt-6 inline-block text-bordeaux underline" to="/">
          Voltar à loja
        </Link>
      </div>
    </main>
  );
}
