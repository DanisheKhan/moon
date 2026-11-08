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
        <Table className="w-full min-w-180 table-fixed">
          <TableHead>
            <TableRow className="bg-surface-subtle">
              <TableHeaderCell className="w-[17%]">Date of Purchase</TableHeaderCell>
              <TableHeaderCell className="w-[18%]">Customer Name</TableHeaderCell>
              <TableHeaderCell className="w-[28%]">Item</TableHeaderCell>
              <TableHeaderCell className="w-[14%]">Grand Total</TableHeaderCell>
              <TableHeaderCell className="w-[10%] text-center px-1">Status</TableHeaderCell>
              <TableHeaderCell className="w-[13%] text-right pr-4">
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
                      <span className="truncate">{inv.created_at ? formatDate(inv.created_at) : '—'}</span>
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

                  {/* 6. Actions: Fixed 3-slot column for 100% vertical grid alignment */}
                  <TableCell className="align-middle text-right whitespace-nowrap pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Slot 1: Collect (if due > 0) OR Return (if settled) OR Empty Spacer */}
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
                        <div className="w-8 h-8 shrink-0" aria-hidden="true" />
                      )}

                      {/* Slot 2: Edit Button (Strictly in Column 2) */}
                      <button
                        type="button"
                        onClick={() => setEditingInvoiceId(inv.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-muted hover:border-brand-sage hover:text-brand-sage hover:bg-brand-sage-subtle cursor-pointer shadow-2xs transition-colors shrink-0"
                        title="Edit Customer, Line Items, & Payment Status"
                        aria-label="Edit Invoice"
                      >
                        <Pencil size={14} className="shrink-0" />
                      </button>

                      {/* Slot 3: Print Button (Strictly in Column 3) */}
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
