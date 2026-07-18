type AdminLoadingProps = { label?: string };

export default function AdminLoading({ label = "Carregando área administrativa" }: AdminLoadingProps) {
  return (
    <div className="flex min-h-64 items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-bordeaux/15 border-t-bordeaux" />
        <p className="mt-3 text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}
