import { useMemo } from 'react';
import { Modal, Button, Badge } from '@/shared/ui';
import { useDealerBillDetail } from '../hooks/useDealers';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  FileText,
  Calendar,
  Layers,
  TrendingDown,
  Building2,
} from 'lucide-react';

export function BillTimelineModal({ isOpen, onClose, billId, onOpenRecordPayment }) {
  const { data: bill, isLoading } = useDealerBillDetail(billId);

  // Compute timeline and velocity metrics
  const velocity = useMemo(() => {
    if (!bill) return null;

    const billDate = new Date(bill.bill_date);
    const dueDate = bill.due_date ? new Date(bill.due_date) : null;
    const creditDays = Number(bill.credit_days || 30);
    const isPaid = bill.status === 'paid';

    if (isPaid && bill.cleared_at) {
      const clearedDate = new Date(bill.cleared_at);
      const daysTaken =
        bill.payment_days_taken != null
          ? bill.payment_days_taken
          : Math.max(0, Math.floor((clearedDate - billDate) / (1000 * 60 * 60 * 24)));

      const diffWithCredit = creditDays - daysTaken;

      return {
        isCleared: true,
        daysTaken,
        diffWithCredit,
        clearedDate,
        message:
          diffWithCredit > 0
            ? `Cleared in ${daysTaken} days (${diffWithCredit} days before ${creditDays}-day credit terms)`
            : diffWithCredit === 0
            ? `Cleared exactly on due date (${daysTaken} days)`
            : `Cleared in ${daysTaken} days (${Math.abs(diffWithCredit)} days past ${creditDays}-day credit terms)`,
        badgeColor:
          diffWithCredit >= 0
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-rose-100 text-rose-800 border-rose-300',
      };
    }

    // Pending / Partial Bill
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysRemaining = null;
    let daysOverdue = null;

    if (dueDate) {
      const diffDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        daysOverdue = diffDays;
      } else {
        daysRemaining = Math.abs(diffDays);
      }
    }

    return {
      isCleared: false,
      daysRemaining,
      daysOverdue,
      creditDays,
      message:
        daysOverdue != null
          ? `Overdue by ${daysOverdue} days (Credit term: ${creditDays} days)`
          : `Payment due in ${daysRemaining} days`,
      badgeColor:
        daysOverdue != null
          ? 'bg-brand-crimson-subtle text-brand-crimson border-brand-crimson-border'
          : 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }, [bill]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bill Payment Timeline & Aging Audit"
      className="max-w-2xl"
    >
      {isLoading ? (
        <div className="py-12 text-center text-muted text-xs">
          Loading bill timeline & payments...
        </div>
      ) : !bill ? (
        <div className="py-8 text-center text-muted text-xs">Bill not found.</div>
      ) : (
        <div className="space-y-4">
          {/* Header Summary Card */}
          <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-text font-mono">
                    {bill.bill_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      bill.bill_type === 'gst'
                        ? 'bg-brand-sage-subtle text-brand-sage border-brand-sage-border'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {bill.bill_type === 'gst' ? 'GST Tax Invoice' : 'Kaccha Parchi'}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      bill.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : bill.status === 'partially_paid'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {bill.status === 'paid'
                      ? 'Fully Cleared'
                      : bill.status === 'partially_paid'
                      ? 'Partially Paid'
                      : 'Unpaid'}
                  </span>
                </div>
                <div className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                  <Building2 size={12} />
                  <span className="font-semibold text-text">
                    {bill.dealer?.brand_name || bill.dealer?.name}
                  </span>
                  <span>({bill.dealer?.name})</span>
                </div>
              </div>

              {/* Outstanding Balance */}
              <div className="text-right">
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">
                  Remaining Balance
                </div>
                <div
                  className={`text-xl font-bold font-mono ${
                    Number(bill.balance_amount) > 0 ? 'text-text' : 'text-emerald-600'
                  }`}
                >
                  {formatCurrency(bill.balance_amount)}
                </div>
              </div>
            </div>

            {/* Velocity / Speed Banner */}
            {velocity && (
              <div
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${velocity.badgeColor}`}
              >
                <Clock size={14} className="shrink-0" />
                <span>{velocity.message}</span>
              </div>
            )}

            {/* Bill Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-border/70">
              <div>
                <span className="text-[10px] text-muted block">Bill Date</span>
                <span className="font-semibold text-text">
                  {formatDate(bill.bill_date, false)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Credit Terms</span>
                <span className="font-semibold text-text font-mono">
                  {bill.credit_days} Days
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Due Date</span>
                <span className="font-semibold text-text">
                  {formatDate(bill.due_date, false)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Total Bill Value</span>
                <span className="font-bold font-mono text-text">
                  {formatCurrency(bill.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline of Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-text uppercase tracking-wide">
                Payment History & Clearance Timeline
              </span>
              <span className="text-[11px] text-muted">
                {bill.sortedTimeline?.length || 0} transaction events
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {/* Event 0: Bill Issued */}
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-brand-sage text-white flex items-center justify-center">
                  <FileText size={11} />
                </div>
                <div className="p-3 rounded-lg border border-border bg-surface w-full text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text">
                      Bill Created ({bill.bill_type.toUpperCase()})
                    </span>
                    <span className="text-muted font-mono text-[11px]">
                      {formatDate(bill.bill_date, false)}
                    </span>
                  </div>
                  <div className="text-muted mt-1">
                    Initial bill recorded for{' '}
                    <span className="font-bold font-mono text-text">
                      {formatCurrency(bill.total_amount)}
                    </span>
                    . Agreed credit: {bill.credit_days} days.
                  </div>
                </div>
              </div>

              {/* Subsequent Payment / Debit Events */}
              {bill.sortedTimeline?.map((item, idx) => {
                const isPayment = item.timelineType === 'payment';

                return (
                  <div key={item.id} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 mt-1 w-5 h-5 rounded-full text-white flex items-center justify-center ${
                        isPayment ? 'bg-emerald-600' : 'bg-purple-600'
                      }`}
                    >
                      {isPayment ? <CreditCard size={11} /> : <TrendingDown size={11} />}
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-surface w-full text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text flex items-center gap-1.5">
                          <span>
                            {isPayment
                              ? `Payment: ${formatCurrency(item.amount)}`
                              : `Debit Note: ${formatCurrency(item.amount)}`}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle text-muted border border-border">
                            {item.payment_number || item.note_number}
                          </span>
                        </span>
                        <span className="text-muted font-mono text-[11px]">
                          {formatDate(item.timestamp, false)}
                        </span>
                      </div>

                      <div className="text-muted mt-1 space-y-0.5">
                        {isPayment ? (
                          <div>
                            Mode: <span className="font-semibold text-text uppercase">{item.payment_mode}</span>
                            {item.transaction_ref && (
                              <span className="font-mono text-text"> (Ref: {item.transaction_ref})</span>
                            )}
                            {' • '}Channel:{' '}
                            <span className="font-medium text-text">
                              {item.payment_channel === 'official_bank'
                                ? 'Official Bank'
                                : 'Secondary / Cash'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            Reason:{' '}
                            <span className="font-semibold text-text uppercase">
                              {item.reason?.replace('_', ' ')}
                            </span>
                            {item.description && <span> - {item.description}</span>}
                          </div>
                        )}
                        {item.notes && <div className="text-[11px] italic">"{item.notes}"</div>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Final State / Cleared */}
              {bill.status === 'paid' && (
                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 size={12} />
                  </div>
                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs w-full text-emerald-950 font-medium">
                    <div className="flex items-center justify-between font-bold">
                      <span>Bill Fully Cleared</span>
                      <span className="font-mono text-[11px]">
                        {formatDate(bill.cleared_at, false)}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      {velocity?.message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {Number(bill.balance_amount) > 0 && onOpenRecordPayment && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(bill.dealer, bill);
                }}
              >
                Pay Pending Balance ({formatCurrency(bill.balance_amount)})
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
