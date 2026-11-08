import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/shared/ui';
import { useRecordDealerPayment, useDealerBills } from '../hooks/useDealers';
import { formatCurrency, formatDate, formatPhone } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import {
  CreditCard,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Coins,
} from 'lucide-react';

export function RecordPaymentModal({
  isOpen,
  onClose,
  dealers = [],
  preselectedDealer = null,
  preselectedBill = null,
  storeId,
}) {
  const recordPaymentMutation = useRecordDealerPayment();

  const isSpecificBill = Boolean(preselectedBill);

  const [dealerId, setDealerId] = useState(
    preselectedBill?.dealer_id || preselectedBill?.dealer?.id || preselectedDealer?.id || ''
  );
  const [billId, setBillId] = useState(preselectedBill?.id || '');
  const [paymentAmount, setPaymentAmount] = useState(
    preselectedBill?.balance_amount ? String(preselectedBill.balance_amount) : ''
  );
  const [paymentMode, setPaymentMode] = useState('bank_transfer');
  const [paymentChannel, setPaymentChannel] = useState(
    preselectedBill?.bill_type === 'kaccha' ? 'secondary_cash' : 'official_bank'
  );
  const [transactionRef, setTransactionRef] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch active pending bills for selected dealer (for general payments)
  const { data: bills = [] } = useDealerBills({
    dealerId: dealerId || undefined,
  });

  const unpaidBills = useMemo(() => {
    return bills.filter((b) => b.status !== 'paid' && Number(b.balance_amount) > 0);
  }, [bills]);

  const gstBills = useMemo(() => {
    return unpaidBills.filter((b) => b.bill_type === 'gst');
  }, [unpaidBills]);

  const kacchaBills = useMemo(() => {
    return unpaidBills.filter((b) => b.bill_type === 'kaccha');
  }, [unpaidBills]);

  const brandDirectDealers = useMemo(() => {
    return dealers.filter((d) => d.dealer_type === 'brand_direct');
  }, [dealers]);

  const otherDealers = useMemo(() => {
    return dealers.filter((d) => d.dealer_type !== 'brand_direct');
  }, [dealers]);

  // Sync props whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (preselectedBill) {
        setBillId(preselectedBill.id);
        setDealerId(
          preselectedBill.dealer_id || preselectedBill.dealer?.id || preselectedDealer?.id || ''
        );
        const bal = Number(preselectedBill.balance_amount || 0);
        setPaymentAmount(bal > 0 ? String(bal) : '');
        if (preselectedBill.bill_type === 'kaccha') {
          setPaymentChannel('secondary_cash');
        } else {
          setPaymentChannel('official_bank');
        }
      } else if (preselectedDealer) {
        setDealerId(preselectedDealer.id);
        setBillId('');
        setPaymentAmount('');
      } else if (dealers.length > 0 && !dealerId) {
        setDealerId(dealers[0].id);
        setBillId('');
        setPaymentAmount('');
      }
      setErrorMsg('');
    }
  }, [isOpen, preselectedBill, preselectedDealer, dealers]);

  const selectedBill = useMemo(() => {
    if (preselectedBill && (!billId || billId === preselectedBill.id)) {
      return preselectedBill;
    }
    return bills.find((b) => b.id === billId) || preselectedBill;
  }, [bills, billId, preselectedBill]);

  // When bill changes manually, sync channel
  useEffect(() => {
    if (selectedBill) {
      if (selectedBill.bill_type === 'kaccha') {
        setPaymentChannel('secondary_cash');
      } else {
        setPaymentChannel('official_bank');
      }
    }
  }, [selectedBill]);

  // Live Auto-Balance Calculation Preview
  const balancePreview = useMemo(() => {
    if (!selectedBill) return null;

    const totalBill = Number(selectedBill.total_amount || 0);
    const previouslyPaid = Number(selectedBill.paid_amount || 0);
    const currentOutstanding = Number(selectedBill.balance_amount || 0);

    const enteredPayment = parseFloat(paymentAmount || '0');
    const validPayment = isNaN(enteredPayment) ? 0 : enteredPayment;

    const newBalance = Math.max(0, currentOutstanding - validPayment);
    const newPaid = previouslyPaid + validPayment;

    let newStatus = 'unpaid';
    if (newPaid >= totalBill && totalBill > 0) {
      newStatus = 'paid';
    } else if (newPaid > 0) {
      newStatus = 'partially_paid';
    }

    return {
      totalBill,
      previouslyPaid,
      currentOutstanding,
      payment: validPayment,
      newBalance,
      newPaid,
      newStatus,
      isOverpaying: validPayment > currentOutstanding + 0.01,
    };
  }, [selectedBill, paymentAmount]);

  function handleCloseModal() {
    setPaymentAmount('');
    setTransactionRef('');
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

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        dealer_id: dealerId,
        bill_id: billId || null,
        store_id: storeId || null,
        amount: amountNum,
        payment_date: paymentDate,
        payment_mode: paymentMode,
        payment_channel: paymentChannel,
        transaction_ref: transactionRef.trim() || null,
        cheque_date: chequeDate || null,
        notes: notes.trim() || null,
      });

      handleCloseModal();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setErrorMsg(err.message || 'Error recording payment. Please check details.');
    }
  }

  const modalTitle = isSpecificBill && selectedBill
    ? `Pay Bill — #${selectedBill.bill_number}`
    : 'Record Supplier Payment';

  const enteredAmountNum = parseFloat(paymentAmount) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={modalTitle}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-brand-crimson-subtle border border-brand-crimson-border text-xs text-brand-crimson font-medium">
            {errorMsg}
          </div>
        )}

        {/* 1. If paying a specific bill: show clean Bill Overview Card (NO redundant dropdowns!) */}
        {isSpecificBill && selectedBill ? (
          <div className="p-3.5 rounded-xl border border-border bg-surface-subtle text-xs space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-brand-sage shrink-0" />
                <div>
                  <span className="font-bold text-text text-sm">
                    {selectedBill.dealer?.name ||
                      selectedBill.dealer?.brand_name ||
                      preselectedDealer?.name ||
                      preselectedDealer?.brand_name}
                  </span>
                  {(selectedBill.dealer?.phone || preselectedDealer?.phone) && (
                    <span className="text-muted text-xs ml-1.5 font-mono">
                      ({formatPhone(selectedBill.dealer?.phone || preselectedDealer?.phone)})
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  selectedBill.bill_type === 'gst'
                    ? 'bg-brand-sage-subtle text-brand-sage border-brand-sage-border'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {selectedBill.bill_type === 'gst' ? 'GST Invoice' : 'Kaccha Slip'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/70 text-center">
              <div className="p-2 rounded-lg bg-surface border border-border">
                <span className="text-[10px] uppercase font-bold text-muted block mb-0.5">
                  Bill Total
                </span>
                <span className="font-mono text-sm font-bold text-text">
                  {formatCurrency(balancePreview?.totalBill || selectedBill.total_amount || 0)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-surface border border-brand-sage-border/60">
                <span className="text-[10px] uppercase font-bold text-brand-sage block mb-0.5">
                  Paid So Far
                </span>
                <span className="font-mono text-sm font-bold text-brand-sage">
                  {formatCurrency(balancePreview?.previouslyPaid || selectedBill.paid_amount || 0)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-surface border border-amber-300">
                <span className="text-[10px] uppercase font-bold text-amber-800 block mb-0.5">
                  Outstanding Due
                </span>
                <span className="font-mono text-sm font-bold text-brand-crimson">
                  {formatCurrency(balancePreview?.currentOutstanding || selectedBill.balance_amount || 0)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* 2. Generic payment: show clean Supplier & Bill selection dropdowns */
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Supplier / Brand Dealer <span className="text-brand-crimson">*</span>
              </label>
              <select
                value={dealerId}
                onChange={(e) => {
                  setDealerId(e.target.value);
                  setBillId('');
                  setPaymentAmount('');
                }}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text font-medium focus:outline-none focus:ring-1 focus:ring-brand-sage"
              >
                <option value="">-- Choose Brand / Dealer --</option>
                {brandDirectDealers.length > 0 && (
                  <optgroup label="Direct OEM Brands">
                    {brandDirectDealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || d.brand_name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherDealers.length > 0 && (
                  <optgroup label="Distributors & Wholesalers">
                    {otherDealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || d.brand_name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {brandDirectDealers.length === 0 && otherDealers.length === 0 && dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.brand_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Purchase Bill Selection - Unified, Clean Card Container */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-text flex items-center gap-1.5">
                  <FileText size={14} className="text-brand-sage" />
                  <span>Select Bill to Settle</span>
                </label>
                <span className="text-[11px] text-muted font-medium">
                  {unpaidBills.length} open {unpaidBills.length === 1 ? 'bill' : 'bills'}
                </span>
              </div>

              <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-2xs">
                {/* General On-Account Option */}
                <div
                  onClick={() => setBillId('')}
                  className={cn(
                    'px-3.5 py-2.5 text-xs cursor-pointer transition-colors flex items-center justify-between border-b border-border',
                    billId === ''
                      ? 'bg-brand-sage-subtle/50 text-text font-medium'
                      : 'bg-surface hover:bg-surface-subtle text-muted hover:text-text'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all',
                        billId === ''
                          ? 'border-brand-sage bg-brand-sage text-white'
                          : 'border-border bg-surface'
                      )}
                    >
                      {billId === '' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-text">
                        General Lump-Sum / On-Account Payment
                      </div>
                      <div className="text-[11px] text-muted">
                        Unallocated payment credited to supplier khata ledger
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-border bg-surface-subtle text-muted shrink-0">
                    On-Account
                  </span>
                </div>

                {/* Subheader if bills exist */}
                {unpaidBills.length > 0 && (
                  <div className="bg-surface-subtle/80 px-3.5 py-1.5 border-b border-border text-[10px] uppercase font-bold text-muted flex items-center justify-between">
                    <span>Open Purchase Bills</span>
                    <span>Balance Due</span>
                  </div>
                )}

                {/* Bills Rows */}
                <div className="divide-y divide-border/60 max-h-52 overflow-y-auto">
                  {unpaidBills.map((b) => {
                    const isSelected = billId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setBillId(b.id);
                          setPaymentAmount(String(b.balance_amount || ''));
                        }}
                        className={cn(
                          'px-3.5 py-2.5 text-xs cursor-pointer transition-colors flex items-center justify-between',
                          isSelected
                            ? 'bg-brand-sage-subtle/50 text-text font-medium'
                            : 'bg-surface hover:bg-surface-subtle text-text'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all',
                              isSelected
                                ? 'border-brand-sage bg-brand-sage text-white'
                                : 'border-border bg-surface'
                            )}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-xs text-text">
                                #{b.bill_number}
                              </span>
                              <span
                                className={cn(
                                  'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0',
                                  b.bill_type === 'gst'
                                    ? 'bg-brand-sage-subtle text-brand-sage border-brand-sage-border'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                )}
                              >
                                {b.bill_type === 'gst' ? 'GST' : 'Kaccha'}
                              </span>
                              {b.bill_date && (
                                <span className="text-[11px] text-muted">
                                  • {formatDate(b.bill_date, false)}
                                </span>
                              )}
                            </div>

                            {b.items && Array.isArray(b.items) && b.items.length > 0 ? (
                              <div className="text-[11px] text-muted truncate">
                                {b.items
                                  .map((it) => `${it.name || it.description} (${it.quantity || 1})`)
                                  .join(', ')}
                              </div>
                            ) : b.notes ? (
                              <div className="text-[11px] text-muted truncate italic">
                                {b.notes}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <div className="font-mono font-bold text-xs text-brand-crimson">
                            Due: {formatCurrency(b.balance_amount)}
                          </div>
                          <div className="text-[10px] font-mono text-muted">
                            Total: {formatCurrency(b.total_amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {unpaidBills.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted">
                      All bills for this supplier are fully cleared.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-text">
              Amount to Pay (₹) <span className="text-brand-crimson">*</span>
            </label>
            {selectedBill && Number(selectedBill.balance_amount) > 0 && (
              <button
                type="button"
                onClick={() => setPaymentAmount(String(selectedBill.balance_amount))}
                className="text-[11px] font-semibold text-brand-sage hover:underline cursor-pointer"
              >
                Pay Full Balance ({formatCurrency(selectedBill.balance_amount)})
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-base font-bold font-mono rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-brand-sage"
            />
          </div>
        </div>

        {/* Live Dynamic Auto-Balance Calculation */}
        {balancePreview && (
          <div className="p-3 rounded-xl border border-border bg-surface-subtle/70 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-text">
              <span className="text-muted">Settlement Status:</span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  balancePreview.newStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {balancePreview.newStatus === 'paid'
                  ? 'Will Be Fully Settled'
                  : 'Will Be Partially Paid'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-muted">New Remaining Balance:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  balancePreview.newBalance === 0 ? 'text-emerald-600' : 'text-brand-crimson'
                }`}
              >
                {balancePreview.newBalance === 0
                  ? '₹0 (Cleared)'
                  : formatCurrency(balancePreview.newBalance)}
              </span>
            </div>

            {balancePreview.isOverpaying && (
              <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle size={12} /> Payment exceeds pending bill balance by{' '}
                {formatCurrency(balancePreview.payment - balancePreview.currentOutstanding)}.
              </div>
            )}
          </div>
        )}

        {/* Payment Mode & Channel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            >
              <option value="bank_transfer">NEFT / RTGS (Bank Transfer)</option>
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cheque">Bank Cheque</option>
              <option value="cash">Cash Settlement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Payout Channel (Isolation)
            </label>
            <select
              value={paymentChannel}
              onChange={(e) => setPaymentChannel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text font-medium focus:outline-none focus:ring-1 focus:ring-brand-sage"
            >
              <option value="official_bank">Official Bank Account (GST Compliant)</option>
              <option value="secondary_cash">Cash / Secondary Account (Kaccha Khata)</option>
            </select>
          </div>
        </div>

        {/* Transaction Reference & Payment Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              {paymentMode === 'cheque'
                ? 'Cheque Number'
                : paymentMode === 'cash'
                ? 'Voucher / Cash Memo No'
                : 'UTR / Transaction Reference'}
            </label>
            <input
              type="text"
              placeholder={
                paymentMode === 'cheque'
                  ? 'e.g. CHQ-991204'
                  : 'e.g. UTR-HDFC99881122'
              }
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Payment Date <span className="text-brand-crimson">*</span>
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Payment Notes / Remarks
          </label>
          <input
            type="text"
            placeholder="e.g. Paid via HDFC Current A/c - Tranche 1"
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
            disabled={recordPaymentMutation.isPending}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1B382B] text-white hover:bg-[#142d22] active:scale-[0.99] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {recordPaymentMutation.isPending
              ? 'Recording Payment...'
              : enteredAmountNum > 0
              ? `Confirm Payment (${formatCurrency(enteredAmountNum)})`
              : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
