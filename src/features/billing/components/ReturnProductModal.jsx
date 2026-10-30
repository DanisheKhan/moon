import { useState, useMemo } from 'react';
import { Button, Input, Modal, Badge, Select } from '@/shared/ui';
import { useProcessReturn } from '../hooks/useBilling';
import { formatCurrency } from '@/shared/lib/format';
import { getErrorMessage } from '@/shared/lib/errors';
import { cn } from '@/shared/lib/cn';
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Banknote,
  QrCode,
  CreditCard,
  Building,
} from 'lucide-react';

const RETURN_REASONS = [
  'Customer Exchange / Return',
  'Defective / Hardware Issue',
  'Wrong Item Supplied',
  'Order Cancellation / Handover Failure',
  'Packaging Damaged',
];

const RETURN_REASON_OPTIONS = RETURN_REASONS.map((r) => ({ value: r, label: r }));

const REFUND_METHODS = [
  { id: 'cash', label: 'Cash Refund', icon: Banknote },
  { id: 'upi', label: 'UPI Instant Refund', icon: QrCode },
  { id: 'card', label: 'Card Reversal', icon: CreditCard },
  { id: 'store_credit', label: 'Store Credit / Ledger', icon: Building },
];

export function ReturnProductModal({ isOpen, onClose, invoice }) {
  if (!isOpen || !invoice) return null;

  return <ReturnProductForm invoice={invoice} onClose={onClose} />;
}

function ReturnProductForm({ invoice, onClose }) {
  const processReturnMutation = useProcessReturn();
  const orderItems = useMemo(() => invoice.order_items || [], [invoice.order_items]);

  // State for which items are selected to return and their return quantity
  const [selectedItems, setSelectedItems] = useState(() => {
    const init = {};
    orderItems.forEach((it) => {
      init[it.id] = {
        selected: false,
        returnQty: 1,
        restock: true,
        condition: 'good',
      };
    });
    return init;
  });

  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [refundMethod, setRefundMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Toggle selection
  function handleToggleItem(itemId) {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
      },
    }));
  }

  // Update return quantity for non-serialized items
  function handleUpdateQty(itemId, val, maxQty) {
    const qty = Math.max(1, Math.min(parseInt(val, 10) || 1, maxQty));
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        returnQty: qty,
      },
    }));
  }

  // Update restock option
  function handleUpdateRestock(itemId, restock) {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        restock,
        condition: restock ? 'good' : 'defective',
      },
    }));
  }

  // Compute total refund amount dynamically
  const { totalRefundAmount, selectedCount, itemsToSubmit } = useMemo(() => {
    let sum = 0;
    let count = 0;
    const items = [];

    orderItems.forEach((it) => {
      const state = selectedItems[it.id];
      if (state?.selected) {
        count += 1;
        const returnQty = it.unit_id ? 1 : state.returnQty;
        const unitRate = parseFloat(it.unit_price) || 0;
        const unitDisc = parseFloat(it.discount) || 0;
        const taxable = Math.max(unitRate - unitDisc, 0) * returnQty;
        const gstRate = parseFloat(it.gst_rate) || 18;
        const itemRefund = Math.round(taxable * (1 + gstRate / 100));

        sum += itemRefund;
        items.push({
          order_item_id: it.id,
          product_id: it.product_id,
          unit_id: it.unit_id || null,
          quantity: returnQty,
          refund_amount: itemRefund,
          restock: state.restock,
          condition: state.condition,
        });
      }
    });

    return { totalRefundAmount: sum, selectedCount: count, itemsToSubmit: items };
  }, [orderItems, selectedItems]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');

    if (itemsToSubmit.length === 0) {
      setErrorMessage('Please select at least one product item to return.');
      return;
    }

    try {
      const result = await processReturnMutation.mutateAsync({
        invoiceId: invoice.id,
        items: itemsToSubmit,
        refundAmount: totalRefundAmount,
        refundMethod,
        reason: returnReason,
        notes: notes.trim() || null,
      });

      setSuccessInfo(result);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <RotateCcw size={16} className="text-brand-sage" />
          <span>Process Return & Refund — {invoice.invoice_number}</span>
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice & Customer Header Ribbon */}
        <div className="p-3.5 rounded-xl border border-border bg-surface-subtle text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <span className="font-bold text-text text-sm sm:text-base">
                {invoice.customer_name || 'Walk-in Customer'}
              </span>
              {invoice.customer_phone && (
                <span className="text-muted ml-1.5 font-mono text-xs">({invoice.customer_phone})</span>
              )}
            </div>
            <span className="text-[11px] font-mono font-semibold text-muted uppercase tracking-wider self-start sm:self-auto">
              {invoice.stores?.name || 'Store'}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs text-muted font-mono">
            <span>Invoice #{invoice.invoice_number}</span>
            <span>•</span>
            <span>
              Grand Total: <strong className="text-text">{formatCurrency(invoice.grand_total || 0)}</strong>
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successInfo && (
          <div className="p-3 rounded-lg border border-brand-sage/30 bg-brand-sage/10 text-brand-sage text-xs flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>
              Return <strong>{successInfo.return_number}</strong> processed! Refund of{' '}
              <strong>{formatCurrency(totalRefundAmount)}</strong> issued.
            </span>
          </div>
        )}

        {/* Line Items Selection List */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text flex items-center justify-between">
            <span>Select Items Being Returned</span>
            <span className="text-[11px] text-muted font-medium lowercase tracking-normal">
              {selectedCount} of {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'} selected
            </span>
          </label>

          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface max-h-60 overflow-y-auto">
            {orderItems.map((it) => {
              const state = selectedItems[it.id] || {};
              const isSelected = state.selected;
              const unitPrice = parseFloat(it.unit_price) || 0;
              const gstRate = parseFloat(it.gst_rate) || 18;
              const lineTotal = it.total_amount || Math.round(unitPrice * it.quantity * (1 + gstRate / 100));

              return (
                <div
                  key={it.id}
                  className={cn(
                    'p-3.5 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    isSelected ? 'bg-surface-subtle' : 'hover:bg-surface-subtle/50'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      id={`item-${it.id}`}
                      checked={Boolean(isSelected)}
                      onChange={() => handleToggleItem(it.id)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-brand-sage focus:ring-brand-sage cursor-pointer"
                    />
                    <label htmlFor={`item-${it.id}`} className="cursor-pointer min-w-0">
                      <div className="font-semibold text-text text-xs sm:text-sm">{it.item_name}</div>
                      <div className="text-[11px] text-muted font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span>Purchased: {it.quantity} {it.quantity === 1 ? 'unit' : 'units'}</span>
                        {it.serial_number && (
                          <>
                            <span>•</span>
                            <span className="text-brand-sage font-medium">S/N: {it.serial_number}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-bold text-text">{formatCurrency(lineTotal)}</span>
                      </div>
                    </label>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      {!it.unit_id && it.quantity > 1 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted font-medium">Return Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max={it.quantity}
                            value={state.returnQty || 1}
                            onChange={(e) => handleUpdateQty(it.id, e.target.value, it.quantity)}
                            className="w-14 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-mono font-semibold text-center"
                          />
                        </div>
                      )}

                      <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateRestock(it.id, true)}
                          className={cn(
                            'px-2.5 py-1 rounded-md cursor-pointer font-semibold transition-colors',
                            state.restock ? 'bg-text text-bg' : 'text-muted hover:text-text'
                          )}
                        >
                          Restock
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateRestock(it.id, false)}
                          className={cn(
                            'px-2.5 py-1 rounded-md cursor-pointer font-semibold transition-colors',
                            !state.restock ? 'bg-danger text-white' : 'text-muted hover:text-text'
                          )}
                        >
                          Defective
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Return Details: Reason & Notes balanced side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="return-reason"
            label="Return Reason"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            options={RETURN_REASON_OPTIONS}
          />
          <Input
            id="return-notes"
            label="Inspector Remarks / Serial Note"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Unit tested, screen intact, charger missing"
          />
        </div>

        {/* Refund Method Selector (Full Width 4-Card Ribbon) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text block">
            Refund Disbursement Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {REFUND_METHODS.map((m) => {
              const Icon = m.icon;
              const isSelected = refundMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRefundMethod(m.id)}
                  className={cn(
                    'p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer select-none',
                    isSelected
                      ? 'bg-text text-bg border-text shadow-2xs'
                      : 'border-border bg-surface text-muted hover:text-text hover:bg-surface-subtle'
                  )}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Total Refund Banner */}
        <div className="p-4 rounded-xl border border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase font-bold text-muted tracking-wider block">
              TOTAL REFUND PAYABLE
            </span>
            <div
              className={cn(
                'text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mt-0.5',
                totalRefundAmount > 0 ? 'text-danger' : 'text-text'
              )}
            >
              {formatCurrency(totalRefundAmount)}
            </div>
            <span className="text-xs text-muted block mt-0.5">
              Calculated from original invoice tax rates
            </span>
          </div>

          <Badge
            variant={totalRefundAmount > 0 ? 'danger' : 'default'}
            className="text-xs font-semibold py-1 px-3 self-start sm:self-auto"
          >
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} returning
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processReturnMutation.isPending}
            className="text-xs font-semibold rounded-lg px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={processReturnMutation.isPending || totalRefundAmount <= 0}
            pending={processReturnMutation.isPending}
            className="text-xs font-semibold rounded-lg gap-1.5 shadow-2xs px-4 cursor-pointer bg-danger hover:bg-danger/90 text-white disabled:opacity-50"
          >
            <RotateCcw size={14} />
            <span>Process Return & Refund ({formatCurrency(totalRefundAmount)})</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
