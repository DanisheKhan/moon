import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/ui';
import { useStores } from '@/features/stores';
import { useOwnerDashboard } from '@/features/reports';
import { formatCurrency } from '@/shared/lib/format';
import { StorePickerCard } from '../components/StorePickerCard';
import {
  Store,
  TrendingUp,
  Receipt,
  Package,
  Building2,
} from 'lucide-react';

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
  const ownerStores = useMemo(
    () => sortOwnerStores(stores.filter((s) => s.is_active !== false)),
    [stores]
  );

  return (
    <div className="w-full space-y-6 min-w-0 pb-12">
      {/* 1. Standard Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border min-w-0">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">
            ENTERPRISE SCOPE & MULTI-STORE MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Your Stores & Branches
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            Choose a store workspace to manage local operations, or review combined multi-store network analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text shadow-2xs">
            <Store size={14} className="text-brand-sage" />
            <span>
              {ownerStores.length} Active {ownerStores.length === 1 ? 'Store' : 'Stores'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Standard 4-Card Executive KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        {/* KPI 1: Combined Sales */}
        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted block truncate">
              COMBINED SALES
            </span>
            <div className="w-8 h-8 rounded-lg border border-border bg-surface-subtle flex items-center justify-center text-brand-sage shrink-0">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text truncate">
            {formatCurrency(summary.totalSales || 0)}
          </div>
          <span className="text-xs text-muted block truncate">
            Across all branches • This Month
          </span>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted block truncate">
              TOTAL ORDERS
            </span>
            <div className="w-8 h-8 rounded-lg border border-border bg-surface-subtle flex items-center justify-center text-text shrink-0">
              <Receipt size={15} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text truncate">
            {summary.invoiceCount || 0} Bills
          </div>
          <span className="text-xs text-muted block truncate">
            Counter & tax sales settled
          </span>
        </div>

        {/* KPI 3: Store Workspaces */}
        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted block truncate">
              ACTIVE BRANCHES
            </span>
            <div className="w-8 h-8 rounded-lg border border-border bg-surface-subtle flex items-center justify-center text-brand-sage shrink-0">
              <Store size={15} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-brand-sage truncate">
            {ownerStores.length} Stores
          </div>
          <span className="text-xs text-muted block truncate">
            100% operational & online
          </span>
        </div>

        {/* KPI 4: Inventory Valuation */}
        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted block truncate">
              STOCK VALUATION
            </span>
            <div className="w-8 h-8 rounded-lg border border-border bg-surface-subtle flex items-center justify-center text-text shrink-0">
              <Package size={15} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text truncate">
            {formatCurrency(summary.totalInventoryValue || 0)}
          </div>
          <span className="text-xs text-muted block truncate">
            Total on-hand asset value
          </span>
        </div>
      </div>

      {/* 3. Store Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted font-medium">Loading store workspaces...</p>
        </div>
      ) : ownerStores.length === 0 ? (
        <Card className="p-12 text-center space-y-3 border-dashed">
          <Building2 size={32} className="mx-auto text-muted" />
          <h3 className="text-base font-bold text-text">No store branches found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            No active stores are currently available in the system.
          </p>
        </Card>
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
