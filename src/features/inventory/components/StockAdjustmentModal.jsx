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
  Minus,
  CheckCircle2,
  AlertCircle,
  Barcode,
  RotateCcw,
  PackageCheck,
  PackageX,
  Sliders,
  TrendingUp,
  TrendingDown,
  ArrowRight,
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

  // Adjustment state:
  // Mode: 'add' (Restock) | 'deduct' (Write-Off) | 'exact' (Physical Audit)
  const [adjustMode, setAdjustMode] = useState('add');
  const [adjustmentValue, setAdjustmentValue] = useState('0');
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

  // Computed values based on mode
  const parsedValue = parseInt(adjustmentValue, 10);
  const safeValue = isNaN(parsedValue) ? 0 : parsedValue;

  let calculatedDelta = 0;
  let projectedQty = currentQty;

  if (adjustMode === 'add') {
    calculatedDelta = Math.max(0, safeValue);
    projectedQty = currentQty + calculatedDelta;
  } else if (adjustMode === 'deduct') {
    const deductAmount = Math.min(currentQty, Math.max(0, safeValue));
    calculatedDelta = -deductAmount;
    projectedQty = Math.max(0, currentQty - deductAmount);
  } else if (adjustMode === 'exact') {
    const exactTotal = isNaN(parsedValue) ? currentQty : Math.max(0, parsedValue);
    calculatedDelta = exactTotal - currentQty;
    projectedQty = exactTotal;
  }

  function handleModeChange(mode) {
    setAdjustMode(mode);
    setError('');
    if (mode === 'add') {
      setAdjustmentValue('0');
      setReason('restock');
    } else if (mode === 'deduct') {
      setAdjustmentValue(currentQty > 0 ? '1' : '0');
      setReason('damage');
    } else if (mode === 'exact') {
      setAdjustmentValue(String(currentQty));
      setReason('audit_reconcile');
    }
  }

  function handleDirectInputChange(val) {
    setError('');
    if (val === '') {
      setAdjustmentValue('');
      return;
    }
    const clean = parseInt(val, 10);
    if (!isNaN(clean)) {
      if (adjustMode === 'deduct') {
        setAdjustmentValue(String(Math.min(currentQty, Math.max(0, clean))));
      } else {
        setAdjustmentValue(String(Math.max(0, clean)));
      }
    }
  }

  function stepDelta(delta) {
    setError('');
    const cur = parseInt(adjustmentValue, 10) || 0;
    if (adjustMode === 'deduct') {
      setAdjustmentValue(String(Math.min(currentQty, Math.max(0, cur + delta))));
    } else {
      setAdjustmentValue(String(Math.max(0, cur + delta)));
    }
  }

  function handleQuickAdd(amount) {
    setError('');
    const cur = parseInt(adjustmentValue, 10) || 0;
    setAdjustmentValue(String(cur + amount));
  }

  function handleQuickDeduct(amount) {
    setError('');
    const cur = parseInt(adjustmentValue, 10) || 0;
    setAdjustmentValue(String(Math.min(currentQty, cur + amount)));
  }

  function handleReset() {
    setError('');
    if (adjustMode === 'exact') {
      setAdjustmentValue(String(currentQty));
    } else {
      setAdjustmentValue('0');
    }
  }

  // Handle direct quantity update
  async function handleQuantitySubmit(e) {
    e.preventDefault();
    if (isNaN(projectedQty) || projectedQty < 0) {
      setError('Please provide a valid non-negative stock quantity.');
      return;
    }

    setError('');
    try {
      await adjustMutation.mutateAsync({
        storeId,
        productId: product.id,
        previousQuantity: currentQty,
        newQuantity: projectedQty,
        reason,
        notes: notes.trim() || `Stock adjusted from ${currentQty} to ${projectedQty} via ${adjustMode} mode`,
      });
      setSuccessMsg(`Stock updated successfully! New on-hand quantity is ${projectedQty} units.`);
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
                  Add New Serial Number / IMEI (+1 Stock)
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

              <button
                type="submit"
                disabled={addUnitMutation.isPending}
                className="inline-flex items-center gap-2 px-5 text-xs font-semibold self-end h-10 rounded-lg cursor-pointer bg-[#1B382B] text-white hover:bg-[#142d22] active:scale-[0.99] shadow-2xs transition-all disabled:opacity-50"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span>{addUnitMutation.isPending ? 'Adding Unit...' : 'Add Unit to Stock (+1)'}</span>
              </button>
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

      {/* 3B. Refined Standard Quantity Adjustment Flow */}
      {(!isSerialized || activeTab === 'quantity') && (
        <form onSubmit={handleQuantitySubmit} className="space-y-4">
          {/* Action Mode Segmented Switch */}
          <div className="bg-surface-subtle p-1 rounded-xl border border-border flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleModeChange('add')}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none',
                adjustMode === 'add'
                  ? 'bg-surface text-text shadow-2xs border border-border'
                  : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent'
              )}
            >
              <TrendingUp size={14} className={adjustMode === 'add' ? 'text-brand-sage' : ''} />
              <span>Add Stock / Restock</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('deduct')}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none',
                adjustMode === 'deduct'
                  ? 'bg-surface text-text shadow-2xs border border-border'
                  : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent'
              )}
            >
              <TrendingDown size={14} className={adjustMode === 'deduct' ? 'text-danger' : ''} />
              <span>Deduct / Write-Off</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('exact')}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none',
                adjustMode === 'exact'
                  ? 'bg-surface text-text shadow-2xs border border-border'
                  : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent'
              )}
            >
              <Sliders size={14} className={adjustMode === 'exact' ? 'text-accent' : ''} />
              <span>Physical Audit Count</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface space-y-4 shadow-2xs">
            {/* Interactive Quantity Stepper & Quick Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text uppercase tracking-wider">
                  {adjustMode === 'add' && 'Quantity to Add / Restock (Pieces)'}
                  {adjustMode === 'deduct' && 'Quantity to Deduct / Write-Off (Pieces)'}
                  {adjustMode === 'exact' && 'Verified Physical Stock on Hand (Count)'}
                </label>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-medium text-muted hover:text-text flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw size={11} />
                  <span>Reset</span>
                </button>
              </div>

              {/* Stepper + Input */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepDelta(-1)}
                  className="w-10 h-10 rounded-lg border border-border bg-surface-subtle hover:bg-surface flex items-center justify-center text-text font-bold text-base cursor-pointer active:scale-95 transition-all shadow-2xs shrink-0"
                  title="Decrease by 1"
                >
                  <Minus size={16} />
                </button>

                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max={adjustMode === 'deduct' ? currentQty : undefined}
                    value={adjustmentValue}
                    onChange={(e) => handleDirectInputChange(e.target.value)}
                    className="w-full h-10 text-center font-mono text-lg font-bold rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-medium pointer-events-none">
                    units
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => stepDelta(1)}
                  className="w-10 h-10 rounded-lg border border-border bg-surface-subtle hover:bg-surface flex items-center justify-center text-text font-bold text-base cursor-pointer active:scale-95 transition-all shadow-2xs shrink-0"
                  title="Increase by 1"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Quick Presets */}
              {adjustMode === 'add' && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted mr-1">Quick Add:</span>
                  {[1, 2, 5, 10, 20, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleQuickAdd(num)}
                      className="px-2.5 py-1 rounded-md border border-border bg-surface-subtle hover:bg-surface hover:border-brand-sage font-mono text-[11px] font-semibold text-text transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              )}

              {adjustMode === 'deduct' && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted mr-1">Quick Deduct:</span>
                  {[1, 2, 5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleQuickDeduct(num)}
                      className="px-2.5 py-1 rounded-md border border-border bg-surface-subtle hover:bg-danger/10 hover:border-danger/30 font-mono text-[11px] font-semibold text-text hover:text-danger transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      -{num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Stock Balance Flow Preview */}
            <div className="p-3.5 rounded-xl border border-border bg-surface-subtle/70 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted tracking-wider">
                <span>Current Available</span>
                <span>Stock Adjustment</span>
                <span>New Total Balance</span>
              </div>

              <div className="flex items-center justify-between gap-2 text-center">
                {/* Current */}
                <div className="flex-1 p-2 rounded-lg bg-surface border border-border shadow-2xs">
                  <span className="text-base sm:text-lg font-mono font-bold text-muted block">
                    {currentQty}
                  </span>
                  <span className="text-[10px] text-muted">on hand</span>
                </div>

                <div className="text-muted text-xs font-bold px-1">
                  <ArrowRight size={14} className="mx-auto" />
                </div>

                {/* Delta */}
                <div className="flex-1 p-2 rounded-lg bg-surface border border-border shadow-2xs">
                  <span
                    className={cn(
                      'text-base sm:text-lg font-mono font-bold block',
                      calculatedDelta > 0
                        ? 'text-brand-sage'
                        : calculatedDelta < 0
                        ? 'text-danger'
                        : 'text-muted'
                    )}
                  >
                    {calculatedDelta > 0
                      ? `+${calculatedDelta}`
                      : calculatedDelta < 0
                      ? calculatedDelta
                      : '0'}
                  </span>
                  <span className="text-[10px] text-muted">
                    {calculatedDelta > 0 ? 'adding' : calculatedDelta < 0 ? 'deducting' : 'no change'}
                  </span>
                </div>

                <div className="text-muted text-xs font-bold px-1">
                  <ArrowRight size={14} className="mx-auto" />
                </div>

                {/* Resulting */}
                <div className="flex-1 p-2 rounded-lg bg-surface border border-border shadow-2xs">
                  <span className="text-base sm:text-lg font-mono font-bold text-text block">
                    {projectedQty}
                  </span>
                  <span className="text-[10px] font-medium text-brand-sage">new balance</span>
                </div>
              </div>

              {/* Dynamic Status Pill */}
              <div className="pt-1 flex items-center justify-between text-xs">
                {calculatedDelta > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-brand-sage font-medium text-[11px]">
                    <CheckCircle2 size={13} className="shrink-0" />
                    Warehouse inventory will increase from {currentQty} to {projectedQty} units (+{calculatedDelta}).
                  </span>
                )}
                {calculatedDelta < 0 && (
                  <span className="inline-flex items-center gap-1.5 text-danger font-medium text-[11px]">
                    <AlertCircle size={13} className="shrink-0" />
                    Warehouse inventory will decrease from {currentQty} to {projectedQty} units ({calculatedDelta}).
                  </span>
                )}
                {calculatedDelta === 0 && (
                  <span className="inline-flex items-center gap-1.5 text-muted font-medium text-[11px]">
                    No change in stock. Current inventory remains {currentQty} units.
                  </span>
                )}
              </div>
            </div>

            {/* Reason & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border">
              <Select
                id="adjust-reason"
                label="Reason for Adjustment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                options={[
                  { value: 'restock', label: 'Shipment Received / Restock' },
                  { value: 'audit_reconcile', label: 'Physical Store Inventory Audit Count' },
                  { value: 'damage', label: 'Damaged / Defective Stock Write-Off' },
                  { value: 'theft', label: 'Missing / Lost Stock Write-Off' },
                  { value: 'return', label: 'Customer RMA / Store Return' },
                ]}
              />

              <Input
                id="adjust-notes"
                label="Adjustment Note / PO Ref (Optional)"
                placeholder="e.g. Supplier PO #4928, Batch #102..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-surface text-text hover:bg-surface-subtle transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustMutation.isPending || (calculatedDelta === 0 && adjustMode !== 'exact')}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-[#1B382B] text-white hover:bg-[#142d22] active:scale-[0.99] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Boxes size={14} className="stroke-[2.5]" />
              <span>
                {adjustMutation.isPending
                  ? 'Updating Stock...'
                  : calculatedDelta > 0
                  ? `Confirm Restock (+${calculatedDelta} → ${projectedQty} units)`
                  : calculatedDelta < 0
                  ? `Confirm Write-Off (${calculatedDelta} → ${projectedQty} units)`
                  : `Confirm Stock (${projectedQty} units)`}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
