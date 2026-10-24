import { useState } from 'react';
import { Modal, Button, Input, Select, Badge } from '@/shared/ui';
import { useAdjustStock } from '../hooks/useInventory';
import { getErrorMessage } from '@/shared/lib/errors';
import { Sliders } from 'lucide-react';

function StockAdjustmentForm({ product, storeId, onClose }) {
  const adjustMutation = useAdjustStock();
  const currentQty = product?.inventory?.[0]?.quantity_on_hand ?? 0;

  const [newQty, setNewQty] = useState(String(currentQty));
  const [reason, setReason] = useState('restock');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  async function handleAdjustSubmit(e) {
    e.preventDefault();
    const parsedQty = parseInt(newQty, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      setError('Please provide a valid non-negative stock quantity.');
      return;
    }

    setError('');
    try {
      await adjustMutation.mutateAsync({
        storeId,
        productId: product.id,
        previousQuantity: currentQty,
        newQuantity: parsedQty,
        reason,
        notes: notes.trim() || `Adjusted from ${currentQty} to ${parsedQty}`,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleAdjustSubmit} className="space-y-5 text-text min-w-0">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger font-medium">
          {error}
        </div>
      )}

      {/* Structured Product Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-bg/60">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1">
            Current Stock on Hand
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-medium text-text">{currentQty}</span>
            <span className="text-xs text-muted">units</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1">
            Product SKU
          </span>
          <span className="font-mono text-xs font-medium text-text bg-surface px-2.5 py-1 rounded-lg border border-border inline-block">
            {product.sku}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1">
            Tracking Mode
          </span>
          <Badge variant="outline" className="text-xs">
            {product.is_serialized ? 'Serialized (Unique IMEI)' : 'Standard Batch'}
          </Badge>
        </div>
      </div>

      {/* Adjustment Form Inputs in 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="new-stock-qty"
          type="number"
          label="New Verified Quantity on Hand"
          placeholder="0"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          required
        />

        <Select
          id="adjust-reason"
          label="Reason for Adjustment"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={[
            { value: 'restock', label: 'New Stock Restock / Shipment Received' },
            { value: 'audit_reconcile', label: 'Physical Store Inventory Audit Count' },
            { value: 'damage', label: 'Damaged / Defective Stock Write-Off' },
            { value: 'theft', label: 'Missing / Lost Stock Write-Off' },
            { value: 'return', label: 'Customer RMA / Store Return' },
          ]}
        />
      </div>

      <Input
        id="adjust-notes"
        label="Adjustment Notes / Invoice Ref (Optional)"
        placeholder="e.g. Verified during physical audit count by store manager"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {/* Modal Actions */}
      <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="px-6 h-11 text-xs font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="solid"
          pending={adjustMutation.isPending}
          className="gap-2 px-6 h-11 text-xs font-medium"
        >
          <Sliders size={15} /> Update Stock Level
        </Button>
      </div>
    </form>
  );
}

export function StockAdjustmentModal({ product, storeId, isOpen, onClose }) {
  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Stock: ${product.name}`}
      size="lg"
    >
      <StockAdjustmentForm
        key={product.id}
        product={product}
        storeId={storeId}
        onClose={onClose}
      />
    </Modal>
  );
}
