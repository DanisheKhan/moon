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
} from 'lucide-react';

export function BillsRegisterTable({
  bills = [],
  isLoading,
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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-w-0">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-subtle/80 border-b border-border text-[11px] font-bold text-muted uppercase tracking-wider">
              <th className="py-3 px-4">Bill # & Type</th>
              <th className="py-3 px-4">Brand / Dealer</th>
              <th className="py-3 px-4">Dates & Credit</th>
              <th className="py-3 px-4 text-right">Bill Value</th>
              <th className="py-3 px-4 text-right">Paid</th>
              <th className="py-3 px-4 text-right">Balance Due</th>
              <th className="py-3 px-4 text-center">Status / Aging Velocity</th>
              <th className="py-3 px-4 text-right">Actions</th>
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
                    <td className="py-3.5 px-4 min-w-[150px]">
                      <div className="space-y-0.5">
                        <div className="font-bold font-mono text-text text-sm">
                          {b.bill_number}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                            b.bill_type === 'gst'
                              ? 'bg-brand-sage-subtle text-brand-sage border-brand-sage-border'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {b.bill_type === 'gst' ? 'GST Invoice' : 'Kaccha Slip'}
                        </span>
                      </div>
                    </td>

                    {/* Dealer / Brand */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="space-y-0.5">
                        <div className="font-bold text-text">
                          {b.dealer?.brand_name || b.dealer?.name}
                        </div>
                        <div className="text-[11px] text-muted truncate max-w-[180px]">
                          {b.dealer?.name}
                        </div>
                      </div>
                    </td>

                    {/* Dates & Terms */}
                    <td className="py-3.5 px-4 min-w-[150px]">
                      <div className="space-y-0.5 text-[11px]">
                        <div>
                          Date: <span className="text-text font-medium">{formatDate(b.bill_date, false)}</span>
                        </div>
                        <div className="text-muted">
                          Terms: <span className="font-mono text-text">{b.credit_days}d</span> | Due:{' '}
                          <span className="font-medium text-text">{formatDate(b.due_date, false)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Total Bill Value */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-text whitespace-nowrap min-w-[110px]">
                      {formatCurrency(total)}
                    </td>

                    {/* Paid Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-brand-sage whitespace-nowrap min-w-[100px]">
                      {formatCurrency(paid)}
                    </td>

                    {/* Remaining Balance */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap min-w-[120px]">
                      <span
                        className={
                          balance > 0 ? 'text-amber-950 text-sm' : 'text-emerald-600'
                        }
                      >
                        {formatCurrency(balance)}
                      </span>
                    </td>

                    {/* Status & Aging Velocity */}
                    <td className="py-3.5 px-4 text-center min-w-[170px]">
                      <div className="space-y-1">
                        <div>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
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
                          <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                            <Clock size={10} /> Cleared in {b.payment_days_taken || 0}d
                          </div>
                        ) : b.isOverdue ? (
                          <div className="text-[10px] text-brand-crimson font-bold flex items-center justify-center gap-1">
                            <AlertCircle size={10} /> {b.daysOverdue}d Overdue
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted font-medium">
                            {b.daysUntilDue}d remaining
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right min-w-[130px]">
                      <div className="flex items-center justify-end gap-1.5">
                        {balance > 0 && onOpenRecordPayment && (
                          <button
                            onClick={() => onOpenRecordPayment(b.dealer, b)}
                            title="Record Payment against this bill"
                            className="px-2 py-1 text-[11px] font-semibold rounded bg-brand-sage-subtle border border-brand-sage-border text-brand-sage hover:bg-brand-sage hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <CreditCard size={11} />
                            <span>Pay</span>
                          </button>
                        )}

                        {onOpenTimeline && (
                          <button
                            onClick={() => onOpenTimeline(b.id)}
                            title="View Payment Timeline & Aging"
                            className="p-1 rounded text-muted hover:text-text hover:bg-surface-subtle transition-colors"
                          >
                            <Clock size={14} />
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
