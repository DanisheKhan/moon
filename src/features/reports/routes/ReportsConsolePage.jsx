import { useState } from 'react';
import { useOwnerDashboard } from '../hooks/useReports';
import { ExecutiveHeader } from '../components/ExecutiveHeader';
import { ExecutiveKpiGrid } from '../components/ExecutiveKpiGrid';
import { SalesVelocityTimeline } from '../components/SalesVelocityTimeline';
import { GstTaxConsole } from '../components/GstTaxConsole';
import { MerchandiseRankings } from '../components/MerchandiseRankings';
import { BusinessActionEngine } from '../components/BusinessActionEngine';
import { PaymentAndBranchSplit } from '../components/PaymentAndBranchSplit';
import { DayEndZReportModal } from '../components/DayEndZReportModal';
import { KpiGridSkeleton } from '@/shared/ui';
import {
  LayoutDashboard,
  Receipt,
  PackageSearch,
  Zap,
  Info,
} from 'lucide-react';

const PERSPECTIVES = [
  { id: 'overview', label: 'Overview & Financials', icon: LayoutDashboard },
  { id: 'gst', label: 'GST & Tax Register', icon: Receipt, badge: 'GSTR-1' },
  { id: 'merchandise', label: 'Merchandise & Stock Velocity', icon: PackageSearch },
  { id: 'actions', label: 'Business Action Engine', icon: Zap, badge: '5 Levers' },
];

export function ReportsConsolePage() {
  const [dateRange, setDateRange] = useState('month');
  const [storeCode, setStoreCode] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isEodModalOpen, setIsEodModalOpen] = useState(false);

  const {
    data: dashboardData,
    isLoading,
  } = useOwnerDashboard({ dateRange, storeCode });

  const summary = dashboardData?.summary || {};
  const payments = dashboardData?.payments || {};
  const branches = dashboardData?.branches || [];
  const categories = dashboardData?.categories || [];
  const businessActions = dashboardData?.businessActions || {};
  const recentInvoices = dashboardData?.recentInvoices || [];
  const salesVelocity = dashboardData?.salesVelocity || [];
  const cashDrawer = dashboardData?.cashDrawer || {};
  const gstCompliance = dashboardData?.gstCompliance || {};
  const merchandise = dashboardData?.merchandise || {};
  const eodReport = dashboardData?.eodReport || {};

  const handleExportGstr1 = () => {
    const gstr1Rows = gstCompliance.gstr1Rows || [];
    if (gstr1Rows.length === 0) return;

    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Store Branch',
      'Customer Name',
      'Customer Phone',
      'Customer GSTIN',
      'Place of Supply',
      'Taxable Value (INR)',
      'CGST Amount (INR)',
      'SGST Amount (INR)',
      'IGST Amount (INR)',
      'Grand Total (INR)',
      'Invoice Status',
    ];

    const csvContent = [
      headers.join(','),
      ...gstr1Rows.map((r) =>
        [
          `"${r.invoiceNumber}"`,
          `"${r.invoiceDate}"`,
          `"${r.storeName}"`,
          `"${r.customerName}"`,
          `"${r.customerPhone}"`,
          `"${r.customerGstin}"`,
          `"${r.placeOfSupply}"`,
          r.taxableValue,
          r.cgstAmount,
          r.sgstAmount,
          r.igstAmount,
          r.grandTotal,
          `"${r.status}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Star_Enterprises_GSTR1_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Executive Control Header with 1-Click Operational Actions */}
      <ExecutiveHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        storeCode={storeCode}
        setStoreCode={setStoreCode}
        onOpenEodModal={() => setIsEodModalOpen(true)}
        onExportGstr1={handleExportGstr1}
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

      {/* 2. Core 5 Financial Telemetry Cards */}
      {isLoading && !dashboardData ? (
        <KpiGridSkeleton count={5} className="grid-cols-2 lg:grid-cols-5" />
      ) : (
        <ExecutiveKpiGrid summary={summary} />
      )}

      {/* 3. Executive Perspective Switcher Tabs */}
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
                  ? 'border-brand-sage text-brand-sage font-semibold'
                  : 'border-transparent text-muted hover:text-text hover:border-border'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-brand-sage' : 'text-muted'} />
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

      {/* 4. Dynamic Perspective Viewport */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Sales Velocity Daily Trajectory Curve */}
            <SalesVelocityTimeline
              salesVelocity={salesVelocity}
              periodComparison={summary.periodComparison}
            />

            {/* Cash Till Balancing, Payment Channels & Multi-Branch Split */}
            <PaymentAndBranchSplit
              payments={payments}
              branches={branches}
              recentInvoices={recentInvoices}
              cashDrawer={cashDrawer}
              totalSales={summary.totalSales}
            />
          </div>
        )}

        {activeTab === 'gst' && (
          <GstTaxConsole
            gstCompliance={gstCompliance}
            dateRange={dateRange}
          />
        )}

        {activeTab === 'merchandise' && (
          <MerchandiseRankings
            merchandise={merchandise}
            categories={categories}
          />
        )}

        {activeTab === 'actions' && (
          <BusinessActionEngine actions={businessActions} />
        )}
      </div>

      {/* Day-End EOD Z-Report Modal */}
      <DayEndZReportModal
        isOpen={isEodModalOpen}
        onClose={() => setIsEodModalOpen(false)}
        eodData={eodReport}
      />
    </div>
  );
}
