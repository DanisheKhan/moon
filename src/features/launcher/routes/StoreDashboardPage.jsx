import { useState, useMemo } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useStores, useStore } from '@/features/stores';
import { useAllProducts } from '@/features/inventory';
import { useInvoices } from '@/features/billing';
import { useOwnerDashboard } from '@/features/reports';
import { Button, Badge } from '@/shared/ui';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  IndianRupee,
  TrendingUp,
  Receipt,
  PiggyBank,
  AlertTriangle,
  Package,
  ArrowRight,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
];

export function StoreDashboardPage() {
  const navigate = useNavigate();
  const { storeCode: paramStoreCode } = useParams();
  const outletCtx = useOutletContext();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const { data: stores = [] } = useStores();
  const effectiveStoreCode = paramStoreCode || outletCtx?.storeCode || 'mobiles';
  const { data: storeDetail } = useStore(effectiveStoreCode);
  const currentStore = outletCtx?.store || storeDetail || stores.find((s) => s.code === effectiveStoreCode);

  const { data: allProducts = [], isLoading: isProdsLoading } = useAllProducts();
  const { data: invoices = [], isLoading: isInvoicesLoading } = useInvoices(currentStore?.id);

  // Store-isolated products
  const storeProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    const code = effectiveStoreCode;
    const storeId = currentStore?.id;

    return allProducts.filter((p) => {
      if (code === 'mobiles') {
        return (
          p.stores?.code === 'mobiles' ||
          p.stores?.id === 'store-1' ||
          p.store_id === storeId ||
          p.categories?.slug === 'smartphones' ||
          p.categories?.slug === 'accessories' ||
          p.categories?.slug === 'second-hand-phones'
        );
      }
      if (code === 'furniture-electronics') {
        return (
          p.stores?.code === 'furniture-electronics' ||
          p.stores?.id === 'store-2' ||
          p.store_id === storeId ||
          p.categories?.slug === 'televisions' ||
          p.categories?.slug === 'refrigerators' ||
          p.categories?.slug === 'living-room-furniture'
        );
      }
      return p.store_id === storeId || p.stores?.id === storeId;
    });
  }, [allProducts, effectiveStoreCode, currentStore?.id]);

  // Stock alerts - At most 3 items with lowest stock / at or below reorder level
  const stockAlerts = useMemo(() => {
    return storeProducts
      .map((p) => {
        const qty = p.inventory?.[0]?.quantity_on_hand ?? 0;
        const reorder = p.reorder_level ?? 2;
        return {
          ...p,
          currentStock: qty,
          reorderLevel: reorder,
          isCritical: qty <= 1,
        };
      })
      .filter((p) => p.currentStock <= p.reorderLevel)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 3);
  }, [storeProducts]);

  // Live store-specific financials from real transactional data
  const { data: dashboardData } = useOwnerDashboard({
    dateRange: selectedPeriod,
    storeCode: effectiveStoreCode,
  });

  const financialSummary = useMemo(() => {
    if (!dashboardData?.summary) {
      return {
        totalSales: 0,
        totalExpenses: 0,
        totalProfit: 0,
        profitMargin: '0.0',
      };
    }
    const { totalSales = 0, totalCogs = 0, estimatedGrossProfit = 0, grossMarginPercent = 0 } = dashboardData.summary;
    return {
      totalSales: Math.round(totalSales),
      totalExpenses: Math.round(totalCogs),
      totalProfit: Math.round(estimatedGrossProfit),
      profitMargin: Number(grossMarginPercent || 0).toFixed(1),
    };
  }, [dashboardData]);

  const storeName = currentStore?.name || (effectiveStoreCode === 'mobiles' ? 'Star Mobiles' : 'Star Furniture & Living');
  const storeCity = currentStore?.city || 'Mumbai';

  return (
    <div className="space-y-6 min-w-0">
      {/* Store Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              STORE WORKSPACE
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs font-semibold text-brand-sage flex items-center gap-1">
              <CheckCircle2 size={13} />
              Active Branch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            {storeName} Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            Branch Operations • {storeCity} • Real-time telemetry & counter sales
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Period selector */}
          <div className="flex items-center bg-surface border border-border rounded-lg p-1 text-xs shadow-2xs">
            <Calendar size={13} className="text-muted ml-2 mr-1.5 shrink-0" />
            <div className="flex items-center gap-1">
              {PERIODS.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    selectedPeriod === period.id
                      ? 'bg-accent text-accent-fg shadow-2xs'
                      : 'text-muted hover:text-text hover:bg-surface-subtle'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/admin/${effectiveStoreCode}/billing`)}
            className="rounded-lg gap-1.5 font-medium text-xs shadow-2xs"
          >
            <PlusCircle size={14} />
            <span className="hidden sm:inline">New Bill</span>
          </Button>
        </div>
      </div>

      {/* 3 CORE FINANCIAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        {/* Card 1: Total Sales */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              TOTAL SALES
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border text-muted flex items-center justify-center shrink-0">
              <IndianRupee size={15} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-text">
              {formatCurrency(financialSummary.totalSales)}
            </div>
            <p className="text-xs text-muted flex items-center gap-1">
              <TrendingUp size={13} className="text-brand-sage" />
              <span>Revenue across paid & counter sales</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              TOTAL EXPENSES
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border text-muted flex items-center justify-center shrink-0">
              <Receipt size={15} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-text">
              {formatCurrency(financialSummary.totalExpenses)}
            </div>
            <p className="text-xs text-muted">
              Procurement COGS + store branch overhead
            </p>
          </div>
        </div>

        {/* Card 3: Total Profit */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              TOTAL PROFIT
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border text-muted flex items-center justify-center shrink-0">
              <PiggyBank size={15} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-text">
              {formatCurrency(financialSummary.totalProfit)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-brand-sage-subtle text-brand-sage-text border border-brand-sage-border">
                {financialSummary.profitMargin}% Net Margin
              </span>
              <span className="text-xs text-muted">Sales minus expenses</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN SECTION: STOCK ALERTS & LIVE POS FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* Left Column (col-span-6): Stock Alerts */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface space-y-4 shadow-2xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border text-amber-600 flex items-center justify-center shrink-0">
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-text">Critical Stock Alerts</h2>
                    <p className="text-xs text-muted">
                      Items at or below reorder threshold
                    </p>
                  </div>
                </div>
                <Badge variant={stockAlerts.length > 0 ? 'amber' : 'success'} className="text-[10px] font-medium">
                  {stockAlerts.length} {stockAlerts.length === 1 ? 'Alert' : 'Alerts'}
                </Badge>
              </div>

              {/* List of at most 3 items */}
              {isProdsLoading ? (
                <div className="py-8 text-center text-xs text-muted">
                  Checking inventory stock levels...
                </div>
              ) : stockAlerts.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 size={24} className="text-brand-sage mx-auto" />
                  <p className="text-xs font-semibold text-text">
                    All inventory healthy for {storeName}
                  </p>
                  <p className="text-[11px] text-muted">
                    No items currently below minimum reorder thresholds.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-3">
                  {stockAlerts.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-border bg-surface-subtle flex items-center justify-between gap-3 transition-colors hover:bg-surface-hover"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Package size={16} className="text-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-text truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-muted flex items-center gap-1.5 font-mono">
                            <span>SKU: {item.sku}</span>
                            {item.categories?.name && (
                              <>
                                <span>•</span>
                                <span>{item.categories.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {item.currentStock <= 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-danger/10 text-danger border border-danger/20">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            {item.currentStock} {item.currentStock === 1 ? 'unit left' : 'units left'}
                          </span>
                        )}
                        <div className="text-[10px] text-muted mt-0.5">
                          Min: {item.reorderLevel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prominent Button below Stock Alerts to Go to Inventory */}
            <div className="pt-3 border-t border-border mt-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/${effectiveStoreCode}/inventory`)}
                className="w-full justify-center gap-2 text-xs font-medium rounded-lg"
              >
                <Package size={14} />
                <span>Manage Inventory & Restock</span>
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column (col-span-6): Live Branch Transactions Feed */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface space-y-4 shadow-2xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-text shrink-0">
                    <Receipt size={15} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-text">Recent Store Transactions</h2>
                    <p className="text-xs text-muted">Live checkout activity at this counter</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
                  <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
                  <span>Realtime</span>
                </div>
              </div>

              {isInvoicesLoading ? (
                <div className="py-8 text-center text-xs text-muted">
                  Loading recent checkouts...
                </div>
              ) : invoices.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Receipt size={24} className="text-muted/60 mx-auto" />
                  <p className="text-xs font-semibold text-text">No invoices generated yet</p>
                  <p className="text-[11px] text-muted">Issue tax invoices using the POS terminal.</p>
                </div>
              ) : (
                <div className="space-y-2 pt-3">
                  {invoices.slice(0, 4).map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-lg border border-border bg-surface-subtle flex items-center justify-between gap-3 transition-colors hover:bg-surface-hover text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text font-mono text-[11px]">
                            {inv.invoice_number}
                          </span>
                          <span className="text-muted">•</span>
                          <span className="text-muted truncate">
                            {inv.customer_name || 'Walk-in Customer'}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5">
                          <Clock size={11} />
                          <span>{inv.created_at ? formatDate(inv.created_at) : 'Today'}</span>
                          {inv.status && (
                            <Badge variant="sage" className="text-[9px] px-1 py-0 uppercase">
                              {inv.status}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-semibold text-text text-xs">
                          {formatCurrency(inv.grand_total || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Link to Invoices List */}
            <div className="pt-3 border-t border-border mt-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/${effectiveStoreCode}/invoices`)}
                className="w-full justify-center gap-2 text-xs font-medium rounded-lg"
              >
                <Receipt size={14} />
                <span>View All Invoices & GST Reports</span>
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
