export default function AdminHome() {
  return (
    <section aria-labelledby="admin-page-title">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bordeaux/60">Administração</p>
      <h1 id="admin-page-title" className="mt-2 font-display text-3xl text-bordeaux sm:text-4xl">
        Visão geral
      </h1>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Estrutura administrativa pronta</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Os módulos operacionais serão adicionados individualmente conforme o backlog aprovado.
          Esta área ainda não consulta dados comerciais.
        </p>
      </div>
    </section>
  );
}
