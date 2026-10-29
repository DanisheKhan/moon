import { useState, useMemo } from 'react';
import { Button, Input, Modal } from '@/shared/ui';
import { useRecordPayment } from '../hooks/useBilling';
import { formatCurrency } from '@/shared/lib/format';
import { getErrorMessage } from '@/shared/lib/errors';
import { cn } from '@/shared/lib/cn';
import {
  Banknote,
  QrCode,
  CreditCard,
  FileCheck2,
  Coins,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'upi', label: 'UPI / QR', icon: QrCode },
  { id: 'card', label: 'Card / EDC', icon: CreditCard },
  { id: 'emi', label: 'Consumer EMI', icon: FileCheck2 },
];

export function CollectPaymentModal({ isOpen, onClose, invoice }) {
  if (!isOpen || !invoice) return null;

  return <CollectPaymentForm invoice={invoice} onClose={onClose} />;
}

function CollectPaymentForm({ invoice, onClose }) {
  const recordPaymentMutation = useRecordPayment();

  // Compute existing payments and balance due
  const grandTotal = parseFloat(invoice.grand_total || 0);
  const totalPaid = useMemo(() => {
    return (invoice.payments || []).reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  }, [invoice.payments]);

  const balanceDue = Math.max(grandTotal - totalPaid, 0);

  const [collectAmount, setCollectAmount] = useState(balanceDue.toString());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const parsedCollect = parseFloat(collectAmount) || 0;
  const newBalance = Math.max(balanceDue - parsedCollect, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');

    if (parsedCollect <= 0) {
      setErrorMessage('Please enter an amount greater than ₹0.');
      return;
    }

    if (parsedCollect > balanceDue + 0.01) {
      setErrorMessage(`Amount cannot exceed the remaining balance of ${formatCurrency(balanceDue)}.`);
      return;
    }

    if (paymentMethod !== 'cash' && !referenceNumber.trim()) {
      setErrorMessage('Please enter a transaction ID or reference number.');
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId: invoice.id,
        paymentMethod,
        amount: parsedCollect,
        referenceNumber: referenceNumber.trim() || null,
      });

      setSuccessMessage(`Payment of ${formatCurrency(parsedCollect)} recorded successfully!`);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Coins size={16} className="text-brand-sage" />
          <span>Collect Payment — {invoice.invoice_number}</span>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer & Bill Overview Box */}
        <div className="p-3.5 rounded-xl border border-border bg-surface-subtle text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-text">{invoice.customer_name || 'Walk-in Customer'}</span>
              {invoice.customer_phone && (
                <span className="text-muted ml-1.5 font-mono">({invoice.customer_phone})</span>
              )}
            </div>
            <span className="text-[10px] font-mono text-muted uppercase">
              {invoice.stores?.name || 'Star Store'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
            <div>
              <span className="text-[10px] text-muted block">Bill Total</span>
              <span className="font-mono font-semibold text-text">{formatCurrency(grandTotal)}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Paid So Far</span>
              <span className="font-mono font-semibold text-brand-sage">{formatCurrency(totalPaid)}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Outstanding Balance</span>
              <span className="font-mono font-bold text-danger">{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg border border-brand-sage/30 bg-brand-sage/10 text-brand-sage text-xs flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="collect-amount" className="text-xs font-semibold text-text">
              Amount to Collect (₹)
            </label>
            <button
              type="button"
              onClick={() => setCollectAmount(balanceDue.toString())}
              className="text-[10px] text-brand-sage hover:underline cursor-pointer font-medium"
            >
              Collect Full ({formatCurrency(balanceDue)})
            </button>
          </div>
          <Input
            id="collect-amount"
            type="number"
            step="0.01"
            min="1"
            max={balanceDue}
            value={collectAmount}
            onChange={(e) => setCollectAmount(e.target.value)}
            className="font-mono text-base font-bold"
            required
          />
          {parsedCollect > 0 && parsedCollect < balanceDue && (
            <p className="text-[11px] text-amber-600 font-medium">
              Remaining balance after this collection: <strong>{formatCurrency(newBalance)}</strong>
            </p>
          )}
          {parsedCollect >= balanceDue && balanceDue > 0 && (
            <p className="text-[11px] text-brand-sage font-medium">
              This collection will completely clear the outstanding balance.
            </p>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text block">Payment Collection Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={cn(
                    'p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer',
                    isSelected
                      ? 'bg-text text-bg border-text font-semibold shadow-2xs'
                      : 'border-border bg-surface text-muted hover:text-text hover:bg-surface-subtle'
                  )}
                >
                  <Icon size={14} className="shrink-0" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reference / Transaction ID */}
        {paymentMethod !== 'cash' && (
          <div className="space-y-1.5">
            <Input
              id="payment-ref"
              label={`${paymentMethod.toUpperCase()} Transaction ID / UTR / Reference`}
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UTR-984029148 / AUTH-0294"
              required
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={recordPaymentMutation.isPending}
            className="text-xs rounded-lg cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={recordPaymentMutation.isPending || parsedCollect <= 0}
            pending={recordPaymentMutation.isPending}
            className="text-xs font-semibold rounded-lg gap-1.5 shadow-2xs cursor-pointer"
          >
            <Coins size={14} />
            <span>Confirm Collection ({formatCurrency(parsedCollect)})</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

