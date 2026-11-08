import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input } from '@/shared/ui';
import { useCreateDealerBill } from '../hooks/useDealers';
import { useProducts } from '@/features/inventory';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { FileText, Layers, Calendar, Receipt, Info, Package, Plus, Trash2, Calculator, Percent } from 'lucide-react';

const GST_PRESETS = [
  { value: 18, label: '18% GST', desc: 'Electronics / Standard' },
  { value: 12, label: '12% GST', desc: 'Furniture & Decor' },
  { value: 5, label: '5% GST', desc: 'Hardware & Parts' },
  { value: 28, label: '28% GST', desc: 'ACs & Luxury' },
  { value: 0, label: '0% (Exempt)', desc: 'Nil-Rated' },
];

export function AddBillModal({
  isOpen,
  onClose,
  dealers = [],
  preselectedDealer = null,
  storeId,
}) {
  const createBillMutation = useCreateDealerBill();

  // Load store catalog products to support autocomplete suggestions
  const { data: storeProducts = [] } = useProducts(storeId, {});

  const [dealerId, setDealerId] = useState(preselectedDealer?.id || '');
  const [billType, setBillType] = useState('gst');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [creditDays, setCreditDays] = useState(30);
  const [totalAmount, setTotalAmount] = useState('');
  const [gstRate, setGstRate] = useState(18); // default 18%
  const [isCustomGst, setIsCustomGst] = useState(false);
  const [customGstRate, setCustomGstRate] = useState('');
  const [taxJurisdiction, setTaxJurisdiction] = useState('intra'); // 'intra' (CGST+SGST) | 'inter' (IGST)
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Line items state
  const [items, setItems] = useState([]);

  // Reset or initialize when modal opens or preselectedDealer changes
  useEffect(() => {
    if (preselectedDealer) {
      setDealerId(preselectedDealer.id);
      if (preselectedDealer.billing_mode === 'kaccha') {
        setBillType('kaccha');
      } else {
        setBillType('gst');
      }
      setCreditDays(preselectedDealer.default_credit_days || 30);
    } else if (dealers.length > 0 && !dealerId) {
      setDealerId(dealers[0].id);
    }
  }, [preselectedDealer, dealers, isOpen]);

  // Compute Due Date dynamically
  const computedDueDate = useMemo(() => {
    if (!billDate) return '';
    const d = new Date(billDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + Number(creditDays || 0));
    return d.toISOString().split('T')[0];
  }, [billDate, creditDays]);

  // Compute effective numeric GST rate
  const effectiveGstRate = useMemo(() => {
    if (isCustomGst) {
      const parsed = parseFloat(customGstRate);
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    }
    return Number(gstRate) || 0;
  }, [isCustomGst, customGstRate, gstRate]);

  // Tax Breakdown calculation for GST bills
  const taxBreakdown = useMemo(() => {
    const total = parseFloat(totalAmount || '0');
    if (billType === 'kaccha' || isNaN(total) || total <= 0 || effectiveGstRate <= 0) {
      return {
        taxable: total || 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        rate: effectiveGstRate,
      };
    }
    const rate = effectiveGstRate;
    // Assuming total amount is inclusive of GST
    const taxable = total / (1 + rate / 100);
    const totalTax = total - taxable;

    if (taxJurisdiction === 'inter') {
      return {
        taxable: Math.round(taxable * 100) / 100,
        cgst: 0,
        sgst: 0,
        igst: Math.round(totalTax * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        rate,
      };
    }

    const halfTax = totalTax / 2;
    return {
      taxable: Math.round(taxable * 100) / 100,
      cgst: Math.round(halfTax * 100) / 100,
      sgst: Math.round(halfTax * 100) / 100,
      igst: 0,
      totalTax: Math.round(totalTax * 100) / 100,
      rate,
    };
  }, [totalAmount, billType, effectiveGstRate, taxJurisdiction]);

  // Compute total of line items
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = Math.max(0, Number(item.quantity) || 0);
      const p = Math.max(0, Number(item.unitPrice) || 0);
      return sum + q * p;
    }, 0);
  }, [items]);

  const totalUnitsCount = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + (Math.max(0, Number(item.quantity) || 0));
    }, 0);
  }, [items]);

  // Auto-sync total amount if total was empty or previously matching itemsSubtotal
  useEffect(() => {
    if (itemsSubtotal > 0 && (!totalAmount || totalAmount === '0')) {
      setTotalAmount(String(itemsSubtotal));
    }
  }, [itemsSubtotal]);

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: '',
        quantity: 1,
        unitPrice: '',
      },
    ]);
  }

  function handleRemoveItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function handleItemChange(id, field, value) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        // If name changes, check if it matches a catalog product to auto-fill unitPrice
        if (field === 'name') {
          const matched = storeProducts.find(
            (p) => p.name?.toLowerCase() === value?.trim().toLowerCase()
          );
          if (matched && (!updated.unitPrice || updated.unitPrice === '0')) {
            updated.unitPrice = String(matched.cost_price || matched.selling_price || '');
          }
        }
        return updated;
      })
    );
  }

  function handleApplyItemsTotal() {
    if (itemsSubtotal > 0) {
      setTotalAmount(String(itemsSubtotal));
    }
  }

  function handleApplyItemsWithGst() {
    if (itemsSubtotal > 0) {
      const withTax = Math.round(itemsSubtotal * (1 + effectiveGstRate / 100));
      setTotalAmount(String(withTax));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!dealerId) {
      setErrorMsg('Please select a dealer.');
      return;
    }
    if (!billNumber.trim()) {
      setErrorMsg('Invoice / Bill or Parchi Number is required.');
      return;
    }
    const amountNum = parseFloat(totalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid bill total amount (greater than ₹0).');
      return;
    }

    // Filter valid items
    const validItems = items
      .filter((it) => it && it.name && it.name.trim())
      .map((it) => ({
        name: it.name.trim(),
        quantity: Math.max(1, Number(it.quantity) || 1),
        unit_price: Math.max(0, Number(it.unitPrice) || 0),
        total:
          Math.max(1, Number(it.quantity) || 1) *
          Math.max(0, Number(it.unitPrice) || 0),
      }));

    try {
      await createBillMutation.mutateAsync({
        dealer_id: dealerId,
        store_id: storeId || null,
        bill_type: billType,
        bill_number: billNumber.trim(),
        bill_date: billDate,
        credit_days: Number(creditDays),
        total_amount: amountNum,
        taxable_amount: taxBreakdown.taxable,
        cgst_amount: taxBreakdown.cgst,
        sgst_amount: taxBreakdown.sgst,
        igst_amount: taxBreakdown.igst,
        items: validItems,
        notes: notes.trim() || null,
      });

      // Clear & Close
      setBillNumber('');
      setTotalAmount('');
      setItems([]);
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Failed to create bill:', err);
      setErrorMsg(err.message || 'Error recording dealer bill. Please verify bill details.');
    }
  }

  const selectedDealerObj = dealers.find((d) => d.id === dealerId) || preselectedDealer;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Dealer Bill / Purchase Entry"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-brand-crimson-subtle border border-brand-crimson-border text-xs text-brand-crimson font-medium">
            {errorMsg}
          </div>
        )}

        {/* Bill Type Selector (GST vs Kaccha) */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">
            Bill Category (Two-Book Separation)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBillType('gst')}
              className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                billType === 'gst'
                  ? 'border-brand-sage bg-brand-sage-subtle/50 text-text ring-1 ring-brand-sage'
                  : 'border-border bg-surface text-muted hover:bg-surface-subtle'
              }`}
            >
              <FileText
                size={18}
                className={billType === 'gst' ? 'text-brand-sage' : 'text-muted'}
              />
              <div>
                <div className="text-xs font-bold">Tax Invoice (GST)</div>
                <div className="text-[11px] text-muted">
                  Official bill, ITC claim, GSTR-2B compliance
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBillType('kaccha')}
              className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                billType === 'kaccha'
                  ? 'border-amber-500 bg-amber-50/60 text-text ring-1 ring-amber-500'
                  : 'border-border bg-surface text-muted hover:bg-surface-subtle'
              }`}
            >
              <Layers
                size={18}
                className={billType === 'kaccha' ? 'text-amber-600' : 'text-muted'}
              />
              <div>
                <div className="text-xs font-bold text-amber-950">
                  Kaccha (Non-GST / Estimate)
                </div>
                <div className="text-[11px] text-muted">
                  Internal parchi, slip, cash wholesaler entry
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Dealer Selection */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Supplier / Brand Dealer <span className="text-brand-crimson">*</span>
          </label>
          <select
            value={dealerId}
            onChange={(e) => {
              const newId = e.target.value;
              setDealerId(newId);
              const found = dealers.find((d) => d.id === newId);
              if (found?.default_credit_days) {
                setCreditDays(found.default_credit_days);
              }
            }}
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text font-medium focus:outline-none focus:ring-1 focus:ring-brand-sage"
          >
            <option value="">-- Choose Brand / Dealer --</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.brand_name || d.name} ({d.name}) - Current Bal:{' '}
                {formatCurrency(d.metrics?.totalBalance || 0)}
              </option>
            ))}
          </select>
        </div>

        {/* Bill Number & Bill Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              {billType === 'gst' ? 'Invoice Number' : 'Parchi / Slip No'} <span className="text-brand-crimson">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={billType === 'gst' ? 'e.g. GODREJ/2026/089' : 'e.g. EST-PARCHI-402'}
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Bill Date <span className="text-brand-crimson">*</span>
            </label>
            <input
              type="date"
              required
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>
        </div>

        {/* Credit Days & Computed Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Credit Terms (Days)
            </label>
            <input
              type="number"
              min="0"
              max="180"
              value={creditDays}
              onChange={(e) => setCreditDays(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-surface-subtle border border-border text-xs flex items-center justify-between">
            <span className="text-muted text-[11px]">Computed Due Date:</span>
            <span className="font-bold text-text font-mono">
              {computedDueDate ? formatDate(computedDueDate, false) : '-'}
            </span>
          </div>
        </div>

        {/* Items Section */}
        <div className="pt-2 border-t border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-brand-sage" />
              <div>
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Bill Items / Products
                </span>
                <span className="text-[10px] text-muted ml-1.5 font-normal hidden sm:inline">
                  (Itemize quantities & rates)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-subtle hover:bg-surface border border-border text-text hover:border-brand-sage transition-all cursor-pointer shadow-2xs"
            >
              <Plus size={13} className="stroke-[2.5]" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Datalist for autocomplete suggestions from store inventory */}
          <datalist id="dealer-bill-product-suggestions">
            {storeProducts.map((p) => (
              <option key={p.id} value={p.name}>
                {p.sku ? `SKU: ${p.sku} • Cost: ₹${p.cost_price || 0}` : ''}
              </option>
            ))}
          </datalist>

          {items.length === 0 ? (
            <div className="p-3 text-center rounded-xl border border-dashed border-border bg-surface-subtle/50 text-xs text-muted flex items-center justify-between">
              <span className="text-[11px]">
                No items added yet. You can itemize products, quantities, and rates or enter total amount directly.
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-brand-sage hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-3"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Items Table */}
              <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
                <div className="bg-surface-subtle/80 px-3 py-1.5 border-b border-border text-[10px] uppercase font-bold text-muted grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 sm:col-span-6">Item / Product Name</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">Unit Rate (₹)</div>
                  <div className="col-span-2 sm:col-span-1 text-right">Total</div>
                </div>

                <div className="divide-y divide-border/60 max-h-56 overflow-y-auto">
                  {items.map((it) => {
                    const rowQty = Math.max(1, Number(it.quantity) || 1);
                    const rowRate = Math.max(0, Number(it.unitPrice) || 0);
                    const rowTotal = rowQty * rowRate;

                    return (
                      <div
                        key={it.id}
                        className="p-2 sm:px-3 sm:py-2 grid grid-cols-12 gap-2 items-center hover:bg-surface-subtle/40 transition-colors"
                      >
                        {/* Name input */}
                        <div className="col-span-5 sm:col-span-6">
                          <input
                            type="text"
                            list="dealer-bill-product-suggestions"
                            required
                            placeholder="Item name / model"
                            value={it.name}
                            onChange={(e) =>
                              handleItemChange(it.id, 'name', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage font-medium"
                          />
                        </div>

                        {/* Quantity input */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            placeholder="1"
                            value={it.quantity}
                            onChange={(e) =>
                              handleItemChange(it.id, 'quantity', e.target.value)
                            }
                            className="w-full px-1.5 py-1.5 text-xs text-center font-mono font-semibold rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
                          />
                        </div>

                        {/* Price input */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Rate ₹"
                            value={it.unitPrice}
                            onChange={(e) =>
                              handleItemChange(it.id, 'unitPrice', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-xs text-right font-mono font-medium rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
                          />
                        </div>

                        {/* Line Total & Remove button */}
                        <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-text truncate hidden sm:inline">
                            {formatCurrency(rowTotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                            title="Remove this item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items Summary Bar */}
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-border flex items-center justify-between text-xs">
                <div className="text-[11px] text-muted flex items-center gap-2">
                  <span className="font-bold text-text">{items.length} items</span>
                  <span>•</span>
                  <span>{totalUnitsCount} total units</span>
                  <span>•</span>
                  <span>
                    Items Sum: <strong className="font-mono text-text">{formatCurrency(itemsSubtotal)}</strong>
                  </span>
                </div>

                {itemsSubtotal > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleApplyItemsTotal}
                      className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] font-medium text-text hover:border-brand-sage hover:bg-surface-subtle transition-all cursor-pointer shadow-2xs"
                      title="Set Total Bill Payable to exact Items Subtotal"
                    >
                      Inclusive: {formatCurrency(itemsSubtotal)}
                    </button>
                    {billType === 'gst' && effectiveGstRate > 0 && (
                      <button
                        type="button"
                        onClick={handleApplyItemsWithGst}
                        className="px-2 py-0.5 rounded bg-surface border border-brand-sage-border/80 text-[11px] font-semibold text-brand-sage hover:bg-brand-sage-subtle transition-all cursor-pointer shadow-2xs"
                        title={`Add ${effectiveGstRate}% GST on top of items subtotal`}
                      >
                        + Add {effectiveGstRate}% GST ({formatCurrency(Math.round(itemsSubtotal * (1 + effectiveGstRate / 100)))})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* GST Configuration (Only if Tax Invoice) */}
        {billType === 'gst' && (
          <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-surface-subtle/70 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt size={15} className="text-brand-sage" />
                <div>
                  <span className="text-xs font-bold text-text uppercase tracking-wider">
                    GST Rate & Tax Jurisdiction
                  </span>
                  <span className="text-[10px] text-muted ml-1.5 font-normal">
                    (Choose rate or custom %)
                  </span>
                </div>
              </div>

              {/* Intra vs Inter-State Segmented Switch */}
              <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-border text-[11px] self-start sm:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTaxJurisdiction('intra')}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer',
                    taxJurisdiction === 'intra'
                      ? 'bg-accent text-accent-fg shadow-2xs'
                      : 'text-muted hover:text-text'
                  )}
                  title="CGST (50%) + SGST (50%) for intra-state supplier"
                >
                  Intra-State (CGST+SGST)
                </button>
                <button
                  type="button"
                  onClick={() => setTaxJurisdiction('inter')}
                  className={cn(
                    'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer',
                    taxJurisdiction === 'inter'
                      ? 'bg-accent text-accent-fg shadow-2xs'
                      : 'text-muted hover:text-text'
                  )}
                  title="IGST (100%) for interstate supplier"
                >
                  Inter-State (IGST)
                </button>
              </div>
            </div>

            {/* GST Rate Preset Slabs */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted block">
                Select Applicable GST Slab:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {GST_PRESETS.map((p) => {
                  const isSelected = !isCustomGst && gstRate === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        setIsCustomGst(false);
                        setGstRate(p.value);
                      }}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs',
                        isSelected
                          ? 'border-accent bg-accent text-accent-fg ring-1 ring-accent'
                          : 'border-border bg-surface text-text hover:bg-surface-subtle hover:border-border-strong'
                      )}
                    >
                      <span>{p.label}</span>
                      <span
                        className={cn(
                          'text-[10px] font-sans font-normal hidden md:inline',
                          isSelected ? 'text-accent-fg/80' : 'text-muted'
                        )}
                      >
                        ({p.desc})
                      </span>
                    </button>
                  );
                })}

                {/* Custom Rate Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomGst(true);
                    if (!customGstRate) setCustomGstRate('18');
                  }}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                    isCustomGst
                      ? 'border-accent bg-accent text-accent-fg ring-1 ring-accent font-bold'
                      : 'border-border bg-surface text-text hover:bg-surface-subtle'
                  )}
                >
                  Custom %
                </button>

                {/* Custom Rate Input when active */}
                {isCustomGst && (
                  <div className="flex items-center gap-1 pl-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      autoFocus
                      placeholder="e.g. 7.5"
                      value={customGstRate}
                      onChange={(e) => setCustomGstRate(e.target.value)}
                      className="w-20 px-2 py-1 text-xs font-mono font-bold text-center rounded-lg border border-accent bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <span className="text-xs font-bold text-text font-mono">%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live GST Tax Breakdown Preview */}
            {parseFloat(totalAmount) > 0 && (
              <div className="p-3 rounded-lg bg-surface border border-border/80 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between font-semibold text-text">
                  <span className="text-muted">Taxable Base Value:</span>
                  <span className="font-mono">{formatCurrency(taxBreakdown.taxable)}</span>
                </div>

                {effectiveGstRate > 0 && taxJurisdiction === 'intra' && (
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>
                      CGST ({(effectiveGstRate / 2).toFixed(effectiveGstRate % 2 === 0 ? 0 : 1)}%) + SGST ({(effectiveGstRate / 2).toFixed(effectiveGstRate % 2 === 0 ? 0 : 1)}%):
                    </span>
                    <span className="font-mono text-text">
                      {formatCurrency(taxBreakdown.cgst)} + {formatCurrency(taxBreakdown.sgst)} (Total: {formatCurrency(taxBreakdown.totalTax)})
                    </span>
                  </div>
                )}

                {effectiveGstRate > 0 && taxJurisdiction === 'inter' && (
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>IGST ({effectiveGstRate}%):</span>
                    <span className="font-mono text-text">
                      {formatCurrency(taxBreakdown.igst)}
                    </span>
                  </div>
                )}

                {effectiveGstRate === 0 && (
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>GST Rate:</span>
                    <span className="font-semibold text-brand-sage">0% (Nil-Rated / Tax Exempt)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Consignment Remarks / Invoice Notes
          </label>
          <input
            type="text"
            placeholder="e.g. 15 ACs, 10 Refrigerators stock intake"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-surface text-text hover:bg-surface-subtle transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createBillMutation.isPending}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1B382B] text-white hover:bg-[#142d22] active:scale-[0.99] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {createBillMutation.isPending ? 'Recording Bill...' : 'Save & Open in Khata'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
