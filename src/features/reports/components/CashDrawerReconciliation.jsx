import { formatCurrency } from '@/shared/lib/format';
import {
  Wallet,
  QrCode,
  CreditCard,
  Building,
  CheckCircle2,
  Receipt,
  HelpCircle,
} from 'lucide-react';

export function CashDrawerReconciliation({ cashDrawer = {}, totalSales = 0 }) {
  const cashInTill = cashDrawer.cashInTill ?? 0;
  const instantUpi = cashDrawer.instantUpi ?? 0;
  const posCards = cashDrawer.posCards ?? 0;
  const cardMdr = cashDrawer.estimatedCardMdr ?? 0;
  const netCard = cashDrawer.netCardDeposit ?? (posCards - cardMdr);
  const emiReceivable = cashDrawer.financierReceivable ?? 0;
  const totalReconciled = cashDrawer.totalCollected ?? totalSales;

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-5 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-text flex items-center gap-2">
            <Wallet size={16} className="text-brand-sage" />
            Cash Drawer & Till Reconciliation
          </h3>
          <p className="text-xs text-muted">
            End-of-day register tally: physical drawer cash vs automated digital settlements.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-sage-subtle border border-brand-sage-border text-brand-sage-text">
          <CheckCircle2 size={13} className="text-brand-sage" />
          <span>{cashDrawer.status || 'Till Reconciled'}</span>
        </div>
      </div>

      {/* 4-Card Tender Tally */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cash In Drawer */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-700">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Physical Till Cash</span>
            <Wallet size={15} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text">
            {formatCurrency(cashInTill)}
          </div>
          <div className="text-[11px] text-muted">
            Must be physically counted in cash register till.
          </div>
        </div>

        {/* 2. Bank UPI */}
        <div className="p-4 rounded-xl border border-brand-sage-border bg-brand-sage-subtle/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-brand-sage-text">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Instant Bank UPI</span>
            <QrCode size={15} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text">
            {formatCurrency(instantUpi)}
          </div>
          <div className="text-[11px] text-brand-sage-text font-medium">
            0% MDR • Credited directly to current account.
          </div>
        </div>

        {/* 3. POS Cards (Gross & Net of MDR) */}
        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-700">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Card Machine Swipes</span>
            <CreditCard size={15} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text">
            {formatCurrency(posCards)}
          </div>
          <div className="text-[11px] text-muted">
            Net: <strong className="text-text font-mono">{formatCurrency(netCard)}</strong> (Est. 1.8% MDR: -{formatCurrency(cardMdr)})
          </div>
        </div>

        {/* 4. Financier Receivables (EMI) */}
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Financier EMI Receivables</span>
            <Building size={15} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text">
            {formatCurrency(emiReceivable)}
          </div>
          <div className="text-[11px] text-muted">
            Pending batch payout from Bajaj / HDB / PineLabs.
          </div>
        </div>
      </div>

      {/* Till Balancing Strip */}
      <div className="p-3.5 rounded-lg border border-border bg-bg/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted">
          <Receipt size={14} className="text-text shrink-0" />
          <span>
            Total Reconciled Receipts: <strong className="text-text font-mono font-bold">{formatCurrency(totalReconciled)}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted text-[11px]">
          <HelpCircle size={13} className="text-muted shrink-0" />
          <span>Bank Settlements: {formatCurrency(instantUpi + netCard)} | Safe Deposit: {formatCurrency(cashInTill)}</span>
        </div>
      </div>
    </div>
  );
}
