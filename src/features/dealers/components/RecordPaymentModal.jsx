import { useState, useEffect, useMemo } from 'react';
import { Modal, Button } from '@/shared/ui';
import { useRecordDealerPayment, useDealerBills } from '../hooks/useDealers';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  CreditCard,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Layers,
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

  const [dealerId, setDealerId] = useState(preselectedDealer?.id || '');
  const [billId, setBillId] = useState(preselectedBill?.id || '');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('bank_transfer');
  const [paymentChannel, setPaymentChannel] = useState('official_bank');
  const [transactionRef, setTransactionRef] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch active pending bills for selected dealer
  const { data: bills = [], isLoading: isLoadingBills } = useDealerBills({
    dealerId: dealerId || undefined,
  });

  const unpaidBills = useMemo(() => {
    return bills.filter((b) => b.status !== 'paid' && b.balance_amount > 0);
  }, [bills]);

  // Sync props when opening modal
  useEffect(() => {
    if (preselectedDealer) {
      setDealerId(preselectedDealer.id);
    } else if (dealers.length > 0 && !dealerId) {
      setDealerId(dealers[0].id);
    }

    if (preselectedBill) {
      setBillId(preselectedBill.id);
      setDealerId(preselectedBill.dealer_id);
      // Auto channel selection based on bill type
      if (preselectedBill.bill_type === 'kaccha') {
        setPaymentChannel('secondary_cash');
      } else {
        setPaymentChannel('official_bank');
      }
    }
  }, [preselectedDealer, preselectedBill, dealers, isOpen]);

  // When bill changes, sync payment channel
  const selectedBill = useMemo(() => {
    return bills.find((b) => b.id === billId) || preselectedBill;
  }, [bills, billId, preselectedBill]);

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
      isOverpaying: validPayment > currentOutstanding,
    };
  }, [selectedBill, paymentAmount]);

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

      // Clear & Close
      setPaymentAmount('');
      setTransactionRef('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setErrorMsg(err.message || 'Error recording payment. Please check details.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Dealer Payment (Installment / Full Settlement)"
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-brand-crimson-subtle border border-brand-crimson-border text-xs text-brand-crimson font-medium">
            {errorMsg}
          </div>
        )}

        {/* Dealer Selection */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Supplier / Brand Dealer <span className="text-brand-crimson">*</span>
          </label>
          <select
            value={dealerId}
            onChange={(e) => {
              setDealerId(e.target.value);
              setBillId(''); // reset selected bill
            }}
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text font-medium focus:outline-none focus:ring-1 focus:ring-brand-sage"
          >
            <option value="">-- Choose Brand / Dealer --</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.brand_name || d.name} ({d.name}) - Total Outstanding:{' '}
                {formatCurrency(d.metrics?.totalBalance || 0)}
              </option>
            ))}
          </select>
        </div>

        {/* Bill Selection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-text">
              Target Purchase Bill / Parchi (Optional)
            </label>
            <span className="text-[11px] text-muted">
              {unpaidBills.length} open {unpaidBills.length === 1 ? 'bill' : 'bills'}
            </span>
          </div>
          <select
            value={billId}
            onChange={(e) => setBillId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text font-mono focus:outline-none focus:ring-1 focus:ring-brand-sage"
          >
            <option value="">-- General Lump-Sum / On-Account Payment --</option>
            {unpaidBills.map((b) => (
              <option key={b.id} value={b.id}>
                [{b.bill_type.toUpperCase()}] {b.bill_number} • Due: {formatCurrency(b.balance_amount)} (Total: {formatCurrency(b.total_amount)})
              </option>
            ))}
          </select>
        </div>

        {/* Payment Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-text">
              Payment Amount (₹) <span className="text-brand-crimson">*</span>
            </label>
            {selectedBill && (
              <button
                type="button"
                onClick={() => setPaymentAmount(String(selectedBill.balance_amount))}
                className="text-[11px] font-semibold text-brand-sage hover:underline"
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
              placeholder="e.g. 70000"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-base font-bold font-mono rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-brand-sage"
            />
          </div>
        </div>

        {/* 🔥 LIVE DYNAMIC AUTO-BALANCE PREVIEW BOX */}
        {balancePreview && (
          <div className="p-3.5 rounded-xl border border-border bg-surface-subtle space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-text">
              <span className="flex items-center gap-1.5">
                <FileText size={14} className="text-brand-sage" />
                <span>Bill: {selectedBill.bill_number}</span>
              </span>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                  balancePreview.newStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {balancePreview.newStatus === 'paid'
                  ? 'Will Be Fully Cleared'
                  : 'Will Be Partially Paid'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border">
              <div className="p-2 rounded-lg bg-surface border border-border">
                <div className="text-[10px] text-muted">Total Bill</div>
                <div className="font-bold font-mono text-xs text-text">
                  {formatCurrency(balancePreview.totalBill)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-surface border border-brand-sage-border/60">
                <div className="text-[10px] text-brand-sage font-medium">This Payment</div>
                <div className="font-bold font-mono text-xs text-brand-sage">
                  {formatCurrency(balancePreview.payment)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-surface border border-amber-300">
                <div className="text-[10px] text-amber-800 font-medium">Remaining Balance</div>
                <div className="font-bold font-mono text-xs text-amber-950">
                  {formatCurrency(balancePreview.newBalance)}
                </div>
              </div>
            </div>

            {balancePreview.isOverpaying && (
              <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle size={12} /> Payment exceeds pending bill balance by{' '}
                {formatCurrency(balancePreview.payment - balancePreview.currentOutstanding)}.
              </div>
            )}
          </div>
        )}

        {/* Payment Mode & Channel (GST Bank vs Kaccha Cash Isolation) */}
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

        {/* Transaction Ref / Cheque Date & Payment Date */}
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
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-surface text-text hover:bg-surface-subtle transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={recordPaymentMutation.isPending}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1B382B] text-white hover:bg-[#142d22] active:scale-[0.99] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
