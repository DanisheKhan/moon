import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

export function RouteErrorBoundary() {
  const error = useRouteError();

  const isChunkError =
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('dynamically imported module') ||
    error?.message?.includes('Loading chunk');

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred while rendering this page.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || 'The requested page could not be found or loaded.';
  } else if (isChunkError) {
    title = 'Connection or Update Refresh Needed';
    message =
      'A component could not be loaded, usually because the development server restarted or new assets were deployed.';
  } else if (error?.message) {
    message = error.message;
  }

  function handleReload() {
    window.location.reload();
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-sage-subtle border border-brand-sage-border flex items-center justify-center text-accent">
          <AlertCircle size={28} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text tracking-tight">{title}</h2>
          <p className="text-sm text-text-muted leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="solid"
            onClick={handleReload}
            className="flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <RefreshCw size={15} />
            <span>Reload Page</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => (window.location.href = '/admin')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Home size={15} />
            <span>Go to Admin</span>
          </Button>
        </div>

        {import.meta.env.DEV && error?.stack && (
          <details className="mt-6 text-left border border-border/70 rounded-xl p-3 bg-bg/50">
            <summary className="text-xs font-semibold text-text-muted cursor-pointer hover:text-text select-none">
              Developer Stack Trace
            </summary>
            <pre className="mt-2 text-[11px] font-mono text-text/80 whitespace-pre-wrap break-all overflow-x-auto max-h-48 p-2 rounded bg-surface border border-border">
              {error.stack || String(error)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

