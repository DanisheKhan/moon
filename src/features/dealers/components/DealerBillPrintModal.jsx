import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Badge } from '@/shared/ui';
import { formatCurrency, formatDate, formatPhone, amountToWords } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Printer, X, FileText, Building2, Calendar, CheckCircle2 } from 'lucide-react';

/**
 * DealerBillPrintModal renders an official printable Purchase Bill / Invoice voucher.
 * Supports standard A4 printing and PDF export via #print-portal.
 * Handles both GST Tax Invoices (ITC claim) and Kaccha Purchase Entries.
 */
export function DealerBillPrintModal({ isOpen, onClose, bill, currentStore }) {
  const [printPortalNode] = useState(() => {
    if (typeof document === 'undefined') return null;
    let portal = document.getElementById('print-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'print-portal';
      document.body.appendChild(portal);
    }
    return portal;
  });

  // Handle ESC key and scroll lock
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !bill) return null;

  const isGst = bill.bill_type === 'gst';
  const dealer = bill.dealer || {};
  const store = currentStore || bill.store || bill.stores || {};
  const items = Array.isArray(bill.items) ? bill.items : [];
  const payments = Array.isArray(bill.payments) ? bill.payments : [];

  const totalAmount = Math.round(Number(bill.total_amount || 0));
  const paidAmount = Math.round(Number(bill.paid_amount || 0));
  const balanceAmount = Math.round(Number(bill.balance_amount || 0));

  const cgstAmount = Math.round(Number(bill.cgst_amount || 0));
  const sgstAmount = Math.round(Number(bill.sgst_amount || 0));
  const igstAmount = Math.round(Number(bill.igst_amount || 0));
  const totalTax = cgstAmount + sgstAmount + igstAmount || Math.round(Number(bill.total_tax_amount || 0));
  const taxableAmount = isGst ? Math.max(0, totalAmount - totalTax) : totalAmount;

  function handlePrint() {
    document.body.classList.add('printing-portal-active');
    window.addEventListener(
      'afterprint',
      () => {
        document.body.classList.remove('printing-portal-active');
      },
      { once: true }
    );
    window.print();
  }

  /* ------------------------------------------------------------- */
  /* PRINTABLE DOCUMENT NODE                                       */
  /* ------------------------------------------------------------- */
  const billDocumentNode = (
    <div className="bill-container-normal p-6 sm:p-8 bg-white text-black font-sans text-[11px] leading-relaxed">
      {/* 1. Header Banner */}
      <div className="flex justify-between items-start pb-3 border-b-2 border-black">
        <div>
          <div className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
            <span>{isGst ? 'PURCHASE TAX INVOICE' : 'PURCHASE VOUCHER / KHATA PARCHI'}</span>
          </div>
          <div className="text-[10px] text-gray-700 mt-0.5">
            {isGst
              ? 'Inward Supply Voucher • Official GST Input Tax Credit (ITC) Record'
              : 'Internal Procurement Entry • Insulated Cash & Wholesaler Khata Voucher'}
          </div>
        </div>

        <div className="text-right text-[10px]">
          <div className="font-bold uppercase tracking-wider px-2 py-0.5 border border-black inline-block">
            {isGst ? 'Original For Buyer / Inward ITC' : 'Store Record (Duplicate)'}
          </div>
          <div className="pt-1 text-gray-700">
            Jurisdiction: {store.city || 'Bhusawal'}, Maharashtra (27)
          </div>
        </div>
      </div>

      {/* 2. Business Entity Cards (Buyer vs Supplier) */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-black text-[11px]">
        {/* Recipient / Billed To: Star Enterprises Store */}
        <div className="space-y-0.5 pr-2 border-r border-black/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
            Recipient / Inward Consignee (Buyer):
          </div>
          <div className="font-bold text-sm tracking-wide text-black">
            {store.name || 'STAR ENTERPRISES'}
          </div>
          <div className="text-gray-800">
            {store.address_line1 || 'Main Market Road'}, {store.city || 'Bhusawal'}
            {store.pincode ? ` - ${store.pincode}` : ''}
          </div>
          <div>
            <span className="font-semibold">GSTIN:</span>{' '}
            <span className="font-mono">{store.gstin || '27AAAAA0000A1Z5'}</span>
          </div>
          <div>
            <span className="font-semibold">State:</span> Maharashtra (State Code 27)
          </div>
          <div>
            <span className="font-semibold">Phone:</span>{' '}
            <span className="font-mono">{store.phone || '+91 93700 11653'}</span>
          </div>
        </div>

        {/* Supplier / Brand Dealer */}
        <div className="space-y-0.5 pl-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
            Supplier / Brand Dealer (Consignor):
          </div>
          <div className="font-bold text-sm tracking-wide text-black">
            {dealer.name || dealer.brand_name || 'Vendor / Wholesaler'}
          </div>
          {dealer.contact_person && dealer.contact_person !== dealer.name && (
            <div>
              <span className="font-semibold">Contact Person:</span> {dealer.contact_person}
            </div>
          )}
          {dealer.phone && (
            <div>
              <span className="font-semibold">Phone:</span>{' '}
              <span className="font-mono">{formatPhone(dealer.phone)}</span>
            </div>
          )}
          {dealer.gstin && isGst && (
            <div>
              <span className="font-semibold">Supplier GSTIN:</span>{' '}
              <span className="font-mono font-bold">{dealer.gstin}</span>
            </div>
          )}
          {dealer.address && (
            <div className="text-gray-800">{dealer.address}</div>
          )}
          {!isGst && (
            <div className="text-gray-600 italic">
              Non-GST / Estimate Supplier Khata Account
            </div>
          )}
        </div>
      </div>

      {/* 3. Invoice Meta Details Bar */}
      <div className="grid grid-cols-4 gap-2 py-2.5 border-b border-black text-[11px] bg-gray-50/80">
        <div>
          <span className="text-[10px] font-bold uppercase text-gray-600 block">
            {isGst ? 'Invoice Number' : 'Parchi / Slip No'}:
          </span>
          <span className="font-mono font-bold text-black text-xs">
            #{bill.bill_number}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-gray-600 block">Bill Date:</span>
          <span className="font-semibold text-black">
            {bill.bill_date ? formatDate(bill.bill_date, false) : '—'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-gray-600 block">Credit Terms:</span>
          <span className="font-medium text-black">
            {bill.credit_days ? `${bill.credit_days} Days Credit` : 'Immediate / Cash'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-gray-600 block">Settlement Status:</span>
          <span
            className={cn(
              'font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded border inline-block',
              bill.status === 'paid'
                ? 'bg-green-100 text-green-900 border-green-400'
                : bill.status === 'partially_paid'
                ? 'bg-amber-100 text-amber-900 border-amber-400'
                : 'bg-red-100 text-red-900 border-red-400'
            )}
          >
            {bill.status === 'paid'
              ? 'FULLY SETTLED'
              : bill.status === 'partially_paid'
              ? 'PARTIALLY PAID'
              : 'UNPAID / OUTSTANDING'}
          </span>
        </div>
      </div>

      {/* 4. Itemized Goods Table */}
      <div className="pt-3">
        <table className="w-full border-collapse border border-black text-[10.5px]">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-center font-bold">
              <th className="border border-black p-1.5 w-8">#</th>
              <th className="border border-black p-1.5 text-left">Description of Purchased Goods / Items</th>
              <th className="border border-black p-1.5 w-12">Qty</th>
              <th className="border border-black p-1.5 w-20 text-right">Unit Rate (₹)</th>
              {isGst && (
                <>
                  <th className="border border-black p-1.5 w-14 text-center">GST %</th>
                  <th className="border border-black p-1.5 w-20 text-right">Taxable (₹)</th>
                  <th className="border border-black p-1.5 w-18 text-right">CGST</th>
                  <th className="border border-black p-1.5 w-18 text-right">SGST</th>
                </>
              )}
              <th className="border border-black p-1.5 w-24 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((it, idx) => {
                const qty = Math.max(1, Number(it.quantity) || 1);
                const rate = Math.max(0, Number(it.unit_price) || 0);
                const lineTotal = Math.round(Number(it.total) || qty * rate);
                const gstRate = Number(it.gst_rate ?? 18);
                const halfRate = (gstRate / 2).toFixed(1);
                const lineTaxable = isGst ? Math.round(lineTotal / (1 + gstRate / 100)) : lineTotal;
                const lineTax = lineTotal - lineTaxable;
                const halfTax = Math.round(lineTax / 2);

                return (
                  <tr key={idx} className="border-b border-black">
                    <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-black p-1.5">
                      <div className="font-semibold">{it.name || it.description}</div>
                    </td>
                    <td className="border border-black p-1.5 text-center font-semibold">{qty}</td>
                    <td className="border border-black p-1.5 text-right font-mono">
                      {formatCurrency(rate, true)}
                    </td>
                    {isGst && (
                      <>
                        <td className="border border-black p-1.5 text-center font-mono">
                          {gstRate}%
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {formatCurrency(lineTaxable, true)}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono text-[9.5px]">
                          <div>{formatCurrency(halfTax, true)}</div>
                          <div className="text-gray-500">{halfRate}%</div>
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono text-[9.5px]">
                          <div>{formatCurrency(halfTax, true)}</div>
                          <div className="text-gray-500">{halfRate}%</div>
                        </td>
                      </>
                    )}
                    <td className="border border-black p-1.5 text-right font-bold font-mono">
                      {formatCurrency(lineTotal, true)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="border-b border-black">
                <td className="border border-black p-2 text-center">1</td>
                <td
                  className="border border-black p-2 italic"
                  colSpan={isGst ? 8 : 4}
                >
                  {bill.notes || 'Consignment / Wholesale Stock Purchase Entry'}
                </td>
                <td className="border border-black p-2 text-right font-bold font-mono">
                  {formatCurrency(totalAmount, true)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Amount in Words & Financial Breakdown */}
      <div className="grid grid-cols-12 border border-t-0 border-black text-[11px]">
        {/* Left: Amount in words & Notes */}
        <div className="col-span-7 p-2.5 border-r border-black space-y-2">
          <div>
            <div className="font-bold text-[10px] uppercase text-gray-700">Amount in Words:</div>
            <div className="font-semibold text-black italic">
              {amountToWords(totalAmount)}
            </div>
          </div>

          {bill.notes && items.length > 0 && (
            <div className="pt-1 border-t border-black/40">
              <span className="font-bold text-[10px] uppercase text-gray-700">Bill Notes / Remarks:</span>
              <div className="text-gray-800 italic mt-0.5">{bill.notes}</div>
            </div>
          )}

          {/* Payment Records on this Bill */}
          {payments.length > 0 && (
            <div className="pt-1.5 border-t border-black/40 text-[10px]">
              <div className="font-bold uppercase text-gray-700 mb-1">
                Settlement History ({payments.length} {payments.length === 1 ? 'payment' : 'payments'} recorded):
              </div>
              <div className="space-y-0.5">
                {payments.map((p, pIdx) => (
                  <div key={pIdx} className="flex justify-between font-mono text-gray-800">
                    <span>
                      {p.payment_date ? formatDate(p.payment_date, false) : '—'} • {p.payment_number || 'Voucher'} ({(p.payment_mode || 'Cash').toUpperCase()})
                    </span>
                    <span className="font-bold">{formatCurrency(p.amount, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Totals Box */}
        <div className="col-span-5 p-2.5 space-y-1">
          {isGst && (
            <>
              <div className="flex justify-between text-gray-700">
                <span>Taxable Amount:</span>
                <span className="font-mono">{formatCurrency(taxableAmount, true)}</span>
              </div>
              {cgstAmount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Central GST (CGST):</span>
                  <span className="font-mono">{formatCurrency(cgstAmount, true)}</span>
                </div>
              )}
              {sgstAmount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>State GST (SGST):</span>
                  <span className="font-mono">{formatCurrency(sgstAmount, true)}</span>
                </div>
              )}
              {igstAmount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono">{formatCurrency(igstAmount, true)}</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between font-bold text-sm pt-1 border-t border-black text-black">
            <span>Grand Total:</span>
            <span className="font-mono">{formatCurrency(totalAmount, true)}</span>
          </div>

          <div className="flex justify-between text-gray-700 pt-0.5">
            <span>Total Paid to Date:</span>
            <span className="font-mono font-semibold text-black">
              {formatCurrency(paidAmount, true)}
            </span>
          </div>

          <div className="flex justify-between font-bold text-xs pt-1 border-t border-black/60">
            <span>Remaining Khata Due:</span>
            <span
              className={cn(
                'font-mono',
                balanceAmount > 0 ? 'text-red-700' : 'text-green-700'
              )}
            >
              {balanceAmount > 0 ? formatCurrency(balanceAmount, true) : '₹0 (Settled)'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Terms & Dual Signatures */}
      <div className="grid grid-cols-2 border border-t-0 border-black p-3 text-[10px]">
        <div className="space-y-1 pr-3">
          <div className="font-bold uppercase tracking-wider">Purchase Verification Note:</div>
          <ol className="list-decimal pl-3 space-y-0.5 text-gray-600">
            <li>Consignment quantities and physical specifications verified at warehouse intake.</li>
            <li>Inward ITC claim subject to supplier reporting in GSTR-1 and reflection in GSTR-2B.</li>
            <li>Payment disbursements tracked under Star Enterprises central ledger.</li>
          </ol>
        </div>

        <div className="grid grid-cols-2 gap-4 pl-3 text-center">
          <div className="flex flex-col justify-between items-center pt-8">
            <div className="border-t border-black w-28 pt-1 text-[9.5px] font-medium text-gray-800">
              Supplier Signature / Stamp
            </div>
          </div>

          <div className="flex flex-col justify-between items-center pt-8">
            <div className="border-t border-black w-32 pt-1 text-[9.5px] font-bold text-black">
              Authorized Signatory
              <span className="block text-[8.5px] font-normal text-gray-600">
                Star Enterprises
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* On-screen Modal Dialog Window */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="relative invoice-dialog-window rounded-xl border border-border bg-surface text-text shadow-2xs"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface">
            <div>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-brand-sage" />
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  {isGst ? 'Purchase Tax Invoice Voucher' : 'Purchase Parchi / Voucher'}
                </h3>
                <Badge variant="outline" className="font-mono text-xs">
                  #{bill.bill_number}
                </Badge>
              </div>
              <div className="text-xs text-muted">
                {dealer.name || dealer.brand_name} • {bill.bill_date ? formatDate(bill.bill_date, false) : ''}
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-bg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Preview Sheet Container */}
          <div className="invoice-preview-body bg-bg flex justify-center items-start overflow-y-auto">
            <div className="preview-sheet-normal shadow-md my-2">
              {billDocumentNode}
            </div>
          </div>

          {/* Footer Actions Bar */}
          <div className="px-5 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface">
            <div className="text-xs text-muted">
              Standard A4 Print Layout • Compatible with all thermal/laser printers and PDF export.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#1B382B] hover:bg-[#142d22] text-white shadow-2xs transition-all cursor-pointer"
              >
                <Printer size={15} />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Isolated Print Portal mounted directly to document.body */}
      {printPortalNode &&
        createPortal(
          <div id="print-document-root">
            {billDocumentNode}
          </div>,
          printPortalNode
        )}
    </>
  );
}
