import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { useCreateDealerDebitNote, useDealerBills } from '../hooks/useDealers';
import { formatCurrency } from '@/shared/lib/format';
import { TrendingDown, AlertCircle } from 'lucide-react';

export function DebitNoteModal({
  isOpen,
  onClose,
  dealers = [],
  preselectedDealer = null,
  storeId,
}) {
  const createDebitNoteMutation = useCreateDealerDebitNote();

  const [dealerId, setDealerId] = useState(preselectedDealer?.id || '');
  const [billId, setBillId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('purchase_return');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: bills = [] } = useDealerBills({
    dealerId: dealerId || undefined,
  });

  const unpaidBills = bills.filter((b) => b.balance_amount > 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!dealerId) {
      setErrorMsg('Please select a dealer.');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid debit note amount.');
      return;
    }

    try {
      await createDebitNoteMutation.mutateAsync({
        dealer_id: dealerId,
        bill_id: billId || null,
        store_id: storeId || null,
        amount: amountNum,
        reason,
        note_date: noteDate,
        description: description.trim() || null,
      });

      setAmount('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to create debit note:', err);
      setErrorMsg(err.message || 'Error recording debit note.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Debit Note / Purchase Return Adjustment"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-brand-crimson-subtle border border-brand-crimson-border text-xs text-brand-crimson font-medium">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Dealer / Brand <span className="text-brand-crimson">*</span>
          </label>
          <select
            value={dealerId}
            onChange={(e) => setDealerId(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text font-medium"
          >
            <option value="">-- Choose Brand / Dealer --</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.brand_name || d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Apply to Specific Bill (Optional)
          </label>
          <select
            value={billId}
            onChange={(e) => setBillId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text font-mono"
          >
            <option value="">-- General Dealer Debit (On-Account) --</option>
            {unpaidBills.map((b) => (
              <option key={b.id} value={b.id}>
                [{b.bill_type.toUpperCase()}] {b.bill_number} (Bal: {formatCurrency(b.balance_amount)})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Debit Amount (₹) <span className="text-brand-crimson">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg border border-border bg-surface text-text"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Date <span className="text-brand-crimson">*</span>
            </label>
            <input
              type="date"
              required
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Adjustment Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text"
          >
            <option value="purchase_return">Purchase Return (Goods sent back)</option>
            <option value="damaged_goods">Damaged / Defective Stock Credit</option>
            <option value="scheme_discount">Vendor Scheme / Cash Discount (CD)</option>
            <option value="rate_difference">Rate Difference / Price Drop Protection</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Description / Item Details
          </label>
          <input
            type="text"
            placeholder="e.g. Returned 2 defective 43-inch LED TVs"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createDebitNoteMutation.isPending}
          >
            {createDebitNoteMutation.isPending ? 'Saving...' : 'Issue Debit Note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
