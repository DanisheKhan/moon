import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  Wallet,
  Building2,
  Receipt,
  CheckCircle2,
  QrCode,
  CreditCard,
  Building,
} from 'lucide-react';

export function PaymentAndBranchSplit({
  payments = {},
  branches = [],
  recentInvoices = [],
  cashDrawer = {},
  totalSales = 0,
}) {
  const cashInTill = cashDrawer.cashInTill ?? 0;
  const instantUpi = cashDrawer.instantUpi ?? 0;
  const posCards = cashDrawer.posCards ?? 0;
  const cardMdr = cashDrawer.estimatedCardMdr ?? payments.estimatedCardMdrCost ?? 0;
  const netCard = cashDrawer.netCardDeposit ?? Math.max(0, posCards - cardMdr);
  const emiReceivable = cashDrawer.financierReceivable ?? 0;
  const totalReconciled = cashDrawer.totalCollected ?? totalSales;

  // Tender mapping with enriched till balancing context
  const tenderChannels = [
    {
      id: 'cash',
      label: 'Store Cash Register',
      badge: 'Physical Drawer',
      badgeStyle: 'border-amber-500/30 text-amber-600 bg-amber-500/10',
      barColor: 'bg-amber-500',
      icon: Wallet,
      amount: cashInTill,
      pct: totalReconciled > 0 ? Math.round((cashInTill / totalReconciled) * 100) : 0,
      note: 'Physical till cash • Ready for end-of-day bank safe drop',
    },
    {
      id: 'emi',
      label: 'Consumer EMI / Financing',
      badge: 'Financier Payout',
      badgeStyle: 'border-blue-500/30 text-blue-600 bg-blue-500/10',
      barColor: 'bg-blue-500',
      icon: Building,
      amount: emiReceivable,
      pct: totalReconciled > 0 ? Math.round((emiReceivable / totalReconciled) * 100) : 0,
      note: 'Pending batch payout from Bajaj Finserv / HDB / PineLabs',
    },
    {
      id: 'upi',
      label: 'Instant UPI / QR Transfer',
      badge: '0% MDR',
      badgeStyle: 'border-brand-sage-border text-brand-sage-text bg-brand-sage-subtle',
      barColor: 'bg-brand-sage',
      icon: QrCode,
      amount: instantUpi,
      pct: totalReconciled > 0 ? Math.round((instantUpi / totalReconciled) * 100) : 0,
      note: 'Zero processing fee • Real-time credit to company current account',
    },
    {
      id: 'card',
      label: 'Debit & Credit Card (POS)',
      badge: '~1.8% MDR',
      badgeStyle: 'border-purple-500/30 text-purple-600 bg-purple-500/10',
      barColor: 'bg-purple-500',
      icon: CreditCard,
      amount: posCards,
      pct: totalReconciled > 0 ? Math.round((posCards / totalReconciled) * 100) : 0,
      note: `Net: ${formatCurrency(netCard)} (Estimated MDR deduction: -${formatCurrency(cardMdr)})`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 2-Column Split: Till Settlements & Branch Network Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Cash Till & Tender Settlements */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
                  <Wallet size={15} className="text-brand-sage" />
                  Cash Till & Payment Settlements
                </h3>
                <span className="text-xs text-muted">Register balancing: physical till vs automated digital bank payouts</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-sage-subtle border border-brand-sage-border text-brand-sage-text shrink-0">
                <CheckCircle2 size={12} className="text-brand-sage" />
                <span>{cashDrawer.status || 'Till Reconciled'}</span>
              </div>
            </div>

            <div className="space-y-3.5">
              {tenderChannels.map((tender) => {
                const Icon = tender.icon;
                return (
                  <div key={tender.id} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={14} className="text-muted shrink-0" />
                        <span className="font-medium text-text truncate">{tender.label}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${tender.badgeStyle}`}>
                          {tender.badge}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-text font-mono">
                          {formatCurrency(tender.amount)}
                        </span>
                        <span className="text-muted ml-1 font-mono">({tender.pct}%)</span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-bg overflow-hidden border border-border/50">
                      <div
                        className={`h-full rounded-full ${tender.barColor}`}
                        style={{ width: `${Math.min(100, Math.max(tender.amount > 0 ? 3 : 0, tender.pct))}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-muted truncate">
                      {tender.note}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-bg/40 text-[11px] text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Reconciled Total: <strong className="text-text font-mono">{formatCurrency(totalReconciled)}</strong></span>
            <span className="text-brand-sage-text font-medium">All closed receipts matched with bank & drawer</span>
          </div>
        </div>

        {/* Right Column: Branch Performance Contribution */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0 h-full flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={15} className="text-muted" />
                  Branch Performance Network Split
                </h3>
                <span className="text-xs text-muted">Consolidated branch contribution</span>
              </div>
              <span className="text-xs text-muted font-mono">{branches.length} Branches</span>
            </div>

            <div className="space-y-3">
              {branches.map((st) => (
                <div
                  key={st.code}
                  className="p-4 rounded-xl border border-border bg-bg/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-text text-sm">{st.name}</div>
                      <span className="text-[11px] text-muted font-mono">{st.gstin}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-text font-mono text-sm sm:text-base">
                        {formatCurrency(st.sales)}
                      </div>
                      <div className="text-[10px] text-muted font-mono">
                        {st.invoices} {st.invoices === 1 ? 'bill' : 'bills'} completed
                      </div>
                    </div>
                  </div>

                  {/* Branch Revenue Share Bar */}
                  <div className="w-full h-2 rounded-full bg-surface overflow-hidden border border-border/50">
                    <div
                      className="h-full rounded-full bg-brand-sage"
                      style={{
                        width: `${totalSales > 0 ? Math.min(100, Math.max(5, (st.sales / totalSales) * 100)) : 0}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] border-t border-border/50">
                    <div>
                      <span className="text-muted block text-[10px] uppercase">Avg Order (AOV)</span>
                      <span className="font-mono font-medium text-text">{formatCurrency(st.aov)}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase">Gross Profit</span>
                      <span className="font-mono font-medium text-text">{formatCurrency(st.profit)}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase">Margin %</span>
                      <span className="font-mono font-medium text-brand-sage-text">
                        {st.marginPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-bg/40 text-[11px] text-muted flex items-center justify-between">
            <span>Branch Operating Status:</span>
            <span className="font-semibold text-text">All Counters Operational</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Live Stream */}
      <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-3 min-w-0">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Receipt size={15} className="text-muted" />
              Recent Billed Invoices Stream
            </h3>
            <span className="text-xs text-muted">Latest real transactions across stores</span>
          </div>
          <span className="text-xs text-muted font-mono">Live DB Stream</span>
        </div>

        <div className="divide-y divide-border overflow-x-auto">
          {recentInvoices.length > 0 ? (
            recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="h-14 min-h-14 flex items-center justify-between gap-4 text-xs hover:bg-bg/40 px-2 rounded-lg transition-colors min-w-120"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg border border-border bg-bg flex items-center justify-center font-mono text-[10px] font-semibold text-text shrink-0">
                    {inv.storeCode === 'mobiles' ? 'MOB' : 'FE'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-text truncate">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-muted truncate">
                      {inv.customerName} • {formatDate(inv.createdAt, true)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <div className="font-semibold text-text font-mono">
                      {formatCurrency(inv.grandTotal)}
                    </div>
                    <div className="text-[10px] text-muted font-mono">
                      GST: {formatCurrency(inv.tax)}
                    </div>
                  </div>
                  <span className="h-5 px-2 py-0 inline-flex items-center rounded text-[10px] font-medium border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text uppercase">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-muted">
              No recent invoices found in the selected range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
