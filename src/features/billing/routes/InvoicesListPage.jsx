import { useState, useMemo } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/shared/ui';
import { useAllInvoices, useInvoiceDetail } from '../hooks/useBilling';
import { useStores } from '@/features/stores';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { EditInvoiceModal } from '../components/EditInvoiceModal';
import { CollectPaymentModal } from '../components/CollectPaymentModal';
import { ReturnProductModal } from '../components/ReturnProductModal';
import { downloadBillingHistoryExcel } from '../lib/exportBillingHistory';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import {
  Receipt,
  Search,
  Filter,
  Pencil,
  Printer,
  Building2,
  Calendar,
  RotateCcw,
  Coins,
  FileSpreadsheet,
} from 'lucide-react';

function WhatsAppIcon({ size = 14, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'paid', label: 'Paid' },
  { id: 'partial', label: 'Partial Payment' },
  { id: 'pending', label: 'Pending Payment' },
  { id: 'returned', label: 'Returned' },
  { id: 'void', label: 'Void / Cancelled' },
];

const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'month', label: 'This Month' },
];

export function InvoicesListPage() {
  const outletCtx = useOutletContext();
  const { storeCode: paramStoreCode } = useParams();
  const currentStore = outletCtx?.store;
  const initialStoreCode = currentStore?.code || paramStoreCode || 'all';

  // Filters state
  const [storeFilter, setStoreFilter] = useState(initialStoreCode);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Modals state
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const [collectingInvoice, setCollectingInvoice] = useState(null);
  const [returningInvoice, setReturningInvoice] = useState(null);

  // Auto-open print preview if redirected from POS via ?print=id
  const printParamId = searchParams.get('print');
  const activeViewingInvoiceId = viewingInvoiceId || printParamId;

  const handleClosePrintModal = () => {
    setViewingInvoiceId(null);
    if (searchParams.has('print')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('print');
      setSearchParams(nextParams, { replace: true });
    }
  };

  // Stores
  const { data: stores = [] } = useStores();

  // Invoices Query
  const { data: invoices = [], isLoading } = useAllInvoices({
    storeId: storeFilter,
    status: statusFilter,
    dateRange: dateFilter,
    search: searchQuery,
  });

  const { data: viewingInvoiceDetail } = useInvoiceDetail(activeViewingInvoiceId);

  // Summary Metrics
  const metrics = useMemo(() => {
    const validInvoices = invoices.filter((i) => i.status !== 'void');
    const totalSales = validInvoices.reduce((acc, i) => acc + (parseFloat(i.grand_total) || 0), 0);

    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;
    let returnedCount = 0;
    let voidCount = 0;
    let totalBalanceDue = 0;

    validInvoices.forEach((inv) => {
      const paid = (inv.payments || []).reduce((pAcc, p) => pAcc + (parseFloat(p.amount) || 0), 0);
      const grandTotal = parseFloat(inv.grand_total) || 0;
      const due = Math.max(grandTotal - paid, 0);
      totalBalanceDue += due;

      let effStatus = inv.status;
      if (inv.status !== 'returned' && inv.status !== 'partially_returned') {
        if (due <= 0.01) {
          effStatus = 'paid';
        } else if (paid > 0) {
          effStatus = 'partial';
        } else {
          effStatus = 'pending';
        }
      }

      if (effStatus === 'paid') paidCount++;
      else if (effStatus === 'partial') partialCount++;
      else if (effStatus === 'pending') pendingCount++;
      else if (effStatus === 'returned' || effStatus === 'partially_returned') returnedCount++;
    });

    voidCount = invoices.filter((i) => i.status === 'void').length;

    return {
      count: invoices.length,
      validCount: validInvoices.length,
      totalSales,
      paidCount,
      partialCount,
      pendingCount,
      returnedCount,
      voidCount,
      totalBalanceDue,
    };
  }, [invoices]);

  // WhatsApp invoice / payment reminder dispatcher
  function handleSendWhatsApp(inv) {
    const totalPaid = (inv.payments || []).reduce(
      (acc, p) => acc + (parseFloat(p.amount) || 0),
      0
    );
    const grandTotal = parseFloat(inv.grand_total) || 0;
    const balanceDue = Math.max(grandTotal - totalPaid, 0);
    const isDue = balanceDue > 0.01;

    const matchedStore = stores.find((s) => s.id === inv.store_id);
    const storeName = matchedStore?.name || 'Star Enterprises';
    const storePhone = matchedStore?.phone || '+91 93700 11653';
    const customerName = inv.customer_name?.trim() || 'Valued Customer';
    const purchaseDate = inv.created_at ? formatDate(inv.created_at, false) : 'Recent Purchase';

    const itemsList =
      Array.isArray(inv.order_items) && inv.order_items.length > 0
        ? inv.order_items
            .slice(0, 3)
            .map((it) => `• ${it.item_name || 'Product'} (Qty: ${it.quantity || 1})`)
            .join('\n')
        : '• Purchased Store Goods';

    let message = '';
    if (isDue) {
      message = `*PAYMENT REMINDER - ${storeName.toUpperCase()}*
----------------------------------------
*Dear ${customerName},*
This is a gentle reminder regarding the outstanding balance for your purchase invoice:

📄 *Invoice No:* #${inv.invoice_number}
📅 *Date of Purchase:* ${purchaseDate}
📦 *Items Purchased:*
${itemsList}

💰 *Total Bill Amount:* ${formatCurrency(grandTotal)}
✅ *Amount Received:* ${formatCurrency(totalPaid)}
----------------------------------------
🔴 *REMAINING AMOUNT DUE:* ${formatCurrency(balanceDue)}
----------------------------------------
Kindly arrange the payment clearance of the remaining amount to ${storeName} at your earliest convenience.

*Pay To:* ${storeName}
📞 *Store Contact:* ${storePhone}

Thank you for your business!`;
    } else {
      message = `*TAX INVOICE RECEIPT - ${storeName.toUpperCase()}*
----------------------------------------
*Dear ${customerName},*
Thank you for your purchase with ${storeName}!

📄 *Invoice No:* #${inv.invoice_number}
📅 *Date of Purchase:* ${purchaseDate}
📦 *Items Purchased:*
${itemsList}

💰 *Total Bill Amount:* ${formatCurrency(grandTotal)}
✅ *Amount Paid:* ${formatCurrency(totalPaid)}
✨ *Payment Status:* Fully Settled / Paid
----------------------------------------
🏢 *Store:* ${storeName}
📞 *Store Contact:* ${storePhone}

We appreciate your business and look forward to serving you again!`;
    }

    const cleanPhone = (inv.customer_phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encoded = encodeURIComponent(message);
    const url = phoneWithCountry
      ? `https://wa.me/${phoneWithCountry}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-6 min-w-0 pb-12">
      {/* 1. Page Header & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              SALES & GST REGISTERS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            All Bills & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            Inspect, search, view GST receipts, and directly edit customer information, line items, and payment status.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="solid"
            size="sm"
            onClick={() => downloadBillingHistoryExcel(invoices)}
            disabled={isLoading || invoices.length === 0}
            className="gap-1.5"
            title="Download the currently filtered billing history as an Excel sheet"
          >
            <FileSpreadsheet size={14} />
            <span>Download Excel</span>
          </Button>
          <div className="p-2 sm:px-3 sm:py-2 rounded-lg border border-border bg-surface text-xs font-medium text-text flex items-center gap-2 shadow-2xs">
            <Receipt size={14} className="text-brand-sage shrink-0" />
            <span>
              <strong>{metrics.count}</strong> {metrics.count === 1 ? 'Bill' : 'Bills'} Recorded
            </span>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <span className="text-[11px] uppercase font-bold tracking-wider text-muted block truncate">
            TOTAL BILLED VALUE
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text truncate">
            {formatCurrency(metrics.totalSales)}
          </div>
          <span className="text-xs text-muted block truncate">
            Across {metrics.validCount} valid bills
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <span className="text-[11px] uppercase font-bold tracking-wider text-muted block truncate">
            PAID INVOICES
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-brand-sage truncate">
            {metrics.paidCount}
          </div>
          <span className="text-xs text-muted block truncate">
            Fully settled receipts
          </span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'partial' ? 'all' : 'partial')}
          className={cn(
            'p-4 rounded-xl border bg-surface shadow-2xs space-y-1 min-w-0 cursor-pointer transition-colors',
            statusFilter === 'partial'
              ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
              : 'border-border hover:border-amber-400'
          )}
          title="Click to filter bills with outstanding balance"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted block truncate">
              OUTSTANDING DUES (UDHAAR)
            </span>
            {statusFilter === 'partial' && (
              <Badge variant="amber" className="text-[9px] py-0 px-1.5 uppercase font-bold">
                Filtered
              </Badge>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 truncate">
            {formatCurrency(metrics.totalBalanceDue)}
          </div>
          <span className="text-xs text-muted block truncate">
            {metrics.partialCount} partial • {metrics.pendingCount} pending bills
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <span className="text-[11px] uppercase font-bold tracking-wider text-muted block truncate">
            RETURNS & REFUNDS
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-purple-600 truncate">
            {metrics.returnedCount}
          </div>
          <span className="text-xs text-muted block truncate">
            {metrics.voidCount} voided / cancelled
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Invoice #, Customer, Phone..."
              className="w-full min-h-10 pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-xs text-text placeholder:text-muted focus:outline-brand-sage transition-colors"
            />
          </div>

          {/* Store Branch Filter */}
          <div className="relative flex items-center rounded-lg border border-border bg-surface px-3 min-h-10 text-xs">
            <Building2 size={13} className="text-muted shrink-0 mr-2" />
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-medium text-text focus:outline-none cursor-pointer"
            >
              <option value="all">All Stores & Branches</option>
              {stores.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative flex items-center rounded-lg border border-border bg-surface px-3 min-h-10 text-xs">
            <Filter size={13} className="text-muted shrink-0 mr-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-medium text-text focus:outline-none cursor-pointer"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="relative flex items-center rounded-lg border border-border bg-surface px-3 min-h-10 text-xs">
            <Calendar size={13} className="text-muted shrink-0 mr-2" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-medium text-text focus:outline-none cursor-pointer"
            >
              {DATE_FILTERS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Bills Table */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted">Retrieving all store invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <Card className="p-12 text-center space-y-2 border-dashed">
          <Receipt size={32} className="text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-text">No bills found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || storeFilter !== 'all'
              ? 'No invoices match your selected filter criteria. Try clearing search or selecting All Time.'
              : 'No invoices generated yet. Use the POS terminal to create sales invoices.'}
          </p>
        </Card>
      ) : (
        <Table className="w-full min-w-190 table-fixed">
          <TableHead>
            <TableRow className="bg-surface-subtle">
              <TableHeaderCell className="w-[14%]">Date of Purchase</TableHeaderCell>
              <TableHeaderCell className="w-[18%]">Customer Name</TableHeaderCell>
              <TableHeaderCell className="w-[28%]">Item</TableHeaderCell>
              <TableHeaderCell className="w-[13%]">Grand Total</TableHeaderCell>
              <TableHeaderCell className="w-[11%] text-center px-1">Status</TableHeaderCell>
              <TableHeaderCell className="w-[16%] text-center px-2">
                Actions
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => {
              const itemsCount = inv.order_items?.length || 0;
              const itemsPreview = (inv.order_items || [])
                .slice(0, 2)
                .map((it) => `${it.item_name} (${it.quantity})`)
                .join(', ');

              const totalPaid = (inv.payments || []).reduce(
                (acc, p) => acc + (parseFloat(p.amount) || 0),
                0
              );
              const grandTotal = parseFloat(inv.grand_total) || 0;
              const balanceDue = Math.max(grandTotal - totalPaid, 0);

              // Mathematically accurate effective status
              let effectiveStatus = inv.status;
              if (inv.status !== 'void' && inv.status !== 'returned' && inv.status !== 'partially_returned') {
                if (balanceDue <= 0.01) {
                  effectiveStatus = 'paid';
                } else if (totalPaid > 0) {
                  effectiveStatus = 'partial';
                } else {
                  effectiveStatus = 'pending';
                }
              }

              return (
                <TableRow key={inv.id} className="hover:bg-surface-subtle/50 transition-colors">
                  {/* 1. Date of Purchase & Invoice # */}
                  <TableCell className="align-middle min-w-0">
                    <div className="text-xs font-semibold text-text flex items-center gap-1.5 truncate">
                      <Calendar size={12} className="text-muted shrink-0" />
                      <span className="truncate">{inv.created_at ? formatDate(inv.created_at, false) : '—'}</span>
                    </div>
                    <div className="font-mono text-[10px] text-muted truncate mt-0.5">
                      #{inv.invoice_number}
                    </div>
                  </TableCell>

                  {/* 2. Customer Name */}
                  <TableCell className="align-middle min-w-0">
                    <div className="font-semibold text-sm text-text truncate" title={inv.customer_name}>
                      {inv.customer_name || 'Walk-in Customer'}
                    </div>
                    {inv.customer_phone && (
                      <div className="text-xs text-muted font-mono truncate">
                        {inv.customer_phone}
                      </div>
                    )}
                    {inv.customer_gstin && (
                      <div className="text-[10px] text-brand-sage font-mono uppercase truncate" title={inv.customer_gstin}>
                        GST: {inv.customer_gstin}
                      </div>
                    )}
                  </TableCell>

                  {/* 3. Item Summary */}
                  <TableCell className="align-middle min-w-0">
                    <div className="text-sm font-medium text-text truncate" title={itemsPreview}>
                      {itemsCount > 0 ? itemsPreview : 'No items'}
                    </div>
                    {itemsCount > 2 && (
                      <div className="text-xs text-muted truncate">
                        +{itemsCount - 2} more {itemsCount - 2 === 1 ? 'item' : 'items'}
                      </div>
                    )}
                  </TableCell>

                  {/* 4. Grand Total */}
                  <TableCell className="align-middle whitespace-nowrap font-mono">
                    <div className="font-bold text-sm sm:text-base text-text">
                      {formatCurrency(grandTotal)}
                    </div>
                    <div className="text-xs text-muted truncate mt-0.5 font-sans">
                      Tax: {formatCurrency((inv.cgst_amount || 0) + (inv.sgst_amount || 0))}
                    </div>
                  </TableCell>

                  {/* 5. Status - Cleanly centered with dedicated visual column */}
                  <TableCell className="align-middle text-center whitespace-nowrap px-1">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Badge
                        variant={
                          effectiveStatus === 'paid'
                            ? 'success'
                            : effectiveStatus === 'partial'
                            ? 'amber'
                            : effectiveStatus === 'pending'
                            ? 'danger'
                            : effectiveStatus === 'void'
                            ? 'default'
                            : 'outline'
                        }
                        className={cn(
                          'text-[10px] font-semibold uppercase px-2 py-0.5 inline-flex justify-center',
                          (effectiveStatus === 'returned' || effectiveStatus === 'partially_returned') &&
                            'border-purple-300 text-purple-700 bg-purple-50'
                        )}
                      >
                        {effectiveStatus === 'partially_returned' ? 'Part Return' : effectiveStatus}
                      </Badge>
                      {effectiveStatus === 'partial' && balanceDue > 0.01 && (
                        <span
                          className="text-[9px] font-mono font-bold text-brand-crimson bg-brand-crimson-subtle border border-brand-crimson-border rounded px-1 py-0.2 whitespace-nowrap shadow-2xs"
                          title={`Remaining balance to be collected: ${formatCurrency(balanceDue)}`}
                        >
                          Due: {formatCurrency(balanceDue)}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* 6. Actions: Consistent 4-slot column aligned symmetrically */}
                  <TableCell className="align-middle text-center whitespace-nowrap px-2">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Slot 1: Collect (if due > 0) OR Return (if settled) OR Disabled Return (if already returned/void) */}
                      {(effectiveStatus === 'partial' || effectiveStatus === 'pending') && balanceDue > 0.01 ? (
                        <button
                          type="button"
                          onClick={() => setCollectingInvoice(inv)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer shadow-2xs transition-colors shrink-0"
                          title="Collect Pending / Partial Payment"
                          aria-label="Collect Payment"
                        >
                          <Coins size={14} className="shrink-0" />
                        </button>
                      ) : effectiveStatus === 'paid' ? (
                        <button
                          type="button"
                          onClick={() => setReturningInvoice(inv)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-danger hover:border-danger/40 hover:bg-danger/5 cursor-pointer shadow-2xs transition-colors shrink-0"
                          title="Process Item Return & Refund"
                          aria-label="Process Return"
                        >
                          <RotateCcw size={14} className="shrink-0" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/40 bg-surface text-muted/30 cursor-not-allowed shadow-none shrink-0"
                          title={
                            effectiveStatus === 'returned'
                              ? 'All items on this invoice have already been returned'
                              : 'Invoice is void / non-refundable'
                          }
                          aria-label="Non-refundable"
                        >
                          <RotateCcw size={14} className="shrink-0" />
                        </button>
                      )}

                      {/* Slot 2: Official WhatsApp Reminder & Share (Highlight in Emerald when balance is due) */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(inv)}
                        className={cn(
                          'w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer shadow-2xs transition-all shrink-0',
                          balanceDue > 0.01
                            ? 'border border-emerald-500/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-600'
                            : 'border border-border bg-surface text-muted hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/60'
                        )}
                        title={
                          balanceDue > 0.01
                            ? `Send WhatsApp Payment Reminder to ${inv.customer_name || 'Client'} (Due: ${formatCurrency(balanceDue)})`
                            : `Send Invoice Receipt via WhatsApp to ${inv.customer_name || 'Client'}`
                        }
                        aria-label="WhatsApp Payment Reminder"
                      >
                        <WhatsAppIcon
                          size={14}
                          className={cn(
                            'shrink-0',
                            balanceDue > 0.01 ? 'text-emerald-700' : 'text-current'
                          )}
                        />
                      </button>

                      {/* Slot 3: Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingInvoiceId(inv.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-muted hover:border-brand-sage hover:text-brand-sage hover:bg-brand-sage-subtle cursor-pointer shadow-2xs transition-colors shrink-0"
                        title="Edit Customer, Line Items, & Payment Status"
                        aria-label="Edit Invoice"
                      >
                        <Pencil size={14} className="shrink-0" />
                      </button>

                      {/* Slot 4: Print Button */}
                      <button
                        type="button"
                        onClick={() => setViewingInvoiceId(inv.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-text hover:bg-surface-subtle cursor-pointer shadow-2xs transition-colors shrink-0"
                        title="View / Print Tax Invoice"
                        aria-label="Print Invoice"
                      >
                        <Printer size={14} className="shrink-0" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* 5. Edit Invoice Modal */}
      {editingInvoiceId && (
        <EditInvoiceModal
          isOpen={Boolean(editingInvoiceId)}
          onClose={() => setEditingInvoiceId(null)}
          invoiceId={editingInvoiceId}
        />
      )}

      {/* 6. Invoice Print & Preview Modal */}
      {activeViewingInvoiceId && (
        <InvoicePrintModal
          isOpen={Boolean(activeViewingInvoiceId)}
          onClose={handleClosePrintModal}
          invoiceDetail={viewingInvoiceDetail}
        />
      )}

      {/* 7. Collect Pending / Partial Payment Modal */}
      {collectingInvoice && (
        <CollectPaymentModal
          isOpen={Boolean(collectingInvoice)}
          onClose={() => setCollectingInvoice(null)}
          invoice={collectingInvoice}
        />
      )}

      {/* 8. Process Product Return & Refund Modal */}
      {returningInvoice && (
        <ReturnProductModal
          isOpen={Boolean(returningInvoice)}
          onClose={() => setReturningInvoice(null)}
          invoice={returningInvoice}
        />
      )}
    </div>
  );
}
