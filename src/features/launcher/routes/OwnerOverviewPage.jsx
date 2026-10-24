import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal } from '@/shared/ui';
import { useStores } from '@/features/stores';
import { useAuth, LoginForm } from '@/features/auth';
import { useOwnerDashboard } from '@/features/reports';
import { ExecutiveMetricsRibbon } from '../components/ExecutiveMetricsRibbon';
import { StoreDashboardCard } from '../components/StoreDashboardCard';
import { PaymentSplitWidget } from '../components/PaymentSplitWidget';
import { InventoryAlertsWidget } from '../components/InventoryAlertsWidget';
import { LiveTransactionsFeed } from '../components/LiveTransactionsFeed';
import { Users, LogIn, Calendar, Layers, ArrowRight, ArrowLeft } from 'lucide-react';

const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
];

export function OwnerOverviewPage() {
  const navigate = useNavigate();
  const { isOwner, user } = useAuth();
  const { data: stores = [], isLoading: isStoresLoading } = useStores();
  const [dateRange, setDateRange] = useState('today');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const { data: dashboardData, isLoading: isDashboardLoading } = useOwnerDashboard(dateRange);

  const isLoading = isStoresLoading || isDashboardLoading;

  const mobilesStore = stores.find((s) => s.code === 'mobiles');
  const feStore = stores.find((s) => s.code === 'furniture-electronics');

  const selectedRangeObj = DATE_RANGES.find((r) => r.id === dateRange) || DATE_RANGES[0];
  const dateRangeLabel = selectedRangeObj.label;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border min-w-0">
        <div className="space-y-1.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            Back to stores
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="px-3 py-1 text-xs rounded-full font-medium">
              Enterprise Command Center
            </Badge>
            <span className="text-xs text-muted">• Dual Store Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text">
            Store Owner Executive Portal
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-2xl">
            Live multi-store sales telemetry, stock asset valuations, branch POS terminals, and operational intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center bg-surface border border-border rounded-lg p-1 text-xs min-w-0">
            <Calendar size={13} className="text-muted ml-2 mr-1.5 shrink-0" />
            <div className="flex items-center gap-1">
              {DATE_RANGES.map((range) => {
                const isActive = dateRange === range.id;
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setDateRange(range.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-fg'
                        : 'text-muted hover:text-text hover:bg-bg'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!user && (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-muted hover:text-text hover:bg-surface cursor-pointer transition-colors"
            >
              <LogIn size={13} /> Sign In
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted">
            Aggregating real-time telemetry across Star Mobiles and Star Furniture...
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2 min-w-0">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-semibold uppercase tracking-wider text-text">
                Consolidated Financials ({dateRangeLabel})
              </span>
              <span>All branches synchronized</span>
            </div>
            <ExecutiveMetricsRibbon
              summary={dashboardData?.summary}
              dateRangeLabel={dateRangeLabel}
            />
          </div>

          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-semibold uppercase tracking-wider text-text">
                Branch Operational Dashboards
              </span>
              <span>Select workspace terminal or inspect inventory</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              {mobilesStore && (
                <StoreDashboardCard
                  store={mobilesStore}
                  stats={dashboardData?.stores?.mobiles}
                  branchLabel="Branch #1"
                  dateRangeLabel={dateRangeLabel}
                  onLaunchPos={() => navigate(`/admin/${mobilesStore.code}`)}
                  onManageInventory={() => navigate(`/admin/${mobilesStore.code}/inventory`)}
                />
              )}

              {feStore && (
                <StoreDashboardCard
                  store={feStore}
                  stats={dashboardData?.stores?.['furniture-electronics']}
                  branchLabel="Branch #2"
                  dateRangeLabel={dateRangeLabel}
                  onLaunchPos={() => navigate(`/admin/${feStore.code}`)}
                  onManageInventory={() => navigate(`/admin/${feStore.code}/inventory`)}
                />
              )}
            </div>
          </div>

          <div className="space-y-3 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-text">
              Real-Time Store Intelligence & Watchlists
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0 items-stretch">
              <PaymentSplitWidget
                payments={dashboardData?.payments}
                stores={dashboardData?.stores}
                totalSales={dashboardData?.summary?.totalSales}
              />
              <InventoryAlertsWidget alerts={dashboardData?.lowStockWatchlist} />
              <LiveTransactionsFeed invoices={dashboardData?.recentInvoices} />
            </div>
          </div>

          {isOwner && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <Card className="p-5 rounded-xl bg-surface border border-border flex items-center justify-between gap-4 min-w-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg border border-border bg-bg flex items-center justify-center text-text shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-semibold text-sm text-text truncate">
                      Staff Management System (HRMS)
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Staff directory, attendance records, leaves, and payroll ledger
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/staff')}
                  className="text-xs shrink-0 cursor-pointer gap-1"
                >
                  <span>Open HRMS</span>
                  <ArrowRight size={13} />
                </Button>
              </Card>

              <Card className="p-5 rounded-xl bg-surface border border-border flex items-center justify-between gap-4 min-w-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg border border-border bg-bg flex items-center justify-center text-text shrink-0">
                    <Layers size={18} />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-semibold text-sm text-text truncate">
                      Consolidated Master Ledger
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Unified invoices table, GSTR-1 sales register, and audit trails
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/all')}
                  className="text-xs shrink-0 cursor-pointer gap-1"
                >
                  <span>Master Ledger</span>
                  <ArrowRight size={13} />
                </Button>
              </Card>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Store Owner Sign In"
        size="md"
      >
        <LoginForm onSuccess={() => setIsLoginModalOpen(false)} />
      </Modal>
    </div>
  );
}
