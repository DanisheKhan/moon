import { useState } from 'react';
import { useOwnerDashboard } from '../hooks/useReports';
import { ExecutiveHeader } from '../components/ExecutiveHeader';
import { ExecutiveStoreTelemetry } from '../components/ExecutiveStoreTelemetry';
import { SalesVelocityTimeline } from '../components/SalesVelocityTimeline';
import { MostSellingCategoryGraph } from '../components/MostSellingCategoryGraph';
import { StarProductsSalesMatrix } from '../components/StarProductsSalesMatrix';
import { PaymentAndBranchSplit } from '../components/PaymentAndBranchSplit';
import {
  LayoutDashboard,
  Trophy,
  BarChart3,
  Info,
} from 'lucide-react';

const PERSPECTIVES = [
  { id: 'overview', label: 'Overview & Performance', icon: LayoutDashboard },
  { id: 'products', label: 'Star Products Sales Matrix', icon: Trophy, badge: 'Hero SKUs' },
  { id: 'categories', label: 'Category Revenue Graph', icon: BarChart3, badge: 'Departments' },
];

export function ReportsConsolePage() {
  const [dateRange, setDateRange] = useState('month');
  const [storeCode, setStoreCode] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: dashboardData,
    isLoading,
  } = useOwnerDashboard({ dateRange, storeCode });

  const summary = dashboardData?.summary || {};
  const payments = dashboardData?.payments || {};
  const branches = dashboardData?.branches || [];
  const categories = dashboardData?.categories || [];
  const starProducts = dashboardData?.starProducts || [];
  const businessActions = dashboardData?.businessActions || {};
  const recentInvoices = dashboardData?.recentInvoices || [];
  const salesVelocity = dashboardData?.salesVelocity || [];
  const periodComparison = dashboardData?.periodComparison || {};

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Executive Control Header */}
      <ExecutiveHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        storeCode={storeCode}
        setStoreCode={setStoreCode}
      />

      {/* Zero Transaction Notice if current filter is empty */}
      {summary.totalInvoices === 0 && !isLoading && (
        <div className="p-3.5 rounded-lg border border-border bg-surface flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted">
            <Info size={15} className="text-accent shrink-0" />
            <span>
              No transactions recorded for the selected filter ({dateRange === 'today' ? 'Today' : dateRange}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDateRange('month')}
            className="text-text font-medium underline hover:text-accent cursor-pointer"
          >
            Switch to This Month (View Active Store Records)
          </button>
        </div>
      )}

      {/* 2. Executive Store Telemetry & Data Assets Component */}
      <ExecutiveStoreTelemetry
        summary={summary}
        businessActions={businessActions}
        periodComparison={periodComparison}
      />

      {/* 3. Interactive Sales & Profit Velocity Timeline Graph */}
      <SalesVelocityTimeline
        salesVelocity={salesVelocity}
        periodComparison={periodComparison}
      />

      {/* 4. Perspective Switcher Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-px">
        {PERSPECTIVES.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium cursor-pointer border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-text text-text font-semibold'
                  : 'border-transparent text-muted hover:text-text hover:border-border'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-text' : 'text-muted'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text font-medium">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Dynamic Perspective Viewport */}
      <div className="pt-2 space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Most Selling Category Revenue Graph */}
            <MostSellingCategoryGraph
              categories={categories}
              totalSales={summary.totalSales || 0}
            />

            {/* Star Products Sales Matrix */}
            <StarProductsSalesMatrix
              starProducts={starProducts}
              totalSales={summary.totalSales || 0}
            />

            {/* Payment & Multi-Branch Split */}
            <PaymentAndBranchSplit
              payments={payments}
              branches={branches}
              recentInvoices={recentInvoices}
            />
          </>
        )}

        {activeTab === 'products' && (
          <StarProductsSalesMatrix
            starProducts={starProducts}
            totalSales={summary.totalSales || 0}
          />
        )}

        {activeTab === 'categories' && (
          <MostSellingCategoryGraph
            categories={categories}
            totalSales={summary.totalSales || 0}
          />
        )}
      </div>
    </div>
  );
}
