import { useState, useMemo } from 'react';
import { Badge, LoadingState } from '@/shared/ui';
import { formatCurrency, formatDate, formatPhone } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { DealerBillPrintModal } from './DealerBillPrintModal';
import {
  FileText,
  Calendar,
  Search,
  Plus,
  TrendingDown,
  Coins,
  History,
  Receipt,
  Package,
  CreditCard,
  Building2,
  Clock,
  AlertCircle,
  Printer,
  MessageCircle,
} from 'lucide-react';

export function BillsRegisterTable({
  bills = [],
  dealers = [],
  currentStore,
  isLoading,
  onOpenAddBill,
  onOpenRecordPayment,
  onOpenTimeline,
}) {
  const [search, setSearch] = useState('');
  const [dealerFilter, setDealerFilter] = useState('all');
  const [billTypeFilter, setBillTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [printingBill, setPrintingBill] = useState(null);

  // Derive unique dealer list for filter dropdown
  const dealerOptions = useMemo(() => {
    const map = new Map();
    dealers.forEach((d) => {
      if (d.id) map.set(d.id, d.name || d.brand_name || 'Unnamed Dealer');
    });
    bills.forEach((b) => {
      if (b.dealer?.id && !map.has(b.dealer.id)) {
        map.set(b.dealer.id, b.dealer.name || b.dealer.brand_name || 'Unnamed Dealer');
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dealers, bills]);

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        b.bill_number?.toLowerCase().includes(q) ||
        b.dealer?.name?.toLowerCase().includes(q) ||
        b.dealer?.brand_name?.toLowerCase().includes(q) ||
        b.notes?.toLowerCase().includes(q) ||
        (Array.isArray(b.items) &&
          b.items.some((it) => it?.name?.toLowerCase().includes(q)));

      const matchDealer =
        dealerFilter === 'all' ||
        b.dealer_id === dealerFilter ||
        b.dealer?.id === dealerFilter;

      const matchType = billTypeFilter === 'all' || b.bill_type === billTypeFilter;
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;

      return matchSearch && matchDealer && matchType && matchStatus;
    });
  }, [bills, search, dealerFilter, billTypeFilter, statusFilter]);

  // Aggregate stats of currently displayed bills
  const totalBalanceDue = useMemo(() => {
    return filteredBills.reduce((acc, b) => acc + (Number(b.balance_amount) || 0), 0);
  }, [filteredBills]);

  // WhatsApp Payment Reminder Builder & Dispatcher
  function handleSendWhatsAppReminder(bill) {
    const dealer = bill.dealer || {};
    const dealerName = dealer.name || dealer.brand_name || 'Valued Partner';
    const total = Number(bill.total_amount || 0);
    const paid = Number(bill.paid_amount || 0);
    const balance = Number(bill.balance_amount || 0);
    const billTypeLabel = bill.bill_type === 'gst' ? 'Tax Invoice' : 'Purchase Parchi / Slip';
    const storeName = currentStore?.name || 'Star Enterprises';
    const billDateStr = bill.bill_date ? formatDate(bill.bill_date, false) : '-';

    const itemsSummary = Array.isArray(bill.items) && bill.items.length > 0
      ? bill.items.map((it) => `• ${it.name || it.description} (Qty: ${it.quantity || 1})`).slice(0, 3).join('\n')
      : bill.notes || 'Consignment stock entry';

    const text = `*PAYMENT REMINDER - ${storeName.toUpperCase()}*
----------------------------------------
*Dear ${dealerName},*
This is a friendly reminder regarding the outstanding balance for the following purchase bill:

📄 *Bill / Slip No:* #${bill.bill_number} (${billTypeLabel})
📅 *Bill Date:* ${billDateStr}
${bill.credit_days ? `⏳ *Credit Term:* ${bill.credit_days} Days\n` : ''}📦 *Purchased Goods:*
${itemsSummary}

💰 *Total Bill Amount:* ${formatCurrency(total)}
✅ *Paid to Date:* ${formatCurrency(paid)}
----------------------------------------
🔴 *REMAINING BALANCE DUE:* ${formatCurrency(balance)}
----------------------------------------
Kindly verify your khata records and arrange the settlement.

*From:* ${storeName}
📞 *Contact:* ${currentStore?.phone || '+91 93700 11653'}`;

    const rawPhone = (dealer.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const encoded = encodeURIComponent(text);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="bg-surface border border-border rounded-xl shadow-2xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search Bill #, Supplier, Item, Notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dealer Filter */}
            <select
              value={dealerFilter}
              onChange={(e) => setDealerFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage cursor-pointer max-w-[200px]"
            >
              <option value="all">All Dealers / Suppliers</option>
              {dealerOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={billTypeFilter}
              onChange={(e) => setBillTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage cursor-pointer"
            >
              <option value="all">All Bill Types (GST + Kaccha)</option>
              <option value="gst">GST Tax Invoices Only</option>
              <option value="kaccha">Kaccha (Non-GST / Estimates) Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Fully Settled / Paid</option>
            </select>

            {/* Section Actions: Primary Add Bill */}
            {onOpenAddBill && (
              <button
                type="button"
                onClick={onOpenAddBill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1B382B] text-white hover:bg-[#142d22] active:scale-[0.99] shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <Plus size={13} className="stroke-[2.5]" />
                <span>Add Bill</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter & Payable Summary Bar */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted">
          <span>
            Showing <strong className="text-text font-semibold">{filteredBills.length}</strong>{' '}
            {filteredBills.length === 1 ? 'purchase bill' : 'purchase bills'}
          </span>
          {totalBalanceDue > 0 && (
            <span>
              Total Outstanding Balance:{' '}
              <strong className="text-brand-crimson font-mono font-bold">
                {formatCurrency(totalBalanceDue)}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-surface border border-border rounded-xl shadow-2xs">
          <LoadingState
            size="md"
            title="Refreshing Purchase Bills"
            message="Updating bills, tax vouchers, and payment statuses..."
          />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredBills.length === 0 && (
        <div className="py-16 text-center bg-surface border border-dashed border-border rounded-xl shadow-2xs space-y-2">
          <Receipt size={34} className="mx-auto text-muted/50 mb-1" />
          <p className="font-semibold text-text text-sm">No purchase bills found</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {search || dealerFilter !== 'all' || billTypeFilter !== 'all' || statusFilter !== 'all'
              ? 'No bills match your active search or filter criteria. Try clearing filters.'
              : 'No dealer bills recorded yet. Click "+ Add Bill" to record your first purchase bill.'}
          </p>
        </div>
      )}

      {/* Individual Bills - Distinct Sections (Cards) */}
      {!isLoading && filteredBills.length > 0 && (
        <div className="space-y-3.5">
          {filteredBills.map((b) => {
            const total = Number(b.total_amount || 0);
            const paid = Number(b.paid_amount || 0);
            const balance = Number(b.balance_amount || 0);
            const totalTax =
              (Number(b.cgst_amount) || 0) +
              (Number(b.sgst_amount) || 0) +
              (Number(b.igst_amount) || 0) ||
              Number(b.total_tax_amount) ||
              0;

            const itemsCount = Array.isArray(b.items) ? b.items.length : 0;
            const paymentsCount = Array.isArray(b.payments) ? b.payments.length : 0;

            return (
              <div
                key={b.id}
                className="bg-surface border border-border rounded-xl shadow-2xs hover:border-brand-sage/40 transition-all overflow-hidden"
              >
                {/* 1. Bill Section Header */}
                <div className="px-4 py-3 bg-surface-subtle/70 border-b border-border flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Bill / Invoice Number */}
                    <div className="flex items-center gap-1.5">
                      <FileText size={15} className="text-brand-sage shrink-0" />
                      <span className="font-mono font-bold text-sm text-text">
                        #{b.bill_number}
                      </span>
                    </div>

                    {/* GST vs Kaccha Badge */}
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0',
                        b.bill_type === 'gst'
                          ? 'bg-brand-sage-subtle text-brand-sage border-brand-sage-border'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      )}
                    >
                      {b.bill_type === 'gst' ? 'GST Tax Invoice' : 'Kaccha / Estimate'}
                    </span>

                    {/* Bill Date */}
                    <div className="flex items-center gap-1 text-xs text-muted font-medium">
                      <Calendar size={13} className="shrink-0" />
                      <span>{b.bill_date ? formatDate(b.bill_date, false) : '—'}</span>
                    </div>
                  </div>

                  {/* Right: Payment Status Badge & Due Countdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        b.status === 'paid'
                          ? 'success'
                          : b.status === 'partially_paid'
                          ? 'amber'
                          : 'danger'
                      }
                      className="text-[10px] font-bold uppercase px-2 py-0.5"
                    >
                      {b.status === 'paid'
                        ? 'Fully Settled'
                        : b.status === 'partially_paid'
                        ? 'Partially Paid'
                        : 'Unpaid'}
                    </Badge>

                    {b.status === 'paid' ? (
                      <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                        Cleared in {b.payment_days_taken || 0}d
                      </span>
                    ) : b.isOverdue ? (
                      <span className="text-[11px] text-brand-crimson font-bold bg-brand-crimson-subtle border border-brand-crimson-border rounded px-2 py-0.5 flex items-center gap-1">
                        <AlertCircle size={11} className="shrink-0" />
                        <span>{b.daysOverdue}d overdue</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted bg-surface border border-border rounded px-2 py-0.5">
                        {b.daysUntilDue}d credit left
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Bill Section Body (3-Column Breakdown) */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Column A: Supplier / Brand Details */}
                  <div className="space-y-1.5 md:col-span-4 md:border-r md:border-border/60 md:pr-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Building2 size={12} className="text-brand-sage" />
                      <span>Supplier / Brand Dealer</span>
                    </div>
                    <div className="font-bold text-sm text-text leading-snug">
                      {b.dealer?.name || b.dealer?.brand_name || 'Unknown Supplier'}
                    </div>
                    <div className="space-y-0.5 text-xs text-muted">
                      {b.dealer?.phone && (
                        <div className="font-mono">{formatPhone(b.dealer.phone)}</div>
                      )}
                      {b.dealer?.gstin && b.bill_type === 'gst' && (
                        <div className="text-[11px] font-mono text-brand-sage uppercase">
                          GSTIN: {b.dealer.gstin}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column B: Items & Consignment Description */}
                  <div className="space-y-1.5 md:col-span-5 md:border-r md:border-border/60 md:pr-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Package size={12} className="text-brand-sage" />
                      <span>Items Purchased</span>
                      {itemsCount > 0 && (
                        <span className="text-[10px] font-normal text-muted lowercase">
                          ({itemsCount} {itemsCount === 1 ? 'item' : 'items'})
                        </span>
                      )}
                    </div>

                    {itemsCount > 0 ? (
                      <div className="space-y-1.5">
                        {b.items.slice(0, 3).map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs gap-2 p-1.5 rounded-lg bg-surface-subtle/50 border border-border/50"
                          >
                            <span className="text-text font-medium truncate">
                              {it.name || it.description}
                            </span>
                            <span className="font-mono text-muted text-[11px] shrink-0 font-semibold">
                              Qty: {it.quantity || 1}
                              {it.unit_price ? ` × ₹${Number(it.unit_price).toLocaleString('en-IN')}` : ''}
                            </span>
                          </div>
                        ))}
                        {itemsCount > 3 && (
                          <div className="text-[11px] text-muted font-medium italic pl-1">
                            +{itemsCount - 3} more {itemsCount - 3 === 1 ? 'item' : 'items'}...
                          </div>
                        )}
                      </div>
                    ) : b.notes ? (
                      <p className="text-xs text-text italic leading-relaxed bg-surface-subtle/40 p-2 rounded-lg border border-border/50">
                        "{b.notes}"
                      </p>
                    ) : (
                      <p className="text-xs text-muted italic">
                        Consignment purchase entry
                      </p>
                    )}
                  </div>

                  {/* Column C: Financial Breakdown & Balance Due */}
                  <div className="space-y-2 md:col-span-3 text-left md:text-right">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                        Total Bill Amount
                      </span>
                      <span className="font-mono text-xl font-bold text-text block">
                        {formatCurrency(total)}
                      </span>
                      {b.bill_type === 'gst' && totalTax > 0 && (
                        <span className="text-[10px] font-mono text-muted block mt-0.5">
                          (incl. {formatCurrency(totalTax)} GST)
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between md:justify-end gap-3 text-xs">
                      <span className="text-muted text-[11px]">Outstanding Due:</span>
                      <span
                        className={cn(
                          'font-mono font-bold text-base',
                          balance > 0.01 ? 'text-brand-crimson' : 'text-emerald-600'
                        )}
                      >
                        {balance > 0.01 ? formatCurrency(balance) : '₹0 (Settled)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Bill Section Footer & Actions */}
                <div className="px-4 py-2.5 bg-surface-subtle/40 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Summary Metrics */}
                  <div className="flex items-center gap-2.5 text-xs text-muted flex-wrap">
                    <span>
                      Paid so far:{' '}
                      <strong className="font-mono text-text">{formatCurrency(paid)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Credit terms:{' '}
                      <strong className="text-text font-medium">
                        {b.credit_days ? `${b.credit_days} days` : 'Immediate'}
                      </strong>
                    </span>
                    {paymentsCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {paymentsCount} payment {paymentsCount === 1 ? 'voucher' : 'vouchers'} recorded
                        </span>
                      </>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Print Bill */}
                    <button
                      type="button"
                      onClick={() => setPrintingBill(b)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface text-muted hover:border-brand-sage hover:text-brand-sage hover:bg-brand-sage-subtle shadow-2xs transition-all cursor-pointer"
                      title="Print purchase bill or voucher"
                    >
                      <Printer size={13} className="shrink-0" />
                      <span>Print</span>
                    </button>

                    {/* Payment History & Timeline */}
                    {onOpenTimeline && (
                      <button
                        type="button"
                        onClick={() => onOpenTimeline(b.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface text-muted hover:border-brand-sage hover:text-brand-sage hover:bg-brand-sage-subtle shadow-2xs transition-all cursor-pointer"
                        title="View payment vouchers and timeline for this bill"
                      >
                        <History size={13} className="shrink-0" />
                        <span>Payment History</span>
                      </button>
                    )}

                    {/* WhatsApp Reminder (Shown when payment is not fully paid) */}
                    {balance > 0.01 && (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppReminder(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-2xs transition-all cursor-pointer font-medium"
                        title={`Send WhatsApp payment reminder to ${b.dealer?.name || 'supplier'} for ${formatCurrency(balance)}`}
                      >
                        <MessageCircle size={13} className="stroke-[2.5]" />
                        <span>WhatsApp Reminder</span>
                      </button>
                    )}

                    {/* Pay Bill (if balance > 0) */}
                    {balance > 0.01 && onOpenRecordPayment && (
                      <button
                        type="button"
                        onClick={() => onOpenRecordPayment(b.dealer, b)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white shadow-2xs transition-all cursor-pointer font-medium"
                        title={`Pay outstanding balance of ${formatCurrency(balance)}`}
                      >
                        <Coins size={13} className="stroke-[2.5]" />
                        <span>Pay Bill ({formatCurrency(balance)})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Bill Dialog Modal */}
      {printingBill && (
        <DealerBillPrintModal
          isOpen={!!printingBill}
          onClose={() => setPrintingBill(null)}
          bill={printingBill}
          currentStore={currentStore}
        />
      )}
    </div>
  );
}
