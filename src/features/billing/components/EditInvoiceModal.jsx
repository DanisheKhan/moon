import { useState, useMemo } from 'react';
import { Modal, Button, Input, Badge } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import { useInvoiceDetail, useUpdateInvoice } from '../hooks/useBilling';
import {
  Pencil,
  Trash2,
  Plus,
  Save,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  CreditCard,
  User,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid (Settled)', badge: 'success' },
  { value: 'pending', label: 'Pending (Unpaid)', badge: 'amber' },
  { value: 'void', label: 'Void / Cancelled', badge: 'danger' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Store Cash Register' },
  { value: 'upi', label: 'UPI / QR Instant Transfer' },
  { value: 'card', label: 'Debit & Credit Card (POS)' },
  { value: 'emi', label: 'Consumer Financing / EMI' },
];

function EditInvoiceForm({ invoiceDetail, invoiceId, onClose }) {
  const updateInvoiceMutation = useUpdateInvoice();
  const primaryPayment = invoiceDetail.payments?.[0];

  // Initialize state directly from loaded invoiceDetail
  const [customerName, setCustomerName] = useState(invoiceDetail.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(invoiceDetail.customer_phone || '');
  const [customerGstin, setCustomerGstin] = useState(invoiceDetail.customer_gstin || '');
  const [status, setStatus] = useState(invoiceDetail.status || 'paid');
  const [paymentMethod, setPaymentMethod] = useState(
    (primaryPayment?.payment_method || 'cash').toLowerCase()
  );
  const [paymentReference, setPaymentReference] = useState(primaryPayment?.reference_number || '');
  const [paymentId] = useState(primaryPayment?.id || null);

  // Line items state
  const [items, setItems] = useState(() =>
    (invoiceDetail.items || []).map((it) => ({
      id: it.id,
      product_id: it.product_id,
      unit_id: it.unit_id,
      item_name: it.item_name || '',
      serial_number: it.serial_number || '',
      quantity: Number(it.quantity || 1),
      unit_price: Number(it.unit_price || 0),
      discount: Number(it.discount || 0),
      gst_rate: Number(it.gst_rate ?? 18),
    }))
  );
  const [removedItemIds, setRemovedItemIds] = useState([]);

  // New item draft state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemGstRate, setNewItemGstRate] = useState(18);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle line item field changes
  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  // Remove a line item
  function handleRemoveItem(index) {
    const itemToRemove = items[index];
    if (items.length <= 1) {
      setErrorMessage(
        'An invoice must have at least one billable item. To cancel the bill, change status to Void.'
      );
      return;
    }
    if (itemToRemove.id && !String(itemToRemove.id).startsWith('temp-')) {
      setRemovedItemIds((prev) => [...prev, itemToRemove.id]);
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setErrorMessage('');
  }

  // Add a new line item
  function handleAddLineItem() {
    if (!newItemName.trim()) {
      setErrorMessage('Please enter an item name.');
      return;
    }
    const priceNum = parseFloat(newItemPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Please enter a valid unit selling price.');
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        item_name: newItemName.trim(),
        serial_number: '',
        quantity: Math.max(1, parseInt(newItemQty, 10) || 1),
        unit_price: priceNum,
        discount: 0,
        gst_rate: Number(newItemGstRate) || 18,
      },
    ]);

    setNewItemName('');
    setNewItemPrice('');
    setNewItemQty(1);
    setIsAddingItem(false);
    setErrorMessage('');
  }

  // Live recalculate financial totals
  const financialTotals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => {
      const net = Math.max(Number(it.unit_price || 0) - Number(it.discount || 0), 0);
      return acc + net * Number(it.quantity || 1);
    }, 0);

    const totalTax = items.reduce((acc, it) => {
      const net = Math.max(Number(it.unit_price || 0) - Number(it.discount || 0), 0);
      const taxable = net * Number(it.quantity || 1);
      const rate = Number(it.gst_rate ?? 18);
      return acc + taxable * (rate / 100);
    }, 0);

    const cgst = Math.round((totalTax / 2) * 100) / 100;
    const sgst = Math.round((totalTax / 2) * 100) / 100;
    const grandTotal = Math.round(subtotal + totalTax);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      cgst,
      sgst,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal,
    };
  }, [items]);

  // Submit invoice changes
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (items.length === 0) {
      setErrorMessage('The invoice must contain at least one item.');
      return;
    }

    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId,
        updates: {
          customer_name: customerName.trim() || 'Walk-in Customer',
          customer_phone: customerPhone.trim() || null,
          customer_gstin: customerGstin.trim().toUpperCase() || null,
          status,
          subtotal: financialTotals.subtotal,
          cgst_amount: financialTotals.cgst,
          sgst_amount: financialTotals.sgst,
          grand_total: financialTotals.grandTotal,
          removedItemIds,
        },
        items,
        payment: {
          id: paymentId,
          payment_method: paymentMethod,
          reference_number: paymentReference.trim() || null,
        },
      });

      setSuccessMessage('Bill and financial ledger updated successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to update invoice. Please check the inputs.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs flex items-center gap-2.5">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text text-xs flex items-center gap-2.5">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Section 1: Customer & GST Information */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2.5 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
          <User size={13} className="text-text" />
          <span>Customer & GST Details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="edit-customer-name"
            label="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
          />

          <Input
            id="edit-customer-phone"
            label="Mobile Number (WhatsApp)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="e.g. 9820012345"
          />

          <Input
            id="edit-customer-gstin"
            label="GSTIN (Optional B2B)"
            value={customerGstin}
            onChange={(e) => setCustomerGstin(e.target.value)}
            placeholder="e.g. 27ABCDE1234F1Z5"
            maxLength={15}
            className="font-mono uppercase"
          />
        </div>
      </div>

      {/* Section 2: Bill Status & Payment Details */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 pb-2.5 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
          <CreditCard size={13} className="text-text" />
          <span>Settlement & Invoice Status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Invoice Status */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-medium text-text uppercase tracking-wider">
              Invoice Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full min-h-10 rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-text focus:outline-brand-sage cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-medium text-text uppercase tracking-wider">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full min-h-10 rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-text focus:outline-brand-sage cursor-pointer"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Number */}
          <Input
            id="edit-payment-ref"
            label="Transaction / UTR Reference"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder={paymentMethod === 'cash' ? 'Optional cash drawer remark' : 'e.g. UPI Ref / Bank Auth'}
          />
        </div>

        {status === 'void' && (
          <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>
              Voiding this bill will remove its revenue and tax values from all financial reports and dashboards.
            </span>
          </div>
        )}
      </div>

      {/* Section 3: Line Items (Editable) */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-border">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Receipt size={13} className="text-text" />
            <span>Line Items in Bill ({items.length})</span>
          </div>

          {!isAddingItem && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingItem(true)}
              className="text-xs gap-1.5 font-medium rounded-lg h-7 px-2.5"
            >
              <Plus size={13} />
              <span>Add Line Item</span>
            </Button>
          )}
        </div>

        {/* Inline Add Item Form */}
        {isAddingItem && (
          <div className="p-3 rounded-lg border border-brand-sage-border bg-surface-subtle space-y-3">
            <div className="text-xs font-semibold text-text flex items-center justify-between">
              <span>Add New Product to Invoice</span>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-xs text-muted hover:text-text cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              <div className="sm:col-span-2">
                <Input
                  id="new-item-name"
                  label="Item / Product Name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. USB-C Cable"
                  required
                />
              </div>
              <div>
                <Input
                  id="new-item-price"
                  label="Unit Price (₹)"
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="e.g. 1499"
                  required
                />
              </div>
              <div>
                <Input
                  id="new-item-qty"
                  label="Quantity"
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-medium text-text uppercase tracking-wider">
                  GST Rate
                </label>
                <select
                  value={newItemGstRate}
                  onChange={(e) => setNewItemGstRate(Number(e.target.value))}
                  className="w-full min-h-10 rounded-lg border border-border bg-surface px-2 py-2 text-xs text-text focus:outline-brand-sage cursor-pointer"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                onClick={handleAddLineItem}
                className="text-xs font-medium rounded-lg gap-1.5"
              >
                <Plus size={13} /> Insert Item
              </Button>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-border">
            <thead>
              <tr className="text-[10px] uppercase font-semibold text-muted bg-surface-subtle">
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 w-24">Qty</th>
                <th className="py-2.5 px-3 w-32">Unit Price (₹)</th>
                <th className="py-2.5 px-3 w-28">Discount (₹)</th>
                <th className="py-2.5 px-3 w-24">GST %</th>
                <th className="py-2.5 px-3 text-right w-28">Total (₹)</th>
                <th className="py-2.5 px-2 text-right w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((it, idx) => {
                const netRate = Math.max(Number(it.unit_price || 0) - Number(it.discount || 0), 0);
                const taxable = netRate * Number(it.quantity || 1);
                const itemTotal = Math.round(taxable * (1 + Number(it.gst_rate ?? 18) / 100));

                return (
                  <tr key={it.id || idx} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-2.5 px-3 min-w-44">
                      <input
                        type="text"
                        value={it.item_name}
                        onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs font-medium text-text focus:outline-brand-sage"
                        placeholder="Item Name"
                        required
                      />
                      {it.serial_number && (
                        <div className="text-[10px] text-muted font-mono mt-1">
                          Serial: {it.serial_number}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'quantity',
                            Math.max(1, parseInt(e.target.value, 10) || 1)
                          )
                        }
                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs font-mono text-text focus:outline-brand-sage text-center"
                        required
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.unit_price}
                        onChange={(e) =>
                          handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs font-mono text-text focus:outline-brand-sage text-right"
                        required
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.discount}
                        onChange={(e) =>
                          handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)
                        }
                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs font-mono text-text focus:outline-brand-sage text-right"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <select
                        value={it.gst_rate}
                        onChange={(e) => handleItemChange(idx, 'gst_rate', Number(e.target.value))}
                        className="w-full rounded border border-border bg-surface px-1 py-1 text-xs font-mono text-text focus:outline-brand-sage text-center cursor-pointer"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-text whitespace-nowrap">
                      {formatCurrency(itemTotal)}
                    </td>

                    <td className="py-2.5 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        title="Remove this item"
                        className="p-1 text-muted hover:text-danger rounded hover:bg-danger/10 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Live Recalculated Ledger Summary */}
      <div className="rounded-xl border border-border bg-surface-subtle p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1 text-xs text-muted">
          <div>
            Subtotal (Taxable):{' '}
            <strong className="text-text font-mono">
              {formatCurrency(financialTotals.subtotal)}
            </strong>
          </div>
          <div>
            CGST (Central Tax):{' '}
            <strong className="text-text font-mono">
              {formatCurrency(financialTotals.cgst)}
            </strong>
          </div>
          <div>
            SGST (State Tax):{' '}
            <strong className="text-text font-mono">
              {formatCurrency(financialTotals.sgst)}
            </strong>
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-6">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
            Adjusted Grand Total
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-text">
            {formatCurrency(financialTotals.grandTotal)}
          </div>
          <span className="text-[10px] text-brand-sage font-medium">
            Live database synchronization
          </span>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={updateInvoiceMutation.isPending}
          className="text-xs font-medium rounded-lg"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={updateInvoiceMutation.isPending}
          pending={updateInvoiceMutation.isPending}
          className="text-xs font-medium rounded-lg gap-2"
        >
          <Save size={14} />
          <span>Save Changes</span>
        </Button>
      </div>
    </form>
  );
}

export function EditInvoiceModal({ isOpen, onClose, invoiceId }) {
  const { data: invoiceDetail, isLoading: isDetailLoading } = useInvoiceDetail(invoiceId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        invoiceDetail ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-text shrink-0">
              <Pencil size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-semibold text-text">
                  Edit Bill: {invoiceDetail.invoice_number}
                </span>
                <Badge
                  variant={
                    invoiceDetail.status === 'paid'
                      ? 'success'
                      : invoiceDetail.status === 'pending'
                      ? 'amber'
                      : 'danger'
                  }
                  className="text-[10px] uppercase font-semibold"
                >
                  {invoiceDetail.status}
                </Badge>
              </div>
              <p className="text-[11px] text-muted font-normal mt-0.5">
                {invoiceDetail.stores?.name} • Atomic financial adjustments
              </p>
            </div>
          </div>
        ) : (
          'Edit Bill'
        )
      }
      size="2xl"
    >
      {isDetailLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted">Retrieving bill and item records...</p>
        </div>
      ) : !invoiceDetail ? (
        <div className="py-12 text-center text-xs text-muted">
          Could not load the invoice details.
        </div>
      ) : (
        <EditInvoiceForm
          key={invoiceDetail.id}
          invoiceDetail={invoiceDetail}
          invoiceId={invoiceId}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
