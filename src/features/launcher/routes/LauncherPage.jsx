import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/ui';
import { useStores } from '@/features/stores';
import { useOwnerDashboard } from '@/features/reports';
import { formatCurrency } from '@/shared/lib/format';
import { StorePickerCard } from '../components/StorePickerCard';
import { TrendingUp, Receipt, ShieldCheck, Sparkles } from 'lucide-react';

function sortOwnerStores(stores) {
  const rank = (store) => {
    if (store.code === 'furniture-electronics') return 0;
    if (store.code === 'mobiles') return 1;
    return 2;
  };
  return [...stores].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export function LauncherPage() {
  const navigate = useNavigate();
  const { data: stores = [], isLoading } = useStores();
  const { data: dashboardData } = useOwnerDashboard('month');

  const storesMetrics = dashboardData?.stores || {};
  const summary = dashboardData?.summary || {};
  const ownerStores = sortOwnerStores(stores.filter((s) => s.is_active !== false));

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 min-w-0 pb-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="text-[11px] font-semibold">
              Owner portal
            </Badge>
            <span className="text-xs text-muted font-medium flex items-center gap-1">
              <Sparkles size={12} className="text-brand-sage" /> Enterprise Multi-Store
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text">
            Your Stores & Branches
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            Choose a store workspace to manage local operations, or review the synchronized 2-store analytics below.
          </p>
        </div>
        <div className="text-xs text-muted font-medium shrink-0 bg-surface border border-border px-3 py-1.5 rounded-lg shadow-2xs">
          {ownerStores.length} active {ownerStores.length === 1 ? 'store' : 'stores'}
        </div>
      </div>

      {/* Consolidated 2-Store Pulse */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-sage ring-2 ring-brand-sage/20 shrink-0" />
            <span className="text-xs font-semibold text-text">Combined Network Analytics</span>
            <span className="text-[11px] text-muted">Across All Branches • Current Month</span>
          </div>
          <div className="text-[10px] text-muted font-mono font-medium">
            Auto-synchronized
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-muted flex items-center gap-1.5">
              <TrendingUp size={13} className="text-brand-sage shrink-0" />
              <span className="truncate">Combined Sales</span>
            </div>
            <div className="text-lg sm:text-xl font-semibold text-text mt-0.5 truncate">
              {formatCurrency(summary.totalSales || 0)}
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-muted flex items-center gap-1.5">
              <Receipt size={13} className="text-muted shrink-0" />
              <span className="truncate">Total Orders</span>
            </div>
            <div className="text-lg sm:text-xl font-semibold text-text mt-0.5 truncate">
              {summary.invoiceCount || 0} Bills
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-muted flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-muted shrink-0" />
              <span className="truncate">Inventory Valuation</span>
            </div>
            <div className="text-lg sm:text-xl font-semibold text-text mt-0.5 truncate">
              {formatCurrency(summary.totalInventoryValue || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Stores Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted font-medium">Loading your stores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0">
          {ownerStores.map((store) => (
            <StorePickerCard
              key={store.id}
              store={store}
              analytics={storesMetrics[store.code]}
              onOpen={() => navigate(`/admin/${store.code}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
