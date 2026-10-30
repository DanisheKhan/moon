import { useState } from 'react';
import { Modal, Button, Input, Select, Badge } from '@/shared/ui';
import {
  useAdjustStock,
  useProductUnits,
  useAddSerializedUnit,
  useRemoveSerializedUnit,
} from '../hooks/useInventory';
import { formatCurrency } from '@/shared/lib/format';
import { getErrorMessage } from '@/shared/lib/errors';
import { cn } from '@/shared/lib/cn';
import {
  Boxes,
  Plus,
  CheckCircle2,
  AlertCircle,
  Barcode,
  RotateCcw,
  PackageCheck,
  PackageX,
  Sliders,
} from 'lucide-react';

export function StockAdjustmentModal({ product, storeId, isOpen, onClose }) {
  if (!isOpen || !product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Stock: ${product.name}`}
      size="xl"
    >
      <StockAdjustmentForm
        key={product.id}
        product={product}
        storeId={storeId || product.store_id}
        onClose={onClose}
      />
    </Modal>
  );
}

export function StockAdjustmentForm({ product, storeId, onClose }) {
  const isSerialized = Boolean(product.is_serialized);
  const currentQty = product?.inventory?.[0]?.quantity_on_hand ?? 0;

  // Active tab for serialized items: 'serial_units' | 'quantity_override'
  const [activeTab, setActiveTab] = useState(isSerialized ? 'serial_units' : 'quantity');

  // Quantity adjustment state
  const [newQty, setNewQty] = useState(String(currentQty));
  const [addedQty, setAddedQty] = useState('0');
  const [reason, setReason] = useState('restock');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Serial unit creation state
  const [serialInput, setSerialInput] = useState('');
  const [conditionGrade, setConditionGrade] = useState('new');
  const [purchaseCost, setPurchaseCost] = useState(String(product.cost_price || 0));
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [serialNotes, setSerialNotes] = useState('');

  const adjustMutation = useAdjustStock();
  const addUnitMutation = useAddSerializedUnit();
  const removeUnitMutation = useRemoveSerializedUnit();

  // Load existing serialized units if serialized product
  const { data: units = [], refetch: refetchUnits } = useProductUnits(
    storeId,
    product.id,
    'in_stock',
    { enabled: isSerialized }
  );

  const parsedQty = parseInt(newQty, 10);
  const qtyDelta = isNaN(parsedQty) ? 0 : parsedQty - currentQty;

  // Handle typing directly in "Items to Add (Pieces / Units)"
  function handleAddedQtyChange(val) {
    setAddedQty(val);
    if (val === '' || val === '-') {
      setNewQty(String(currentQty));
      setError('');
      return;
    }
    const parsedAdd = parseInt(val, 10);
    if (!isNaN(parsedAdd)) {
      const target = Math.max(0, currentQty + parsedAdd);
      setNewQty(String(target));
      setError('');
    }
  }

  // Handle typing directly in "Resulting Total Stock on Hand"
  function handleNewQtyChange(val) {
    setNewQty(val);
    if (val === '') {
      setAddedQty('');
      setError('');
      return;
    }
    const parsedTotal = parseInt(val, 10);
    if (!isNaN(parsedTotal)) {
      const delta = parsedTotal - currentQty;
      setAddedQty(String(delta));
      setError('');
    }
  }

  // Quick increment helper (+1, +2, +5, +10, -1, etc.)
  function handleDeltaAdd(delta) {
    const currentAdded = parseInt(addedQty, 10) || 0;
    const nextAdded = currentAdded + delta;
    const targetTotal = Math.max(0, currentQty + nextAdded);
    const actualDelta = targetTotal - currentQty;
    setAddedQty(String(actualDelta));
    setNewQty(String(targetTotal));
    setError('');
  }

  // Reset to initial stock
  function handleReset() {
    setAddedQty('0');
    setNewQty(String(currentQty));
    setError('');
  }

  // Handle direct quantity update
  async function handleQuantitySubmit(e) {
    e.preventDefault();
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
        notes: notes.trim() || `Stock adjusted from ${currentQty} to ${parsedQty}`,
      });
      setSuccessMsg(`Stock updated successfully! New on-hand quantity is ${parsedQty} units.`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // Handle adding a new serialized unit
  async function handleAddUnitSubmit(e) {
    e.preventDefault();
    const cleanSerial = serialInput.trim().toUpperCase();
    if (!cleanSerial) {
      setError('Please enter or scan a valid Serial Number / IMEI.');
      return;
    }

    setError('');
    try {
      await addUnitMutation.mutateAsync({
        storeId,
        productId: product.id,
        serialNumber: cleanSerial,
        conditionGrade,
        purchaseCost: parseFloat(purchaseCost) || 0,
        warrantyMonths: parseInt(warrantyMonths, 10) || 12,
        notes: serialNotes.trim() || 'Unit restocked via inventory console',
      });
      setSerialInput('');
      setSerialNotes('');
      setSuccessMsg(`Serial unit "${cleanSerial}" added! Stock incremented (+1).`);
      refetchUnits();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // Handle marking a serial unit defective / remove
  async function handleRemoveUnit(unit) {
    if (!window.confirm(`Mark serial unit "${unit.serial_number}" as defective and remove from available stock?`)) {
      return;
    }

    try {
      await removeUnitMutation.mutateAsync({
        unitId: unit.id,
        storeId,
        productId: product.id,
        newStatus: 'defective',
        notes: 'Marked defective via inventory management',
      });
      refetchUnits();
      setSuccessMsg(`Unit "${unit.serial_number}" marked defective and deducted from available stock.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5 text-text min-w-0">
      {/* 1. Product Summary & Current Stock Banner */}
      <div className="p-4 rounded-xl border border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-lg border border-border bg-surface shrink-0 overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Boxes size={22} className="text-muted" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-text truncate">{product.name}</h4>
            <div className="text-[11px] font-mono text-muted flex items-center gap-2 mt-0.5">
              <span>SKU: {product.sku}</span>
              <span>• MRP: {formatCurrency(product.selling_price)}</span>
            </div>
          </div>
        </div>

        {/* Current Stock KPI */}
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 bg-surface px-4 py-2 rounded-xl border border-border shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted block">
              Current Stock on Hand
            </span>
            <div className="text-xl font-bold font-mono text-brand-sage flex items-baseline gap-1.5">
              <span>{currentQty}</span>
              <span className="text-xs font-normal text-muted">
                {currentQty === 1 ? 'unit' : 'units'}
              </span>
            </div>
          </div>
          <Badge variant={isSerialized ? 'default' : 'outline'} className="text-[10px] shrink-0 font-medium">
            {isSerialized ? 'Serialized (Unique IMEI/SN)' : 'Standard Batch'}
          </Badge>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-brand-sage-border bg-brand-sage-subtle p-3 text-xs text-brand-sage-text font-medium flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0 text-brand-sage" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Navigation Mode Tabs (If Serialized) */}
      {isSerialized && (
        <div className="flex border-b border-border text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('serial_units')}
            className={cn(
              'px-4 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2',
              activeTab === 'serial_units'
                ? 'border-text text-text font-semibold'
                : 'border-transparent text-muted hover:text-text'
            )}
          >
            <Barcode size={14} />
            <span>Manage Serial Numbers ({units.length} active)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quantity')}
            className={cn(
              'px-4 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2',
              activeTab === 'quantity'
                ? 'border-text text-text font-semibold'
                : 'border-transparent text-muted hover:text-text'
            )}
          >
            <Sliders size={14} />
            <span>Quick Quantity Adjustment</span>
          </button>
        </div>
      )}

      {/* 3A. Serialized Management Flow */}
      {isSerialized && activeTab === 'serial_units' && (
        <div className="space-y-5">
          {/* Add New Serial Unit Form */}
          <form onSubmit={handleAddUnitSubmit} className="p-4 rounded-xl border border-border bg-surface space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <PackageCheck size={16} className="text-brand-sage" />
                <span className="text-xs font-semibold text-text uppercase tracking-wider">
                  + Add New Serial Number / IMEI (+1 Stock)
                </span>
              </div>
              <span className="text-[11px] text-muted">
                Scan or type barcode from shipment box
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <Input
                  id="add-serial-input"
                  label="Serial Number / IMEI Code"
                  placeholder="e.g. SN-94829104 or 3591829..."
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <Select
                  id="add-serial-grade"
                  label="Condition Grade"
                  value={conditionGrade}
                  onChange={(e) => setConditionGrade(e.target.value)}
                  options={[
                    { value: 'new', label: 'Brand New (Sealed)' },
                    { value: 'A', label: 'Grade A (Open Box / Flawless)' },
                    { value: 'B', label: 'Grade B (Minor Wear)' },
                    { value: 'refurbished', label: 'Refurbished' },
                  ]}
                />
              </div>

              <div>
                <Select
                  id="add-serial-warranty"
                  label="Warranty Duration"
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(e.target.value)}
                  options={[
                    { value: '12', label: '12 Months (1 Year)' },
                    { value: '24', label: '24 Months (2 Years)' },
                    { value: '6', label: '6 Months' },
                    { value: '0', label: 'No Warranty' },
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="w-full sm:w-72">
                <Input
                  id="add-serial-cost"
                  label="Unit Purchase Cost (₹)"
                  type="number"
                  placeholder="0"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="solid"
                pending={addUnitMutation.isPending}
                className="gap-2 px-5 text-xs font-semibold self-end h-10 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Unit to Stock (+1)</span>
              </Button>
            </div>
          </form>

          {/* Active Registered Serial Units List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-text uppercase tracking-wider">
                In-Stock Serial Numbers ({units.length} Available)
              </span>
              <span className="text-[11px] text-muted">
                Available to select during POS counter billing
              </span>
            </div>

            {units.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-surface-subtle text-muted text-xs space-y-2">
                <AlertCircle size={28} className="mx-auto text-amber-500" />
                <p className="font-medium text-text">No active serial units registered</p>
                <p className="text-[11px] max-w-sm mx-auto">
                  Add the unit serial numbers using the form above to enable barcode/IMEI selection in POS.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
                <div className="max-h-56 overflow-y-auto divide-y divide-border/60">
                  {units.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-surface-subtle transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Barcode size={16} className="text-brand-sage shrink-0" />
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-text tracking-wide block truncate">
                            {u.serial_number}
                          </span>
                          <span className="text-[10px] text-muted block">
                            Grade: <strong className="uppercase">{u.condition_grade}</strong> • Warranty: {u.warranty_months}M
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="success" className="text-[10px]">
                          In Stock
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUnit(u)}
                          className="h-7 px-2 text-[11px] text-muted hover:text-danger hover:border-danger/30 rounded-lg cursor-pointer"
                          title="Mark unit defective and remove from stock"
                        >
                          <PackageX size={12} className="mr-1" />
                          <span>Defective</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3B. Standard Quantity Adjustment Flow */}
      {(!isSerialized || activeTab === 'quantity') && (
        <form onSubmit={handleQuantitySubmit} className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-surface space-y-4 shadow-2xs">
            {/* Quick Increment Buttons Ribbon */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-text uppercase tracking-wider block">
                Quick Restock Additions
              </span>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] text-muted mr-1">Add:</span>
                {[1, 2, 5, 10, 20, 50].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleDeltaAdd(inc)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface-subtle hover:bg-surface hover:border-brand-sage font-mono text-xs font-semibold text-text transition-all cursor-pointer shadow-2xs"
                  >
                    +{inc}
                  </button>
                ))}
                <span className="text-muted mx-1">|</span>
                <span className="text-[11px] text-muted mr-1">Deduct:</span>
                {[-1, -5].map((dec) => (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => handleDeltaAdd(dec)}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-surface-subtle hover:bg-danger/10 hover:border-danger/30 font-mono text-xs font-medium text-muted hover:text-danger transition-all cursor-pointer shadow-2xs"
                  >
                    {dec}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-muted hover:text-text cursor-pointer ml-auto flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Input & Live Delta Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start pt-2 border-t border-border">
              {/* Field 1: Quantity to Add / Pieces */}
              <div>
                <Input
                  id="items-to-add-qty"
                  type="number"
                  label="Quantity to Add / Restock (Pieces)"
                  placeholder="e.g. 5"
                  value={addedQty}
                  onChange={(e) => handleAddedQtyChange(e.target.value)}
                  className="text-lg font-mono font-bold text-brand-sage"
                />
                <span className="text-[11px] text-muted mt-1 block">
                  Items to add (e.g. 1, 2, 5, or 10 pieces)
                </span>
              </div>

              {/* Field 2: Resulting Total Stock on Hand */}
              <div>
                <Input
                  id="new-stock-qty"
                  type="number"
                  min="0"
                  label="Resulting Total Stock on Hand"
                  value={newQty}
                  onChange={(e) => handleNewQtyChange(e.target.value)}
                  required
                  className="text-lg font-mono font-bold"
                />
                <span className="text-[11px] text-muted mt-1 block">
                  Calculated total ({currentQty} on hand + added)
                </span>
              </div>

              {/* Field 3: Live Delta Calculation Box */}
              <div className="sm:col-span-2 lg:col-span-1 p-3 rounded-lg border border-border bg-surface-subtle space-y-1.5 self-stretch flex flex-col justify-center">
                <span className="text-[10px] uppercase font-semibold text-muted block tracking-wider">
                  Net Stock Calculation
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted font-mono">{currentQty} on hand</span>
                  <span className="text-xs text-muted">+</span>
                  <span className="text-xs font-semibold text-brand-sage font-mono">
                    {qtyDelta > 0 ? `${qtyDelta} added` : qtyDelta < 0 ? `${Math.abs(qtyDelta)} deducted` : '0 added'}
                  </span>
                  <span className="text-xs text-muted">=</span>
                  <span className="text-sm font-bold font-mono text-text">
                    {isNaN(parsedQty) ? '0' : parsedQty} total
                  </span>
                </div>
                <div>
                  {qtyDelta > 0 && (
                    <Badge variant="success" className="text-[10px] font-mono">
                      +{qtyDelta} new pieces added
                    </Badge>
                  )}
                  {qtyDelta < 0 && (
                    <Badge variant="danger" className="text-[10px] font-mono">
                      {qtyDelta} pieces deducted
                    </Badge>
                  )}
                  {qtyDelta === 0 && (
                    <Badge variant="outline" className="text-[10px] text-muted">
                      No change ({currentQty} on hand)
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Reason & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
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

              <Input
                id="adjust-notes"
                label="Adjustment Note / PO Ref (Optional)"
                placeholder="e.g. Supplier PO #4928 received"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-5 text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="solid"
              pending={adjustMutation.isPending}
              className="gap-2 px-6 text-xs font-semibold cursor-pointer"
            >
              <Boxes size={15} />
              <span>
                {qtyDelta > 0
                  ? `Confirm Stock Update (Add +${qtyDelta} pieces → ${isNaN(parsedQty) ? currentQty : parsedQty} total)`
                  : qtyDelta < 0
                  ? `Confirm Stock Update (Deduct ${Math.abs(qtyDelta)} pieces → ${isNaN(parsedQty) ? currentQty : parsedQty} total)`
                  : `Confirm Stock Update (${isNaN(parsedQty) ? currentQty : parsedQty} units on hand)`}
              </span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
