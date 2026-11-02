import { formatCurrency } from '@/shared/lib/format';
import { Modal, Button } from '@/shared/ui';
import { Printer, CheckCircle2 } from 'lucide-react';

export function DayEndZReportModal({ isOpen, onClose, eodData = {} }) {
  const handlePrint = () => {
    window.print();
  };

  const cashDrawer = eodData.cashDrawer || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Day-End (EOD) Till Reconciliation & Z-Report"
      size="lg"
    >
      <div className="space-y-6 text-text min-w-0">
        {/* Printable Paper Canvas */}
        <div id="printable-z-report" className="p-6 rounded-xl border border-border bg-surface space-y-5 font-sans shadow-2xs">
          {/* Header */}
          <div className="text-center pb-4 border-b border-border space-y-1">
            <div className="font-extrabold text-base sm:text-lg tracking-tight uppercase">
              {eodData.storeName || 'Star Enterprises'}
            </div>
            <div className="text-xs text-muted font-mono">
              GSTIN: {eodData.gstin || '27AAAAA0000A1Z5'} • Operations Shift Register
            </div>
            <div className="text-[11px] font-semibold text-brand-sage uppercase tracking-wider pt-0.5">
              OFFICIAL DAY-END Z-REPORT & CASHIER HANDOVER
            </div>
            <div className="text-[10px] text-muted font-mono">
              Generated: {eodData.generatedAt || new Date().toLocaleString('en-IN')} • Filter: {eodData.dateRangeLabel || 'Current'}
            </div>
          </div>

          {/* Invoice Shift Range */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg border border-border bg-bg/50 text-xs text-center font-mono">
            <div>
              <span className="text-[10px] text-muted block uppercase">Opening Bill</span>
              <strong className="text-text">{eodData.openingInvoice || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted block uppercase">Closing Bill</span>
              <strong className="text-text">{eodData.closingInvoice || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted block uppercase">Total Bills</span>
              <strong className="text-text">{eodData.totalInvoices ?? 0} invoices</strong>
            </div>
          </div>

          {/* Financial Summary Table */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-muted text-[10px] uppercase tracking-wider">
              1. Financial & Tax Performance
            </div>
            <div className="divide-y divide-border rounded-lg border border-border bg-surface overflow-hidden">
              <div className="flex items-center justify-between p-2.5">
                <span className="font-medium text-text">Gross Sales (Tax Inclusive)</span>
                <span className="font-bold text-text font-mono text-sm">{formatCurrency(eodData.grossSales || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted">Total Cost of Goods (COGS)</span>
                <span className="font-mono text-muted">{formatCurrency(eodData.totalCogs || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-brand-sage-subtle/30">
                <span className="font-semibold text-brand-sage-text">True Gross Profit Realized</span>
                <span className="font-bold font-mono text-brand-sage-text">
                  {formatCurrency(eodData.estimatedGrossProfit || 0)} ({(eodData.grossMarginPercent || 0).toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted">GST Collected (CGST: {formatCurrency(eodData.cgst || 0)} + SGST: {formatCurrency(eodData.sgst || 0)})</span>
                <span className="font-mono text-text font-semibold">{formatCurrency(eodData.totalTax || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted">Total Counter Discounts Granted</span>
                <span className="font-mono text-amber-700 font-medium">-{formatCurrency(eodData.totalDiscounts || 0)}</span>
              </div>
            </div>
          </div>

          {/* Cash & Tender Reconciliation */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-muted text-[10px] uppercase tracking-wider">
              2. Tender Breakdown & Till Reconciliation
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Physical Cash In Till</span>
                <div className="text-base font-bold font-mono text-text mt-0.5">
                  {formatCurrency(cashDrawer.cashInTill || 0)}
                </div>
                <span className="text-[10px] text-muted block mt-0.5">Physically in cash drawer</span>
              </div>

              <div className="p-3 rounded-lg border border-brand-sage-border bg-brand-sage-subtle/40">
                <span className="text-[10px] uppercase font-bold text-brand-sage-text block">Instant Bank UPI</span>
                <div className="text-base font-bold font-mono text-text mt-0.5">
                  {formatCurrency(cashDrawer.instantUpi || 0)}
                </div>
                <span className="text-[10px] text-brand-sage-text block mt-0.5">0% fee direct to bank</span>
              </div>

              <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Card Swipes (POS)</span>
                <div className="text-base font-bold font-mono text-text mt-0.5">
                  {formatCurrency(cashDrawer.posCards || 0)}
                </div>
                <span className="text-[10px] text-muted block mt-0.5">
                  Net: {formatCurrency(cashDrawer.netCardDeposit || 0)} (MDR: -{formatCurrency(cashDrawer.estimatedCardMdr || 0)})
                </span>
              </div>

              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Financier EMI Receivables</span>
                <div className="text-base font-bold font-mono text-text mt-0.5">
                  {formatCurrency(cashDrawer.financierReceivable || 0)}
                </div>
                <span className="text-[10px] text-muted block mt-0.5">Bajaj / HDB / PineLabs</span>
              </div>
            </div>
          </div>

          {/* Cashier Handover Signoff */}
          <div className="pt-4 border-t border-border grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-6">
              <div className="text-[10px] uppercase font-bold text-muted">Closing Cashier Sign-off</div>
              <div className="border-b border-dashed border-border pt-6" />
              <div className="text-[10px] text-muted">Signature & Employee Code</div>
            </div>
            <div className="space-y-6 text-right">
              <div className="text-[10px] uppercase font-bold text-muted">Store Manager / Owner Verification</div>
              <div className="border-b border-dashed border-border pt-6" />
              <div className="text-[10px] text-muted">Till Verified & Safe Deposited</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted">
            <CheckCircle2 size={15} className="text-brand-sage shrink-0" />
            <span>Ready for 80mm thermal receipt roll or A4 printer.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              variant="solid"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 shadow-2xs"
            >
              <Printer size={14} />
              <span>Print Z-Report</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
