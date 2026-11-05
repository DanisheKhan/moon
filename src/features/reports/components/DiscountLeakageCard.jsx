import { formatCurrency } from '@/shared/lib/format';
import { Tag, AlertCircle, TrendingDown, CheckCircle2 } from 'lucide-react';

export function DiscountLeakageCard({ discountLeakage = {} }) {
  const totalDiscount = discountLeakage.totalDiscount ?? 0;
  const count = discountLeakage.discountedInvoicesCount ?? 0;
  const sharePct = discountLeakage.discountSharePct ?? 0;
  const avgDiscount = discountLeakage.averageDiscount ?? 0;
  const maxInvoice = discountLeakage.maxDiscountInvoice;

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
            <Tag size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">
              Counter Discount & Margin Leakage Watchdog
            </h3>
            <span className="text-xs text-muted">Tracking manual floor price concessions at checkout</span>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sharePct > 3 ? 'border-amber-500/30 bg-amber-500/10 text-amber-700' : 'border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text'}`}>
          {sharePct.toFixed(1)}% of Sales
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg border border-border bg-bg/40 text-xs">
        <div>
          <span className="text-[10px] uppercase font-semibold text-muted block">Total Concessions</span>
          <span className="font-bold text-amber-700 font-mono text-sm sm:text-base">
            {formatCurrency(totalDiscount)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-muted block">Discounted Bills</span>
          <span className="font-bold text-text font-mono text-sm sm:text-base">
            {count} {count === 1 ? 'bill' : 'bills'}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-muted block">Avg Concession</span>
          <span className="font-bold text-text font-mono text-sm sm:text-base">
            {formatCurrency(avgDiscount)}
          </span>
        </div>
      </div>

      {maxInvoice && (
        <div className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="text-muted">Max Concession: </span>
              <strong className="text-text">{maxInvoice.invoiceNumber}</strong>
              <span className="text-muted hidden sm:inline"> ({maxInvoice.customerName})</span>
            </div>
          </div>
          <div className="font-mono font-bold text-amber-700 shrink-0">
            -{formatCurrency(maxInvoice.amount)}
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted">
        {sharePct <= 2.5 ? (
          <span className="flex items-center gap-1.5 text-brand-sage font-medium">
            <CheckCircle2 size={13} />
            Excellent counter price discipline. Discounts are within optimal 2.5% safety band.
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-amber-700 font-medium">
            <TrendingDown size={13} />
            Margin Leak Alert: Review counter negotiation limits with store staff.
          </span>
        )}
      </p>
    </div>
  );
}
