import { Card } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import { IndianRupee, TrendingUp, Receipt, Package } from 'lucide-react';

/**
 * Executive KPI Ribbon showing cross-store aggregated performance
 * @param {Object} props
 * @param {Object} props.summary
 * @param {string} props.dateRangeLabel
 */
export function ExecutiveMetricsRibbon({ summary, dateRangeLabel }) {
  const {
    totalSales = 0,
    invoiceCount = 0,
    totalTax = 0,
    totalInventoryValue = 0,
    estimatedMargin = 0,
    marginPercentage = 0,
  } = summary || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
      {/* 1. Combined Gross Sales */}
      <Card className="p-5 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-3 min-w-0">
        <div className="flex items-center justify-between text-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
          <div className="w-8 h-8 rounded-lg border border-border bg-bg flex items-center justify-center text-text shrink-0">
            <IndianRupee size={15} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold font-mono text-text tracking-tight truncate">
            {formatCurrency(totalSales)}
          </div>
          <div className="text-xs text-muted mt-1 truncate">
            {invoiceCount} {invoiceCount === 1 ? 'sale' : 'sales'} billed • {dateRangeLabel}
          </div>
        </div>
      </Card>

      {/* 2. Est. Gross Profit Margin */}
      <Card className="p-5 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-3 min-w-0">
        <div className="flex items-center justify-between text-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">Est. Gross Margin</span>
          <div className="w-8 h-8 rounded-lg border border-border bg-bg flex items-center justify-center text-text shrink-0">
            <TrendingUp size={15} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold font-mono text-text tracking-tight truncate">
            {formatCurrency(estimatedMargin)}
          </div>
          <div className="text-xs text-muted mt-1 truncate">
            {marginPercentage > 0 ? `${marginPercentage.toFixed(1)}% gross margin` : 'Based on catalog markup'}
          </div>
        </div>
      </Card>

      {/* 3. GST Collected (GSTR-1 Ready) */}
      <Card className="p-5 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-3 min-w-0">
        <div className="flex items-center justify-between text-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">GST Output Tax</span>
          <div className="w-8 h-8 rounded-lg border border-border bg-bg flex items-center justify-center text-text shrink-0">
            <Receipt size={15} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold font-mono text-text tracking-tight truncate">
            {formatCurrency(totalTax)}
          </div>
          <div className="text-xs text-muted mt-1 truncate">
            CGST + SGST total • {dateRangeLabel}
          </div>
        </div>
      </Card>

      {/* 4. Total Stock Asset Value */}
      <Card className="p-5 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-3 min-w-0">
        <div className="flex items-center justify-between text-muted">
          <span className="text-xs font-semibold uppercase tracking-wider">Stock Valuation</span>
          <div className="w-8 h-8 rounded-lg border border-border bg-bg flex items-center justify-center text-text shrink-0">
            <Package size={15} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold font-mono text-text tracking-tight truncate">
            {formatCurrency(totalInventoryValue)}
          </div>
          <div className="text-xs text-muted mt-1 truncate">
            Cost asset valuation on hand
          </div>
        </div>
      </Card>
    </div>
  );
}
