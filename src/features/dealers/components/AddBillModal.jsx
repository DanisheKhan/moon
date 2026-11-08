import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/shared/ui';
import { useCreateDealerBill } from '../hooks/useDealers';
import { useProducts } from '@/features/inventory';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { FileText, Layers, Package, Plus, Trash2 } from 'lucide-react';

const createInitialItem = () => ({
  id: Date.now() + Math.random(),
  name: '',
  quantity: 1,
  gstRate: 18,
  unitPrice: '',
});

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
  const [taxJurisdiction, setTaxJurisdiction] = useState('intra'); // 'intra' (CGST+SGST) | 'inter' (IGST)
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Line items state - ON by default with at least 1 row ready
  const [items, setItems] = useState([createInitialItem()]);

  // Reset or initialize when modal opens or preselectedDealer changes
  useEffect(() => {
    if (isOpen) {
      setItems((prev) => (prev.length > 0 ? prev : [createInitialItem()]));
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
    }
  }, [isOpen, preselectedDealer, dealers]);

  // Compute Due Date dynamically
  const computedDueDate = useMemo(() => {
    if (!billDate) return '';
    const d = new Date(billDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + Number(creditDays || 0));
    return d.toISOString().split('T')[0];
  }, [billDate, creditDays]);

  // Compute base total of line items
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = Math.max(0, Number(item.quantity) || 0);
      const p = Math.max(0, Number(item.unitPrice) || 0);
      return sum + q * p;
    }, 0);
  }, [items]);

  // Compute tax total from line items
  const itemsTaxTotal = useMemo(() => {
    if (billType === 'kaccha') return 0;
    return items.reduce((sum, item) => {
      const q = Math.max(0, Number(item.quantity) || 0);
      const p = Math.max(0, Number(item.unitPrice) || 0);
      const rate = Number(item.gstRate ?? 18) || 0;
      return sum + q * p * (rate / 100);
    }, 0);
  }, [items, billType]);

  const totalUnitsCount = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Math.max(0, Number(item.quantity) || 0);
    }, 0);
  }, [items]);

  // Compute effective numeric GST rate across items
  const effectiveGstRate = useMemo(() => {
    if (billType === 'kaccha') return 0;
    if (itemsSubtotal > 0 && itemsTaxTotal >= 0) {
      return Math.round((itemsTaxTotal / itemsSubtotal) * 10000) / 100;
    }
    return 18;
  }, [billType, itemsSubtotal, itemsTaxTotal]);

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

  // Auto-sync total amount if total was empty or previously matching itemsSubtotal
  useEffect(() => {
    if (itemsSubtotal > 0 && (!totalAmount || totalAmount === '0')) {
      const defaultTotal =
        billType === 'gst'
          ? Math.round(itemsSubtotal + itemsTaxTotal)
          : itemsSubtotal;
      setTotalAmount(String(defaultTotal));
    }
  }, [itemsSubtotal, itemsTaxTotal, billType]);

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: '',
        quantity: 1,
        gstRate: 18,
        unitPrice: '',
      },
    ]);
  }

  function handleRemoveItem(id) {
    setItems((prev) => {
      const filtered = prev.filter((it) => it.id !== id);
      return filtered.length === 0 ? [createInitialItem()] : filtered;
    });
  }

  function handleItemChange(id, field, value) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        // If name changes, check if it matches a catalog product to auto-fill unitPrice and gstRate
        if (field === 'name') {
          const matched = storeProducts.find(
            (p) => p.name?.toLowerCase() === value?.trim().toLowerCase()
          );
          if (matched) {
            if (!updated.unitPrice || updated.unitPrice === '0') {
              updated.unitPrice = String(matched.cost_price || matched.selling_price || '');
            }
            if (matched.gst_rate != null) {
              updated.gstRate = Number(matched.gst_rate);
            }
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
      const withTax = Math.round(itemsSubtotal + itemsTaxTotal);
      setTotalAmount(String(withTax));
    }
  }

  function handleCloseModal() {
    setBillNumber('');
    setTotalAmount('');
    setItems([createInitialItem()]);
    setNotes('');
    setErrorMsg('');
    onClose();
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
        gst_rate: Number(it.gstRate ?? 18),
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
      handleCloseModal();
    } catch (err) {
      console.error('Failed to create bill:', err);
      setErrorMsg(err.message || 'Error recording dealer bill. Please verify bill details.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
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

        {/* Dealer Selection - Just the Supplier's Name */}
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
                {d.name || d.brand_name}
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

        {/* Bill Items / Products Section - Ordered: Item -> Qty -> GST -> Price -> Total */}
        <div className="pt-2 border-t border-border space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-brand-sage" />
              <div>
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Bill Items / Products
                </span>
                <span className="text-[10px] text-muted ml-1.5 font-normal hidden sm:inline">
                  (Itemize quantities, GST & rates)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Intra vs Inter-State Switch */}
              {billType === 'gst' && (
                <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-border text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTaxJurisdiction('intra')}
                    className={cn(
                      'px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer text-[10px]',
                      taxJurisdiction === 'intra'
                        ? 'bg-[#1B382B] text-white shadow-2xs'
                        : 'text-muted hover:text-text'
                    )}
                    title="Intra-State: CGST (50%) + SGST (50%)"
                  >
                    CGST+SGST
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxJurisdiction('inter')}
                    className={cn(
                      'px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer text-[10px]',
                      taxJurisdiction === 'inter'
                        ? 'bg-[#1B382B] text-white shadow-2xs'
                        : 'text-muted hover:text-text'
                    )}
                    title="Inter-State: IGST (100%)"
                  >
                    IGST
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#1B382B] text-white hover:bg-[#142d22] transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <Plus size={13} className="stroke-[2.5]" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Datalist for autocomplete suggestions from store inventory */}
          <datalist id="dealer-bill-product-suggestions">
            {storeProducts.map((p) => (
              <option key={p.id} value={p.name}>
                {p.sku ? `SKU: ${p.sku} • Cost: ₹${p.cost_price || 0}` : ''}
              </option>
            ))}
          </datalist>

          {/* Items Table - Combined layout: Item -> Qty -> GST -> Price -> Total */}
          <div className="space-y-2">
            <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
              <div className="bg-surface-subtle/80 px-3 py-1.5 border-b border-border text-[10px] uppercase font-bold text-muted grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">Item / Product Name</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-center">GST</div>
                <div className="col-span-2 text-right">Price (₹)</div>
                <div className="col-span-2 text-right pr-1">Total</div>
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
                      {/* 1. Item Name */}
                      <div className="col-span-5">
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

                      {/* 2. Quantity */}
                      <div className="col-span-1">
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
                          className="w-full px-1 py-1.5 text-xs text-center font-mono font-semibold rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
                        />
                      </div>

                      {/* 3. GST Dropdown */}
                      <div className="col-span-2">
                        {billType === 'gst' ? (
                          <select
                            value={it.gstRate ?? 18}
                            onChange={(e) =>
                              handleItemChange(it.id, 'gstRate', Number(e.target.value))
                            }
                            className="w-full px-1.5 py-1.5 text-xs text-center font-mono font-semibold rounded-md border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage cursor-pointer shadow-2xs"
                          >
                            <option value={18}>18% GST</option>
                            <option value={12}>12% GST</option>
                            <option value={5}>5% GST</option>
                            <option value={28}>28% GST</option>
                            <option value={0}>0% (Nil)</option>
                          </select>
                        ) : (
                          <div className="w-full py-1.5 text-center text-xs text-muted font-mono bg-surface-subtle rounded-md border border-border">
                            0%
                          </div>
                        )}
                      </div>

                      {/* 4. Price (Unit Rate ₹) */}
                      <div className="col-span-2">
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

                      {/* 5. Line Total & Remove button */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5 pr-1">
                        <span className="font-mono text-xs font-bold text-text truncate">
                          {formatCurrency(rowTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
                          title="Remove item row"
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
            <div className="p-2.5 rounded-lg bg-surface-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-[11px] text-muted flex items-center gap-2 flex-wrap">
                <span className="font-bold text-text">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
                <span>•</span>
                <span>{totalUnitsCount} units</span>
                <span>•</span>
                <span>
                  Base: <strong className="font-mono text-text">{formatCurrency(itemsSubtotal)}</strong>
                </span>
                {billType === 'gst' && itemsTaxTotal > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Tax: <strong className="font-mono text-text">{formatCurrency(Math.round(itemsTaxTotal))}</strong>
                    </span>
                  </>
                )}
              </div>

              {itemsSubtotal > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleApplyItemsTotal}
                    className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] font-medium text-text hover:border-brand-sage hover:bg-surface-subtle transition-all cursor-pointer shadow-2xs"
                    title="Set Total Bill Payable to base items sum"
                  >
                    Base: {formatCurrency(itemsSubtotal)}
                  </button>
                  {billType === 'gst' && (
                    <button
                      type="button"
                      onClick={handleApplyItemsWithGst}
                      className="px-2 py-0.5 rounded bg-surface border border-brand-sage-border/80 text-[11px] font-semibold text-brand-sage hover:bg-brand-sage-subtle transition-all cursor-pointer shadow-2xs"
                      title="Set Total Bill Payable to items sum + GST"
                    >
                      + GST ({formatCurrency(Math.round(itemsSubtotal + itemsTaxTotal))})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill Total Amount & Live Tax Summary */}
        <div className="p-3 rounded-xl border border-border bg-surface-subtle/40 space-y-2 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-semibold text-text">
                Total Bill Payable (₹) <span className="text-brand-crimson">*</span>
              </label>
              <span className="text-[11px] text-muted">
                Final invoice amount credited to supplier khata
              </span>
            </div>

            <div className="relative min-w-[160px]">
              <span className="absolute left-2.5 top-2 text-muted font-bold text-xs">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full pl-6 pr-2.5 py-1.5 text-sm font-bold font-mono rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage text-right shadow-2xs"
              />
            </div>
          </div>

          {/* Live GST Tax Breakdown Preview */}
          {billType === 'gst' && parseFloat(totalAmount) > 0 && (
            <div className="pt-2 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-muted text-[11px]">
                Taxable Base: <span className="font-mono font-semibold text-text">{formatCurrency(taxBreakdown.taxable)}</span>
              </div>

              <div className="text-[11px] font-mono text-muted flex items-center gap-2">
                {effectiveGstRate > 0 && taxJurisdiction === 'intra' && (
                  <>
                    <span>
                      CGST ({(effectiveGstRate / 2).toFixed(effectiveGstRate % 2 === 0 ? 0 : 1)}%):{' '}
                      <strong className="text-text">{formatCurrency(taxBreakdown.cgst)}</strong>
                    </span>
                    <span>+</span>
                    <span>
                      SGST ({(effectiveGstRate / 2).toFixed(effectiveGstRate % 2 === 0 ? 0 : 1)}%):{' '}
                      <strong className="text-text">{formatCurrency(taxBreakdown.sgst)}</strong>
                    </span>
                  </>
                )}

                {effectiveGstRate > 0 && taxJurisdiction === 'inter' && (
                  <span>
                    IGST ({effectiveGstRate}%): <strong className="text-text">{formatCurrency(taxBreakdown.igst)}</strong>
                  </span>
                )}

                {effectiveGstRate === 0 && (
                  <span className="text-brand-sage font-semibold">0% Nil-Rated</span>
                )}

                <span className="text-brand-sage font-semibold">
                  (Total Tax: {formatCurrency(taxBreakdown.totalTax)})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Consignment Remarks */}
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
            onClick={handleCloseModal}
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
