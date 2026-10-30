import { useQueryClient } from '@tanstack/react-query';
import { Badge, Button } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import { billingKeys, listInvoices } from '@/features/billing';
import { inventoryKeys, listProductsByStore } from '@/features/inventory';
import {
  Armchair,
  Smartphone,
  Store,
  User,
  Building2,
  Hash,
  ArrowRight,
  TrendingUp,
  Receipt,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

function StoreIcon({ code }) {
  if (code === 'mobiles') return <Smartphone size={20} />;
  if (code === 'furniture-electronics') return <Armchair size={20} />;
  return <Store size={20} />;
}

export function StorePickerCard({ store, analytics, onOpen }) {
  const queryClient = useQueryClient();
  const displayName = store.display_name || store.name;
  const sales = analytics?.sales ?? 0;
  const invoiceCount = analytics?.invoiceCount ?? 0;
  const lowStockCount = analytics?.lowStockCount ?? 0;

  const handlePrefetch = () => {
    // Speculatively preload the Store Dashboard route module chunk
    import('@/features/launcher').then((m) => m.StoreDashboardPage).catch(() => {});

    // Pre-warm the store-specific queries in cache
    if (store?.id) {
      queryClient.prefetchQuery({
        queryKey: billingKeys.invoices(store.id),
        queryFn: () => listInvoices({ storeId: store.id }),
        staleTime: 1000 * 60 * 3,
      });
      queryClient.prefetchQuery({
        queryKey: inventoryKeys.products(store.id, {}),
        queryFn: () => listProductsByStore({ storeId: store.id }),
        staleTime: 1000 * 60 * 3,
      });
    }
  };

  return (
    <article
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      className="rounded-xl border border-border bg-surface p-5 flex flex-col justify-between min-w-0 transition-colors hover:border-text/30 shadow-2xs"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg border border-border bg-bg flex items-center justify-center text-text shrink-0">
              <StoreIcon code={store.code} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-text truncate">{displayName}</h2>
              <p className="text-xs text-muted truncate">{store.trade_name || store.name}</p>
            </div>
          </div>
          <Badge variant="sage" className="text-[10px] font-medium shrink-0">
            Active
          </Badge>
        </div>

        {/* Essential Store Details */}
        <div className="mt-4 grid grid-cols-3 gap-2 min-w-0">
          <div className="rounded-lg border border-border bg-surface-subtle p-2.5 min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted">
              <User size={11} className="shrink-0" />
              <span className="truncate">Manager</span>
            </div>
            <p className="mt-1 text-xs font-medium text-text truncate" title={store.manager_name}>
              {store.manager_name || '—'}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-subtle p-2.5 min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted">
              <Building2 size={11} className="shrink-0" />
              <span className="truncate">City</span>
            </div>
            <p className="mt-1 text-xs font-medium text-text truncate" title={store.city}>
              {store.city || '—'}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-subtle p-2.5 min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted">
              <Hash size={11} className="shrink-0" />
              <span className="truncate">GSTIN</span>
            </div>
            <p className="mt-1 font-mono text-[11px] font-medium text-text truncate" title={store.gstin}>
              {store.gstin || '—'}
            </p>
          </div>
        </div>

        {/* Concise Store Analytics Strip (Required Only) */}
        <div className="mt-3 rounded-lg border border-border bg-surface-subtle p-3 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2">
            Store Performance (This Month)
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[10px] text-muted">
                <TrendingUp size={11} className="text-brand-sage shrink-0" />
                <span className="truncate">Sales</span>
              </div>
              <div className="mt-0.5 text-xs font-medium text-text truncate">
                {formatCurrency(sales)}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[10px] text-muted">
                <Receipt size={11} className="shrink-0" />
                <span className="truncate">Orders</span>
              </div>
              <div className="mt-0.5 text-xs font-medium text-text truncate">
                {invoiceCount} bills
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[10px] text-muted">
                {lowStockCount > 0 ? (
                  <AlertTriangle size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 size={11} className="text-brand-sage shrink-0" />
                )}
                <span className="truncate">Stock Health</span>
              </div>
              <div className="mt-0.5 text-xs font-medium truncate">
                {lowStockCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">{lowStockCount} low alert</span>
                ) : (
                  <span className="text-brand-sage font-medium">Optimal</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-5">
        <Button
          variant="solid"
          onClick={onOpen}
          className="w-full rounded-lg text-xs font-medium cursor-pointer gap-2"
        >
          <span>Enter store</span>
          <ArrowRight size={13} />
        </Button>
      </div>
    </article>
  );
}
