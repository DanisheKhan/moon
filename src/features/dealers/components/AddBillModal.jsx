import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input } from '@/shared/ui';
import { useCreateDealerBill } from '../hooks/useDealers';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { FileText, Layers, Calendar, Receipt, Info } from 'lucide-react';

export function AddBillModal({
  isOpen,
  onClose,
  dealers = [],
  preselectedDealer = null,
  storeId,
}) {
  const createBillMutation = useCreateDealerBill();

  const [dealerId, setDealerId] = useState(preselectedDealer?.id || '');
  const [billType, setBillType] = useState('gst');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [creditDays, setCreditDays] = useState(30);
  const [totalAmount, setTotalAmount] = useState('');
  const [gstRate, setGstRate] = useState(18); // default 18% for electronics/appliances
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  // Tax Breakdown calculation for GST bills
  const taxBreakdown = useMemo(() => {
    const total = parseFloat(totalAmount || '0');
    if (billType === 'kaccha' || isNaN(total) || total <= 0) {
      return { taxable: total, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    }
    const rate = Number(gstRate) || 18;
    // Assuming total amount is inclusive of GST
    const taxable = total / (1 + rate / 100);
    const totalTax = total - taxable;
    const halfTax = totalTax / 2;
    return {
      taxable: Math.round(taxable * 100) / 100,
      cgst: Math.round(halfTax * 100) / 100,
      sgst: Math.round(halfTax * 100) / 100,
      igst: 0,
      totalTax: Math.round(totalTax * 100) / 100,
    };
  }, [totalAmount, billType, gstRate]);

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
        notes: notes.trim() || null,
      });

      // Clear & Close
      setBillNumber('');
      setTotalAmount('');
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
      className="max-w-xl"
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

        {/* Total Bill Amount */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Total Bill Payable Amount (₹) <span className="text-brand-crimson">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="e.g. 100000"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-base font-bold font-mono rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-brand-sage"
            />
          </div>
          {totalAmount && (
            <div className="mt-1 text-xs text-brand-sage font-medium">
              Payable: {formatCurrency(totalAmount)}
            </div>
          )}
        </div>

        {/* GST Tax Breakdown Preview (Only if GST bill) */}
        {billType === 'gst' && parseFloat(totalAmount) > 0 && (
          <div className="p-3 rounded-lg bg-brand-sage-subtle/40 border border-brand-sage-border/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-brand-sage-text">
              <span>Taxable Base Value:</span>
              <span className="font-mono">{formatCurrency(taxBreakdown.taxable)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>CGST (9%) + SGST (9%):</span>
              <span className="font-mono">
                {formatCurrency(taxBreakdown.cgst)} + {formatCurrency(taxBreakdown.sgst)} (Total: {formatCurrency(taxBreakdown.totalTax)})
              </span>
            </div>
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
            className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-sage text-white hover:bg-brand-sage-hover active:scale-[0.99] shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {createBillMutation.isPending ? 'Recording Bill...' : 'Save & Open in Khata'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
