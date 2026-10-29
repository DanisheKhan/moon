import { useState, useMemo } from 'react';
import { Button, Input, Modal, Badge } from '@/shared/ui';
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
        <div className="p-3 rounded-xl border border-border bg-surface-subtle text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="font-semibold text-text">{invoice.customer_name || 'Walk-in Customer'}</div>
            <div className="text-[11px] text-muted font-mono">
              Invoice #{invoice.invoice_number} • Total: {formatCurrency(invoice.grand_total || 0)}
            </div>
          </div>
          <Badge variant="outline" className="text-xs uppercase self-start sm:self-auto font-mono">
            {invoice.stores?.name || 'Store'}
          </Badge>
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
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text flex items-center justify-between">
            <span>Select Items Being Returned</span>
            <span className="text-[11px] text-muted font-normal">
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
                    'p-3 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    isSelected ? 'bg-surface-subtle' : 'hover:bg-surface-subtle/50'
                  )}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      id={`item-${it.id}`}
                      checked={Boolean(isSelected)}
                      onChange={() => handleToggleItem(it.id)}
                      className="mt-0.5 rounded border-border text-brand-sage focus:ring-brand-sage cursor-pointer"
                    />
                    <label htmlFor={`item-${it.id}`} className="cursor-pointer min-w-0">
                      <div className="font-semibold text-text">{it.item_name}</div>
                      <div className="text-[10px] text-muted font-mono flex items-center gap-1.5 mt-0.5">
                        <span>Purchased: {it.quantity} unit</span>
                        {it.serial_number && (
                          <>
                            <span>•</span>
                            <span className="text-brand-sage font-medium">S/N: {it.serial_number}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatCurrency(lineTotal)}</span>
                      </div>
                    </label>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      {!it.unit_id && it.quantity > 1 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted">Return Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max={it.quantity}
                            value={state.returnQty || 1}
                            onChange={(e) => handleUpdateQty(it.id, e.target.value, it.quantity)}
                            className="w-12 rounded border border-border bg-surface px-1.5 py-0.5 text-xs font-mono text-center"
                          />
                        </div>
                      )}

                      <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleUpdateRestock(it.id, true)}
                          className={cn(
                            'px-2 py-0.5 rounded cursor-pointer font-medium transition-colors',
                            state.restock ? 'bg-text text-bg font-bold' : 'text-muted'
                          )}
                        >
                          Restock
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateRestock(it.id, false)}
                          className={cn(
                            'px-2 py-0.5 rounded cursor-pointer font-medium transition-colors',
                            !state.restock ? 'bg-danger text-white font-bold' : 'text-muted'
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

        {/* Return Reason & Disposition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text block">Return Reason</label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-brand-sage"
            >
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text block">Refund Disbursement Method</label>
            <div className="grid grid-cols-2 gap-1.5">
              {REFUND_METHODS.map((m) => {
                const Icon = m.icon;
                const isSelected = refundMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRefundMethod(m.id)}
                    className={cn(
                      'p-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer truncate',
                      isSelected
                        ? 'bg-text text-bg border-text font-semibold shadow-2xs'
                        : 'border-border bg-surface text-muted hover:text-text'
                    )}
                  >
                    <Icon size={12} className="shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Remarks / Memo */}
        <div className="space-y-1">
          <Input
            id="return-notes"
            label="Inspector Remarks / Serial Inspection Note"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Unit tested, screen intact, charger missing"
          />
        </div>

        {/* Total Refund Banner */}
        <div className="p-4 rounded-xl border border-border bg-surface-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted tracking-wider block">
              TOTAL REFUND PAYABLE
            </span>
            <div className="text-2xl font-bold font-mono text-text">
              {formatCurrency(totalRefundAmount)}
            </div>
            <span className="text-[10px] text-muted block">
              Calculated from original invoice tax rates
            </span>
          </div>

          <Badge variant={totalRefundAmount > 0 ? 'success' : 'outline'} className="text-xs font-mono">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} returning
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processReturnMutation.isPending}
            className="text-xs rounded-lg cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={processReturnMutation.isPending || totalRefundAmount <= 0}
            pending={processReturnMutation.isPending}
            className="text-xs font-semibold rounded-lg gap-1.5 shadow-2xs cursor-pointer bg-danger hover:bg-danger/90 text-white"
          >
            <RotateCcw size={14} />
            <span>Process Return & Refund ({formatCurrency(totalRefundAmount)})</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
