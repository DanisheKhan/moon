import { formatCurrency, formatDate } from '@/shared/lib/format';
import { CreditCard, Building2, Receipt } from 'lucide-react';

export function PaymentAndBranchSplit({
  payments = {},
  branches = [],
  recentInvoices = [],
}) {
  const paymentList = payments.list || [];

  return (
    <div className="space-y-6">
      {/* 2-Column Split: Payments & Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Payment Method Breakdown */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={15} className="text-muted" />
                  Payment Method Telemetry
                </h3>
                <span className="text-xs text-muted">Direct receipts across channels</span>
              </div>
              {payments.estimatedCardMdrCost > 0 && (
                <span className="text-[11px] font-mono text-muted">
                  Est. MDR Fees: <strong className="text-text">{formatCurrency(payments.estimatedCardMdrCost)}</strong>
                </span>
              )}
            </div>

            <div className="space-y-4">
              {paymentList.map((item) => (
                <div key={item.method} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-text truncate">{item.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${item.badgeColor}`}>
                        {item.feeRate}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-text font-mono">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-muted ml-1 font-mono">({item.pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg overflow-hidden border border-border/50">
                    <div
                      className={`h-full rounded-full ${item.barColor}`}
                      style={{ width: `${Math.min(100, Math.max(3, item.pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-bg/40 text-[11px] text-muted flex items-center justify-between">
            <span>Instant Bank Settlement (UPI):</span>
            <span className="font-semibold text-brand-sage">Zero Processing Charges</span>
          </div>
        </div>

        {/* Branch Performance Contribution */}
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
                      <div className="text-[10px] text-muted font-mono">{st.gstin}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-text text-base font-mono">
                        {formatCurrency(st.sales)}
                      </div>
                      <div className="text-[10px] text-muted">{st.invoices} bills completed</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-[11px]">
                    <div>
                      <span className="text-muted block text-[10px]">Avg Order (AOV)</span>
                      <span className="font-medium text-text font-mono">{formatCurrency(st.aov)}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px]">Gross Profit</span>
                      <span className="font-medium text-text font-mono">{formatCurrency(st.profit)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted block text-[10px]">Margin %</span>
                      <span className="font-semibold text-brand-sage font-mono">
                        {(st.marginPct || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
