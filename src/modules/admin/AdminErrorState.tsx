import { AlertTriangle, RotateCcw } from "lucide-react";

type AdminErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export default function AdminErrorState({
  title = "Não foi possível carregar esta área",
  description = "Tente novamente. Se o problema continuar, informe o suporte.",
  onRetry,
}: AdminErrorStateProps) {
  return (
    <div className="flex min-h-64 items-center justify-center px-4" role="alert">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-bordeaux" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-bordeaux px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-bordeaux focus-visible:ring-offset-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
