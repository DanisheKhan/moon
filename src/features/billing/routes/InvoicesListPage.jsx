import { useState, useMemo } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
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
import { useAllInvoices, useInvoiceDetail, useVoidInvoice } from '../hooks/useBilling';
import { useStores } from '@/features/stores';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { EditInvoiceModal } from '../components/EditInvoiceModal';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  Receipt,
  Search,
  Filter,
  Pencil,
  Printer,
  Ban,
  Clock,
  Building2,
  Calendar,
} from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
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
  const [dateFilter, setDateFilter] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);

  // Stores
  const { data: stores = [] } = useStores();

  // Invoices Query
  const { data: invoices = [], isLoading } = useAllInvoices({
    storeId: storeFilter,
    status: statusFilter,
    dateRange: dateFilter,
    search: searchQuery,
  });

  const { data: viewingInvoiceDetail } = useInvoiceDetail(viewingInvoiceId);
  const voidInvoiceMutation = useVoidInvoice();

  // Summary Metrics
  const metrics = useMemo(() => {
    const validInvoices = invoices.filter((i) => i.status !== 'void');
    const totalSales = validInvoices.reduce((acc, i) => acc + (parseFloat(i.grand_total) || 0), 0);
    const paidCount = invoices.filter((i) => i.status === 'paid').length;
    const pendingCount = invoices.filter((i) => i.status === 'pending').length;
    const voidCount = invoices.filter((i) => i.status === 'void').length;

    return {
      count: invoices.length,
      validCount: validInvoices.length,
      totalSales,
      paidCount,
      pendingCount,
      voidCount,
    };
  }, [invoices]);

  // Handle quick voiding
  async function handleQuickVoid(inv) {
    if (inv.status === 'void') return;
    const confirmVoid = window.confirm(
      `Are you sure you want to void invoice ${inv.invoice_number}? This will cancel its revenue and GST contribution in financial telemetry.`
    );
    if (!confirmVoid) return;

    try {
      await voidInvoiceMutation.mutateAsync(inv.id);
    } catch (err) {
      alert(`Failed to void invoice: ${err?.message || 'Error occurred'}`);
    }
  }

  return (
    <div className="space-y-6 min-w-0 pb-12">
      {/* 1. Page Header & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              SALES & GST REGISTERS
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-brand-sage font-medium">
              <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse shrink-0" />
              Live Database Synced
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text">
            All Bills & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Inspect, search, view GST receipts, and directly edit customer information, line items, and payment status.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted block truncate">
            TOTAL BILLED VALUE
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text truncate">
            {formatCurrency(metrics.totalSales)}
          </div>
          <span className="text-[11px] text-muted block truncate">
            Across {metrics.validCount} valid bills
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted block truncate">
            PAID INVOICES
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-brand-sage truncate">
            {metrics.paidCount}
          </div>
          <span className="text-[11px] text-muted block truncate">
            Fully settled receipts
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted block truncate">
            PENDING INVOICES
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 truncate">
            {metrics.pendingCount}
          </div>
          <span className="text-[11px] text-muted block truncate">
            Awaiting counter payment
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-1 min-w-0">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted block truncate">
            VOID / CANCELLED
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-muted truncate">
            {metrics.voidCount}
          </div>
          <span className="text-[11px] text-muted block truncate">
            Nullified in ledger
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
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
          <Table>
            <TableHead>
              <TableRow className="bg-surface-subtle">
                <TableHeaderCell>Invoice Details</TableHeaderCell>
                <TableHeaderCell>Store Branch</TableHeaderCell>
                <TableHeaderCell>Customer</TableHeaderCell>
                <TableHeaderCell>Items Summary</TableHeaderCell>
                <TableHeaderCell>Payment Mode</TableHeaderCell>
                <TableHeaderCell>Grand Total</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => {
                const primaryPay = inv.payments?.[0];
                const itemsCount = inv.order_items?.length || 0;
                const itemsPreview = (inv.order_items || [])
                  .slice(0, 2)
                  .map((it) => `${it.item_name} (${it.quantity})`)
                  .join(', ');

                return (
                  <TableRow key={inv.id} className="hover:bg-surface-subtle/50 transition-colors">
                    {/* Invoice # & Date */}
                    <TableCell className="whitespace-nowrap">
                      <div className="font-mono text-xs font-semibold text-text">
                        {inv.invoice_number}
                      </div>
                      <div className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        <span>{inv.created_at ? formatDate(inv.created_at) : '—'}</span>
                      </div>
                    </TableCell>

                    {/* Store Branch */}
                    <TableCell className="whitespace-nowrap">
                      <div className="text-xs font-medium text-text">
                        {inv.stores?.name || 'Star Store'}
                      </div>
                      <div className="text-[10px] text-muted font-mono">
                        {inv.stores?.code || '—'}
                      </div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="font-medium text-xs text-text truncate max-w-44" title={inv.customer_name}>
                        {inv.customer_name || 'Walk-in Customer'}
                      </div>
                      {inv.customer_phone && (
                        <div className="text-[10px] text-muted font-mono truncate max-w-44">
                          {inv.customer_phone}
                        </div>
                      )}
                      {inv.customer_gstin && (
                        <div className="text-[9px] text-brand-sage font-mono uppercase truncate max-w-44">
                          GST: {inv.customer_gstin}
                        </div>
                      )}
                    </TableCell>

                    {/* Items Summary */}
                    <TableCell>
                      <div className="text-xs text-text truncate max-w-48" title={itemsPreview}>
                        {itemsCount > 0 ? itemsPreview : 'No items'}
                      </div>
                      {itemsCount > 2 && (
                        <div className="text-[10px] text-muted">
                          +{itemsCount - 2} more {itemsCount - 2 === 1 ? 'item' : 'items'}
                        </div>
                      )}
                    </TableCell>

                    {/* Payment Mode */}
                    <TableCell className="whitespace-nowrap">
                      {primaryPay ? (
                        <div>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0.2">
                            {primaryPay.payment_method}
                          </Badge>
                          {primaryPay.reference_number && (
                            <div className="text-[10px] text-muted font-mono truncate max-w-32 mt-0.5">
                              {primaryPay.reference_number}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Cash</span>
                      )}
                    </TableCell>

                    {/* Grand Total */}
                    <TableCell className="whitespace-nowrap font-mono">
                      <div className="font-semibold text-xs text-text">
                        {formatCurrency(inv.grand_total || 0)}
                      </div>
                      <div className="text-[10px] text-muted">
                        Tax: {formatCurrency((inv.cgst_amount || 0) + (inv.sgst_amount || 0))}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'amber' : 'danger'}
                        className="text-[10px] font-semibold uppercase"
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>

                    {/* Actions: Edit & View/Print */}
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="solid"
                          onClick={() => setEditingInvoiceId(inv.id)}
                          className="h-7 px-2.5 text-xs font-medium rounded-lg gap-1.5 cursor-pointer shadow-2xs"
                          title="Edit Customer, Line Items, & Payment Status"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </Button>

                        {/* View / Print Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingInvoiceId(inv.id)}
                          className="h-7 px-2 text-xs font-medium rounded-lg gap-1 text-muted hover:text-text cursor-pointer"
                          title="View / Print Tax Invoice"
                        >
                          <Printer size={13} />
                          <span className="hidden sm:inline">Print</span>
                        </Button>

                        {/* Quick Void Button */}
                        {inv.status !== 'void' && (
                          <button
                            type="button"
                            onClick={() => handleQuickVoid(inv)}
                            title="Void invoice"
                            className="p-1.5 text-muted hover:text-danger rounded-md hover:bg-danger/10 cursor-pointer transition-colors"
                          >
                            <Ban size={13} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
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
      {viewingInvoiceId && (
        <InvoicePrintModal
          isOpen={Boolean(viewingInvoiceId)}
          onClose={() => setViewingInvoiceId(null)}
          invoiceDetail={viewingInvoiceDetail}
        />
      )}
    </div>
  );
}
