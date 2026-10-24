import { useState } from 'react';
import { useOwnerDashboard } from '../hooks/useReports';
import { formatCurrency } from '@/shared/lib/format';
import {
  Download,
  CreditCard,
  Building,
  TrendingUp,
  Receipt,
} from 'lucide-react';

const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
];

export function ReportsConsolePage() {
  const [dateRange, setDateRange] = useState('today');
  const { data: dashboardData } = useOwnerDashboard(dateRange);

  const summary = dashboardData?.summary || {
    totalSales: 248990,
    totalInvoices: 18,
    totalGst: 37980,
    averageTicket: 13832,
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1">
            EXECUTIVE INTELLIGENCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-text">
            Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time financial telemetry, GST sales registers, payment methods, and revenue performance.
          </p>
        </div>

        {/* Date Filters + Export Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-surface border border-border rounded-lg p-1 text-xs">
            {DATE_RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setDateRange(r.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  dateRange === r.id
                    ? 'bg-text text-bg'
                    : 'text-muted hover:text-text'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-surface text-text hover:bg-bg cursor-pointer transition-colors"
          >
            <Download size={13} />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider block">
              GROSS SALES
            </span>
            <div className="text-2xl font-medium tracking-tight text-text">
              {formatCurrency(summary.totalSales || 0)}
            </div>
            <span className="text-xs text-muted block">Tax inclusive revenue</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-muted shrink-0">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider block">
              COLLECTED GST
            </span>
            <div className="text-2xl font-medium tracking-tight text-text">
              {formatCurrency(summary.totalGst || 0)}
            </div>
            <span className="text-xs text-muted block">CGST + SGST liability</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-muted shrink-0">
            <Receipt size={18} />
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider block">
              INVOICES ISSUED
            </span>
            <div className="text-2xl font-medium tracking-tight text-text">{summary.totalInvoices || 0}</div>
            <span className="text-xs text-muted block">GST invoices completed</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-muted shrink-0">
            <Building size={18} />
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider block">
              AVG TICKET VALUE
            </span>
            <div className="text-2xl font-medium tracking-tight text-text">
              {formatCurrency(summary.averageTicket || 0)}
            </div>
            <span className="text-xs text-muted block">Basket size per customer</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-muted shrink-0">
            <CreditCard size={18} />
          </div>
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment mode split */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-text uppercase tracking-wider">
              Payment Method Breakdown
            </h2>
            <span className="text-xs text-muted">Direct receipts</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'UPI / QR Instant Transfer', amount: 142000, pct: 57, color: 'bg-emerald-500' },
              { label: 'Store Cash Register', amount: 68500, pct: 28, color: 'bg-amber-500' },
              { label: 'Debit & Credit Card (POS)', amount: 28490, pct: 11, color: 'bg-purple-500' },
              { label: 'NEFT / Direct Bank Transfer', amount: 10000, pct: 4, color: 'bg-blue-500' },
            ].map((item) => (
              <div key={item.label} className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-text">{item.label}</span>
                  <span className="text-muted">
                    {formatCurrency(item.amount)} ({item.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-bg overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Sales contribution */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-text uppercase tracking-wider">
              Branch Performance Contribution
            </h2>
            <span className="text-xs text-muted">Network split</span>
          </div>

          <div className="space-y-3">
            {[
              {
                name: 'Star Mobiles & Electronics',
                city: 'Central Station Branch',
                revenue: 168400,
                invoices: 12,
                gst: 'GSTIN27AABCS1429B1Z1',
              },
              {
                name: 'Star Furniture & Home Living',
                city: 'Plaza Terminal Branch',
                revenue: 80590,
                invoices: 6,
                gst: 'GSTIN27AABCS1429B2Z2',
              },
            ].map((st) => (
              <div
                key={st.name}
                className="p-3.5 rounded-lg border border-border bg-bg/40 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-text text-xs">{st.name}</div>
                  <div className="text-[10px] text-muted font-mono">{st.gst}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-text text-xs">{formatCurrency(st.revenue)}</div>
                  <div className="text-[10px] text-muted">{st.invoices} bills</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
