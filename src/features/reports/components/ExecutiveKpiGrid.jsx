import { formatCurrency } from '@/shared/lib/format';
import {
  TrendingUp,
  Receipt,
  CreditCard,
  CircleDollarSign,
  Package,
  ArrowUpRight,
} from 'lucide-react';

export function ExecutiveKpiGrid({ summary = {} }) {
  const totalSales = summary.totalSales || 0;
  const totalGst = summary.totalGst ?? summary.totalTax ?? 0;
  const totalCgst = summary.totalCgst ?? Math.round(totalGst / 2);
  const totalSgst = summary.totalSgst ?? Math.round(totalGst / 2);
  const totalInvoices = summary.totalInvoices ?? summary.invoiceCount ?? 0;
  const averageTicket = summary.averageTicket || (totalInvoices > 0 ? Math.round(totalSales / totalInvoices) : 0);
  const estimatedGrossProfit = summary.estimatedGrossProfit || 0;
  const grossMarginPercent = summary.grossMarginPercent || (totalSales > 0 ? (estimatedGrossProfit / totalSales) * 100 : 0);
  const totalInventoryValue = summary.totalInventoryValue || 0;
  const periodComparison = summary.periodComparison;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Gross Revenue */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
            GROSS SALES
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-text truncate">
            {formatCurrency(totalSales)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted truncate">
            {periodComparison?.deltaPct !== undefined ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-sage-subtle text-brand-sage-text border border-brand-sage-border font-mono">
                <ArrowUpRight size={11} className="text-brand-sage" />
                +{periodComparison.deltaPct}%
              </span>
            ) : (
              <span>Tax inclusive</span>
            )}
            <span>•</span>
            <span className="font-mono">{totalInvoices} {totalInvoices === 1 ? 'bill' : 'bills'}</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-text shrink-0">
          <TrendingUp size={18} />
        </div>
      </div>

      {/* 2. True Gross Profit */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
            TRUE GROSS PROFIT
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-text truncate">
            {formatCurrency(estimatedGrossProfit)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted truncate">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-sage-subtle text-brand-sage-text border border-brand-sage-border font-mono">
              {grossMarginPercent.toFixed(1)}% margin
            </span>
            <span>Net of COGS</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-brand-sage shrink-0">
          <CircleDollarSign size={18} />
        </div>
      </div>

      {/* 3. Collected GST */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
            COLLECTED GST
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-text truncate">
            {formatCurrency(totalGst)}
          </div>
          <span className="text-xs text-muted block truncate font-mono text-[11px]">
            CGST: {formatCurrency(totalCgst)} • SGST: {formatCurrency(totalSgst)}
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-text shrink-0">
          <Receipt size={18} />
        </div>
      </div>

      {/* 4. Average Ticket Value */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
            AVG TICKET VALUE
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-text truncate">
            {formatCurrency(averageTicket)}
          </div>
          <span className="text-xs text-muted block truncate">
            Basket spend per bill
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-text shrink-0">
          <CreditCard size={18} />
        </div>
      </div>

      {/* 5. Inventory Assets (Working Capital) */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
            INVENTORY ASSETS
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-text truncate">
            {formatCurrency(totalInventoryValue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-sage shrink-0" />
            <span>On-hand stock valuation</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-text shrink-0">
          <Package size={18} />
        </div>
      </div>
    </div>
  );
}
