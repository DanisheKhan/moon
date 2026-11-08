import { useState, useMemo } from 'react';
import { Card, Button, Badge } from '@/shared/ui';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  FileText,
  Layers,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  Plus,
  TrendingDown,
} from 'lucide-react';

export function BillsRegisterTable({
  bills = [],
  isLoading,
  onOpenAddBill,
  onOpenDebitNote,
  onOpenRecordPayment,
  onOpenTimeline,
}) {
  const [search, setSearch] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        b.bill_number?.toLowerCase().includes(q) ||
        b.dealer?.name?.toLowerCase().includes(q) ||
        b.dealer?.brand_name?.toLowerCase().includes(q);

      const matchType = billTypeFilter === 'all' || b.bill_type === billTypeFilter;
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [bills, search, billTypeFilter, statusFilter]);

  return (
    <Card className="bg-surface border border-border rounded-xl shadow-2xs overflow-hidden">
      {/* Top Controls */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search by bill number, dealer brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={billTypeFilter}
              onChange={(e) => setBillTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            >
              <option value="all">All Bill Types (GST + Kaccha)</option>
              <option value="gst">GST Tax Invoices Only</option>
              <option value="kaccha">Kaccha (Non-GST / Estimates) Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            >
              <option value="all">All Payment Statuses</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Fully Cleared / Paid</option>
            </select>

            {/* Section Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {onOpenDebitNote && (
                <button
                  type="button"
                  onClick={onOpenDebitNote}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface text-text hover:bg-surface-subtle active:scale-[0.99] shadow-2xs transition-all cursor-pointer"
                >
                  <TrendingDown size={13} />
                  <span>Debit Note</span>
                </button>
              )}

              {onOpenAddBill && (
                <button
                  type="button"
                  onClick={onOpenAddBill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1B382B] text-white hover:bg-[#142d22] active:scale-[0.99] shadow-2xs transition-all cursor-pointer"
                >
                  <Plus size={13} className="stroke-[2.5]" />
                  <span>Add Bill</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table - 100% fluid, strictly zero horizontal overflow */}
      <div className="w-full overflow-hidden min-w-0">
        <table className="w-full table-fixed text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-subtle/80 border-b border-border text-[11px] font-bold text-muted uppercase tracking-wider">
              <th className="py-3 px-3 w-[15%]">Bill # & Type</th>
              <th className="py-3 px-3 w-[18%]">Brand / Dealer</th>
              <th className="py-3 px-3 w-[15%]">Dates & Credit</th>
              <th className="py-3 px-3 text-right w-[11%]">Bill Value</th>
              <th className="py-3 px-3 text-right w-[10%]">Paid</th>
              <th className="py-3 px-3 text-right w-[11%]">Balance Due</th>
              <th className="py-3 px-3 text-center w-[12%]">Status / Aging</th>
              <th className="py-3 px-3 text-right w-[8%]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted">
                  Loading bill registers...
                </td>
              </tr>
            ) : filteredBills.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted">
                  No bills found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredBills.map((b) => {
                const total = Number(b.total_amount || 0);
                const paid = Number(b.paid_amount || 0);
                const balance = Number(b.balance_amount || 0);

                return (
                  <tr
                    key={b.id}
                    className="hover:bg-surface-subtle/50 transition-colors"
                  >
                    {/* Bill # & Type */}
                    <td className="py-2.5 px-3 min-w-0">
                      <div className="space-y-0.5">
                        <div className="font-bold font-mono text-text text-xs truncate" title={b.bill_number}>
                          {b.bill_number}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                              b.bill_type === 'gst'
                                ? 'bg-brand-sage-subtle text-brand-sage border-brand-sage-border'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {b.bill_type === 'gst' ? 'GST Invoice' : 'Kaccha Slip'}
                          </span>
                          {b.items?.length > 0 && (
                            <span className="text-[9px] text-muted font-medium">
                              • {b.items.length} {b.items.length === 1 ? 'item' : 'items'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Dealer / Brand */}
                    <td className="py-2.5 px-3 min-w-0">
                      <div className="space-y-0.5">
                        <div className="font-bold text-text text-xs truncate" title={b.dealer?.brand_name || b.dealer?.name}>
                          {b.dealer?.brand_name || b.dealer?.name}
                        </div>
                        <div className="text-[10px] text-muted truncate" title={b.dealer?.name}>
                          {b.dealer?.name}
                        </div>
                      </div>
                    </td>

                    {/* Dates & Terms */}
                    <td className="py-2.5 px-3 min-w-0">
                      <div className="space-y-0.5 text-[10px]">
                        <div className="truncate">
                          Date: <span className="text-text font-medium">{formatDate(b.bill_date, false)}</span>
                        </div>
                        <div className="text-muted truncate">
                          Terms: <span className="font-mono text-text">{b.credit_days}d</span> | Due:{' '}
                          <span className="font-medium text-text">{formatDate(b.due_date, false)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Total Bill Value */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-text text-xs whitespace-nowrap min-w-0">
                      {formatCurrency(total)}
                    </td>

                    {/* Paid Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-brand-sage text-xs whitespace-nowrap min-w-0">
                      {formatCurrency(paid)}
                    </td>

                    {/* Remaining Balance */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap min-w-0">
                      <span
                        className={
                          balance > 0 ? 'text-amber-950 text-xs' : 'text-emerald-600 text-xs'
                        }
                      >
                        {formatCurrency(balance)}
                      </span>
                    </td>

                    {/* Status & Aging Velocity */}
                    <td className="py-2.5 px-3 text-center min-w-0">
                      <div className="space-y-0.5">
                        <div>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              b.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'partially_paid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.status === 'paid'
                              ? 'Paid'
                              : b.status === 'partially_paid'
                              ? 'Partially Paid'
                              : 'Unpaid'}
                          </span>
                        </div>

                        {/* Velocity Badge */}
                        {b.status === 'paid' ? (
                          <div className="text-[9px] text-emerald-700 font-semibold flex items-center justify-center gap-0.5">
                            <Clock size={9} /> {b.payment_days_taken || 0}d
                          </div>
                        ) : b.isOverdue ? (
                          <div className="text-[9px] text-brand-crimson font-bold flex items-center justify-center gap-0.5">
                            <AlertCircle size={9} /> {b.daysOverdue}d Overdue
                          </div>
                        ) : (
                          <div className="text-[9px] text-muted font-medium">
                            {b.daysUntilDue}d left
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right min-w-0">
                      <div className="flex items-center justify-end gap-1">
                        {balance > 0 && onOpenRecordPayment && (
                          <button
                            onClick={() => onOpenRecordPayment(b.dealer, b)}
                            title="Record Payment against this bill"
                            className="w-7 h-7 rounded-lg bg-accent text-accent-fg hover:opacity-90 flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
                            aria-label="Pay Bill"
                          >
                            <CreditCard size={12} className="stroke-[2.5]" />
                          </button>
                        )}

                        {onOpenTimeline && (
                          <button
                            onClick={() => onOpenTimeline(b.id)}
                            title="View Payment Timeline & Aging"
                            className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-surface-subtle text-muted hover:text-text flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
                            aria-label="View Timeline"
                          >
                            <Clock size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
