import { useState, useMemo } from 'react';
import { Card, Button, Badge } from '@/shared/ui';
import { useDealerStatement } from '../hooks/useDealers';
import { formatCurrency, formatDate, formatPhone } from '@/shared/lib/format';
import {
  FileText,
  CreditCard,
  TrendingDown,
  Building2,
  Phone,
  Share2,
  Printer,
  Plus,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export function DealerKhataLedger({
  dealerId,
  onOpenAddBill,
  onOpenRecordPayment,
  onOpenDebitNote,
  onOpenTimeline,
}) {
  const [billTypeFilter, setBillTypeFilter] = useState('all'); // all | gst | kaccha

  const { data: statement, isLoading } = useDealerStatement(dealerId, {
    billType: billTypeFilter,
  });

  const dealer = statement?.dealer;
  const entries = statement?.entries || [];

  // WhatsApp share message builder
  function handleShareWhatsApp() {
    if (!dealer) return;

    const todayFormatted = formatDate(new Date(), false);
    const text = `*STAR ENTERPRISES - DEALER KHATA STATEMENT*
----------------------------------------
*Dealer:* ${dealer.brand_name || dealer.name} (${dealer.name})
*Date:* ${todayFormatted}
*Ledger View:* ${billTypeFilter === 'all' ? 'Combined (GST + Kaccha)' : billTypeFilter.toUpperCase()}

*Total Invoiced:* ${formatCurrency(statement.totalBillsAmount)}
*Total Paid:* ${formatCurrency(statement.totalPaidAmount)}
*Debit Notes:* ${formatCurrency(statement.totalDebitsAmount)}
----------------------------------------
*CURRENT OUTSTANDING BALANCE:* ${formatCurrency(statement.closingBalance)}
----------------------------------------
Thank you for your ongoing partnership!`;

    const encoded = encodeURIComponent(text);
    const url = dealer.phone
      ? `https://wa.me/91${dealer.phone.replace(/\D/g, '')}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-4">
      {/* Dealer Profile & Khata Header */}
      <Card className="p-5 bg-surface border border-border rounded-xl shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-sage-subtle border border-brand-sage-border text-brand-sage flex items-center justify-center font-bold text-lg shrink-0">
              {dealer?.brand_name?.slice(0, 2).toUpperCase() || 'DL'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-text">
                  {dealer?.brand_name || dealer?.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-subtle border border-border font-medium text-text">
                  {dealer?.dealer_type?.replace('_', ' ').toUpperCase()}
                </span>
                {dealer?.billing_mode && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Mode: {dealer.billing_mode.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted mt-0.5">{dealer?.name}</div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted mt-2">
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={12} /> {formatPhone(dealer?.phone)}
                </span>
                {dealer?.gstin && (
                  <span className="font-mono">GSTIN: {dealer.gstin}</span>
                )}
                {dealer?.city && <span>City: {dealer.city}</span>}
                <span className="font-semibold text-text">
                  Credit Terms: {dealer?.default_credit_days || 30} Days
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              <Share2 size={14} />
              <span>Share WhatsApp</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer size={14} />
              <span>Print Ledger</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenAddBill(dealer)}
              className="gap-1.5"
            >
              <Plus size={14} />
              <span>Add Bill</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onOpenRecordPayment(dealer)}
              className="gap-1.5"
            >
              <CreditCard size={14} />
              <span>Record Payment</span>
            </Button>
          </div>
        </div>

        {/* 4 KPI Summary Blocks for this Dealer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
          <div className="p-3 rounded-lg bg-surface-subtle border border-border">
            <div className="text-[11px] text-muted uppercase font-bold tracking-wider">
              Total Invoiced
            </div>
            <div className="text-base font-bold font-mono text-text mt-1">
              {isLoading ? '...' : formatCurrency(statement?.totalBillsAmount || 0)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-subtle border border-brand-sage-border/60">
            <div className="text-[11px] text-brand-sage uppercase font-bold tracking-wider">
              Total Paid
            </div>
            <div className="text-base font-bold font-mono text-brand-sage mt-1">
              {isLoading ? '...' : formatCurrency(statement?.totalPaidAmount || 0)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-subtle border border-purple-200">
            <div className="text-[11px] text-purple-800 uppercase font-bold tracking-wider">
              Debit Notes (Returns)
            </div>
            <div className="text-base font-bold font-mono text-purple-900 mt-1">
              {isLoading ? '...' : formatCurrency(statement?.totalDebitsAmount || 0)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-subtle border border-amber-300">
            <div className="text-[11px] text-amber-900 uppercase font-bold tracking-wider">
              Current Outstanding
            </div>
            <div className="text-lg font-bold font-mono text-amber-950 mt-1">
              {isLoading ? '...' : formatCurrency(statement?.closingBalance || 0)}
            </div>
          </div>
        </div>
      </Card>

      {/* Ledger Table with Two-Book Separation Toggle */}
      <Card className="bg-surface border border-border rounded-xl shadow-2xs overflow-hidden">
        {/* Toggle Bar */}
        <div className="p-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text uppercase tracking-wide">
              Khata Passbook Ledger
            </span>
            <span className="text-[11px] text-muted">
              ({entries.length} entries)
            </span>
          </div>

          {/* Kaccha vs GST Tabs */}
          <div className="inline-flex rounded-lg border border-border bg-surface-subtle p-0.5 text-xs">
            <button
              onClick={() => setBillTypeFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                billTypeFilter === 'all'
                  ? 'bg-surface text-text shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              All Ledgers
            </button>
            <button
              onClick={() => setBillTypeFilter('gst')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                billTypeFilter === 'gst'
                  ? 'bg-brand-sage text-white shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              <FileText size={12} />
              <span>GST Only (Pakka)</span>
            </button>
            <button
              onClick={() => setBillTypeFilter('kaccha')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                billTypeFilter === 'kaccha'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Layers size={12} />
              <span>Kaccha Only (Estimates)</span>
            </button>
          </div>
        </div>

        {/* Ledger Passbook Table */}
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-subtle/80 border-b border-border text-[11px] font-bold text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Voucher / Ref No</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Debit (+) Payable</th>
                <th className="py-3 px-4 text-right">Credit (-) Paid</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4 text-center">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    Loading Khata statement...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    No transactions recorded for this dealer yet.
                  </td>
                </tr>
              ) : (
                entries.map((row) => {
                  const isBill = row.entryType === 'BILL';
                  const isPayment = row.entryType === 'PAYMENT';
                  const isDebit = row.entryType === 'DEBIT_NOTE';

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-subtle/50 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-[11px] text-text whitespace-nowrap">
                        {formatDate(row.date, false)}
                      </td>

                      {/* Entry Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isBill ? (
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              row.billType === 'gst'
                                ? 'bg-brand-sage-subtle text-brand-sage border-brand-sage-border'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {row.billType === 'gst' ? 'GST Bill' : 'Kaccha Bill'}
                          </span>
                        ) : isPayment ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Payment
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                            Debit Note
                          </span>
                        )}
                      </td>

                      {/* Reference Number */}
                      <td className="py-3 px-4 font-mono font-semibold text-text whitespace-nowrap">
                        {row.refNumber}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-muted max-w-[240px] truncate">
                        {row.description}
                      </td>

                      {/* Debit (+) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-text whitespace-nowrap">
                        {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                      </td>

                      {/* Credit (-) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-brand-sage whitespace-nowrap">
                        {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-950 whitespace-nowrap">
                        {formatCurrency(row.runningBalance)}
                      </td>

                      {/* Timeline audit action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isBill && onOpenTimeline && (
                          <button
                            onClick={() => onOpenTimeline(row.id)}
                            title="Inspect Payment Speed & Timeline"
                            className="p-1 rounded text-muted hover:text-brand-sage hover:bg-brand-sage-subtle transition-colors"
                          >
                            <Clock size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
