import { useParams, Outlet, Link, useLocation } from 'react-router-dom';
import { useStore } from '@/features/stores';
import { Container } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import {
  CreditCard,
  Package,
  RotateCcw,
  ReceiptText,
  ArrowLeft,
  Smartphone,
  Store,
} from 'lucide-react';

export function WorkspaceLayout() {
  const { storeCode } = useParams();
  const location = useLocation();
  const { data: store, isLoading, error } = useStore(storeCode);

  if (isLoading) {
    return (
      <Container size="xl" className="py-16 text-center text-muted">
        Loading store workspace...
      </Container>
    );
  }

  if (error || !store) {
    return (
      <Container size="xl" className="py-16 text-center space-y-4">
        <h2 className="text-xl font-semibold text-danger">Store Workspace Not Found</h2>
        <p className="text-sm text-muted">
          The requested store code "{storeCode}" does not exist or has been disabled.
        </p>
        <Link to="/admin" className="text-sm font-semibold underline">
          Return to Launcher
        </Link>
      </Container>
    );
  }

  const basePath = `/admin/${storeCode}`;
  const isPos = location.pathname === basePath || location.pathname === `${basePath}/`;
  const isInventory = location.pathname === `${basePath}/inventory`;
  const isSecondHand = location.pathname === `${basePath}/second-hand`;
  const isInvoices = location.pathname === `${basePath}/invoices`;

  return (
    <div>
      {/* Store Navigation Subheader (Sticky below top bar) */}
      <div className="border-b border-border bg-surface sticky top-14 z-30 no-print shadow-xs">
        <Container size="xl" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 min-w-0">
          {/* Left: Launcher Breadcrumb & Store Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-bg text-muted hover:text-text hover:bg-surface transition-colors text-xs font-semibold shrink-0"
              title="Return to Launcher"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Launcher</span>
            </Link>

            <div className="h-5 w-px bg-border shrink-0" />

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-text shrink-0">
                {store.code === 'mobiles' ? <Smartphone size={16} /> : <Store size={16} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-medium text-text truncate leading-tight">
                    {store.name}
                  </h2>
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-bg border border-border text-muted">
                    {store.invoice_prefix}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted truncate">
                  GSTIN: <span className="font-mono text-text/80">{store.gstin}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Modern Segmented Tab Capsule */}
          <nav className="inline-flex items-center p-1 rounded-lg bg-bg border border-border overflow-x-auto min-w-0 max-w-full">
            <Link
              to={basePath}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all select-none whitespace-nowrap shrink-0',
                isPos
                  ? 'bg-surface text-text shadow-2xs border border-border/80'
                  : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent'
              )}
            >
              <CreditCard size={13} className={isPos ? 'text-accent' : 'text-muted'} />
              <span>POS Billing</span>
            </Link>

            <Link
              to={`${basePath}/inventory`}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all select-none whitespace-nowrap shrink-0',
                isInventory
                  ? 'bg-surface text-text shadow-2xs border border-border/80'
                  : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent'
              )}
            >
              <Package size={13} className={isInventory ? 'text-accent' : 'text-muted'} />
              <span>Inventory & Serials</span>
            </Link>

            {store.code === 'mobiles' && (
              <Link
                to={`${basePath}/second-hand`}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all select-none whitespace-nowrap shrink-0',
                  isSecondHand
                    ? 'bg-surface text-text shadow-2xs border border-border/80'
                    : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent'
                )}
              >
                <RotateCcw size={13} className={isSecondHand ? 'text-accent' : 'text-muted'} />
                <span>Second-Hand Intake</span>
              </Link>
            )}

            <Link
              to={`${basePath}/invoices`}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all select-none whitespace-nowrap shrink-0',
                isInvoices
                  ? 'bg-surface text-text shadow-2xs border border-border/80'
                  : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent'
              )}
            >
              <ReceiptText size={13} className={isInvoices ? 'text-accent' : 'text-muted'} />
              <span>Invoices</span>
            </Link>
          </nav>
        </Container>
      </div>

      {/* Workspace Page Body */}
      <Container size="xl" className="py-6 min-w-0">
        <Outlet context={{ store }} />
      </Container>
    </div>
  );
}
