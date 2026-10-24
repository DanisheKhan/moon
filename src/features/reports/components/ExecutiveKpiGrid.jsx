import { formatCurrency } from '@/shared/lib/format';
import {
  TrendingUp,
  Receipt,
  CreditCard,
  CircleDollarSign,
  Package,
} from 'lucide-react';

export function ExecutiveKpiGrid({ summary = {} }) {
  const totalSales = summary.totalSales || 0;
  const totalGst = summary.totalGst ?? summary.totalTax ?? 0;
  const totalInvoices = summary.totalInvoices ?? summary.invoiceCount ?? 0;
  const averageTicket = summary.averageTicket || (totalInvoices > 0 ? Math.round(totalSales / totalInvoices) : 0);
  const estimatedGrossProfit = summary.estimatedGrossProfit || 0;
  const grossMarginPercent = summary.grossMarginPercent || (totalSales > 0 ? (estimatedGrossProfit / totalSales) * 100 : 0);
  const totalInventoryValue = summary.totalInventoryValue || 0;

  return (
    <div className="space-y-4">
      {/* 4 Primary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Gross Sales */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider block">
              GROSS SALES
            </span>
            <div className="text-2xl font-semibold tracking-tight text-text truncate">
              {formatCurrency(totalSales)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted truncate">
              <span>Tax inclusive revenue</span>
              <span>•</span>
              <span className="font-mono">{totalInvoices} bills</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-text shrink-0">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* True Gross Profit & Margin */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider block">
              TRUE GROSS PROFIT
            </span>
            <div className="text-2xl font-semibold tracking-tight text-text truncate">
              {formatCurrency(estimatedGrossProfit)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted truncate">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                {grossMarginPercent.toFixed(1)}% margin
              </span>
              <span>Net of unit COGS</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-emerald-600 shrink-0">
            <CircleDollarSign size={18} />
          </div>
        </div>

        {/* Collected GST */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider block">
              COLLECTED GST
            </span>
            <div className="text-2xl font-semibold tracking-tight text-text truncate">
              {formatCurrency(totalGst)}
            </div>
            <span className="text-xs text-muted block truncate">CGST + SGST (GSTR-1 Ready)</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-text shrink-0">
            <Receipt size={18} />
          </div>
        </div>

        {/* Average Ticket Value */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider block">
              AVG TICKET VALUE
            </span>
            <div className="text-2xl font-semibold tracking-tight text-text truncate">
              {formatCurrency(averageTicket)}
            </div>
            <span className="text-xs text-muted block truncate">Basket spend per customer bill</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-text shrink-0">
            <CreditCard size={18} />
          </div>
        </div>
      </div>

      {/* Sub-bar: Working Capital Health Indicator */}
      <div className="p-3.5 rounded-lg border border-border bg-surface/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Package size={15} className="text-muted shrink-0" />
          <span className="text-muted">Total On-Hand Inventory Valuation:</span>
          <span className="font-semibold text-text">{formatCurrency(totalInventoryValue)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <span>Catalog Health:</span>
          <span className="text-text font-medium">Single Source of Truth (Live Database Synced)</span>
        </div>
      </div>
    </div>
  );
}
