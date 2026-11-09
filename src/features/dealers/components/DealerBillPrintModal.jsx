import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/ui';
import { formatCurrency, formatDate, formatPhone, amountToWords } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Printer, X } from 'lucide-react';

/**
 * DealerBillPrintModal renders an official printable Purchase Bill / Invoice voucher.
 * Matches the classic, minimal, and professional unified Star Enterprises design system.
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

  const gstin = store.gstin || '27AAAAA0000A1Z5';
  const pan = gstin && gstin.length >= 12 ? gstin.substring(2, 12) : null;

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
    <div className="bill-container-normal p-6 sm:p-8 bg-white text-slate-900 font-sans text-[11px] leading-relaxed">
      {/* 1. Masthead with Brand Monogram & Legal Designation */}
      <div className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b-2 border-slate-900 gap-3">
        {/* Left: Star Enterprises Brand Identity (Clean Classic Typography) */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif tracking-tight text-2xl font-extrabold text-slate-950 uppercase">
              STAR ENTERPRISES
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 border-l border-slate-300 pl-2 uppercase">
              EST. 2020
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800 tracking-wide mt-0.5">
            {store.name || 'Central Procurement & Warehouse'}
          </div>
          <div className="text-[10px] text-slate-600 font-medium">
            Wholesale Intake • Dealer Procurement • Inventory Khata
          </div>
        </div>

        {/* Right: Voucher Designation */}
        <div className="text-left sm:text-right">
          <div className="inline-block px-2.5 py-0.5 rounded border border-slate-900 bg-slate-900 text-white font-mono text-[9.5px] uppercase tracking-wider font-semibold">
            {isGst ? 'Original For Buyer / Inward ITC' : 'Store Record (Duplicate)'}
          </div>
          <div className="text-lg font-extrabold tracking-tight uppercase text-slate-950 mt-1">
            {isGst ? 'PURCHASE TAX INVOICE' : 'PURCHASE VOUCHER / KHATA PARCHI'}
          </div>
          <div className="text-[10px] text-slate-600 font-medium">
            {isGst
              ? 'Inward Supply Voucher • Rule 36 of CGST Rules, 2017'
              : 'Internal Procurement Entry • Wholesaler Khata Voucher'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Jurisdiction: {store.city || 'Bhusawal'}, Maharashtra (27)
          </div>
        </div>
      </div>

      {/* 2. Business Entity Cards (Buyer vs Supplier) */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-900 text-[11px]">
        {/* Recipient / Consignee (Buyer) */}
        <div className="space-y-0.5 pr-3 border-r border-slate-300">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Recipient / Inward Consignee (Buyer):
          </div>
          <div className="font-bold text-sm tracking-wide text-slate-950">
            {store.name || 'STAR ENTERPRISES'}
          </div>
          <div className="text-slate-800">
            {store.address_line1 || 'Main Market Road'}, {store.city || 'Bhusawal'}
            {store.pincode ? ` - ${store.pincode}` : ''}
          </div>
          <div className="flex flex-wrap gap-x-3 text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">GSTIN:</span>{' '}
              <span className="font-mono font-bold">{gstin}</span>
            </div>
            {pan && (
              <div>
                <span className="font-semibold text-slate-900">PAN:</span>{' '}
                <span className="font-mono font-bold">{pan}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">State:</span> Maharashtra (Code: 27)
            </div>
            <div>
              <span className="font-semibold text-slate-900">Phone:</span>{' '}
              <span className="font-mono">{store.phone || '+91 93700 11653'}</span>
            </div>
          </div>
        </div>

        {/* Supplier / Brand Dealer (Consignor) */}
        <div className="space-y-0.5 pl-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Supplier / Brand Dealer (Consignor):
          </div>
          <div className="font-bold text-sm tracking-wide text-slate-950">
            {dealer.name || dealer.brand_name || 'Vendor / Wholesaler'}
          </div>
          {dealer.contact_person && dealer.contact_person !== dealer.name && (
            <div>
              <span className="font-semibold text-slate-900">Contact Person:</span> {dealer.contact_person}
            </div>
          )}
          {dealer.phone && (
            <div>
              <span className="font-semibold text-slate-900">Phone:</span>{' '}
              <span className="font-mono">{formatPhone(dealer.phone)}</span>
            </div>
          )}
          <div>
            <span className="font-semibold text-slate-900">Supplier GSTIN:</span>{' '}
            <span className="font-mono font-bold">
              {dealer.gstin && isGst
                ? dealer.gstin
                : isGst
                ? 'Unregistered / Exempted'
                : 'Non-GST / Estimate Supplier Khata Account'}
            </span>
          </div>
          {dealer.address && (
            <div className="text-slate-700">{dealer.address}</div>
          )}
        </div>
      </div>

      {/* 3. Invoice Meta Details Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2.5 px-3 border-b border-slate-900 text-[11px] bg-slate-50/90">
        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
            {isGst ? 'Dealer Invoice Number' : 'Parchi / Slip Number'}:
          </span>
          <span className="font-mono font-bold text-slate-950 text-xs">
            #{bill.bill_number}
          </span>
        </div>

        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
            Bill Intake Date:
          </span>
          <span className="font-semibold text-slate-950">
            {bill.bill_date ? formatDate(bill.bill_date, false) : '—'}
          </span>
        </div>

        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
            Credit & Khata Terms:
          </span>
          <span className="font-medium text-slate-900">
            {bill.credit_days ? `${bill.credit_days} Days Credit` : 'Immediate Settlement'}
          </span>
        </div>

        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
            Settlement Status:
          </span>
          <span
            className={cn(
              'font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border inline-block font-mono',
              bill.status === 'paid'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                : bill.status === 'partially_paid'
                ? 'bg-amber-100 text-amber-900 border-amber-400'
                : 'bg-red-100 text-red-900 border-red-400'
            )}
          >
            {bill.status === 'paid'
              ? 'FULLY SETTLED'
              : bill.status === 'partially_paid'
              ? `PARTIAL (${formatCurrency(balanceAmount)} DUE)`
              : 'UNPAID / OUTSTANDING'}
          </span>
        </div>
      </div>

      {/* 4. Itemized Goods Table */}
      <div className="pt-3">
        <table className="w-full border-collapse border border-slate-900 text-[10.5px]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900 text-center font-bold text-slate-900">
              <th className="border border-slate-900 p-2 w-8">#</th>
              <th className="border border-slate-900 p-2 text-left">Description of Purchased Goods / Items</th>
              <th className="border border-slate-900 p-2 w-12 text-center">Qty</th>
              <th className="border border-slate-900 p-2 w-24 text-right">Unit Rate (₹)</th>
              {isGst && (
                <>
                  <th className="border border-slate-900 p-2 w-16 text-center">GST %</th>
                  <th className="border border-slate-900 p-2 w-24 text-right">Taxable (₹)</th>
                  <th className="border border-slate-900 p-2 w-20 text-right">CGST</th>
                  <th className="border border-slate-900 p-2 w-20 text-right">SGST</th>
                </>
              )}
              <th className="border border-slate-900 p-2 w-28 text-right">Total (₹)</th>
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
                  <tr key={idx} className="border-b border-slate-900">
                    <td className="border border-slate-900 p-2 text-center text-slate-600">{idx + 1}</td>
                    <td className="border border-slate-900 p-2">
                      <div className="font-bold text-slate-950">{it.name || it.description}</div>
                    </td>
                    <td className="border border-slate-900 p-2 text-center font-semibold text-slate-950">{qty}</td>
                    <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                      {formatCurrency(rate, true)}
                    </td>
                    {isGst && (
                      <>
                        <td className="border border-slate-900 p-2 text-center font-mono text-slate-700">
                          {gstRate}%
                        </td>
                        <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                          {formatCurrency(lineTaxable, true)}
                        </td>
                        <td className="border border-slate-900 p-2 text-right font-mono tabular-nums text-[9.5px]">
                          <div>{formatCurrency(halfTax, true)}</div>
                          <div className="text-slate-500 font-sans">{halfRate}%</div>
                        </td>
                        <td className="border border-slate-900 p-2 text-right font-mono tabular-nums text-[9.5px]">
                          <div>{formatCurrency(halfTax, true)}</div>
                          <div className="text-slate-500 font-sans">{halfRate}%</div>
                        </td>
                      </>
                    )}
                    <td className="border border-slate-900 p-2 text-right font-bold font-mono tabular-nums text-slate-950">
                      {formatCurrency(lineTotal, true)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="border-b border-slate-900">
                <td className="border border-slate-900 p-2 text-center text-slate-600">1</td>
                <td
                  className="border border-slate-900 p-2 italic text-slate-700"
                  colSpan={isGst ? 7 : 3}
                >
                  {bill.notes || 'Consignment / Wholesale Stock Purchase Entry'}
                </td>
                <td className="border border-slate-900 p-2 text-right font-bold font-mono tabular-nums text-slate-950">
                  {formatCurrency(totalAmount, true)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-900 font-bold text-slate-950">
              <td colSpan={2} className="border border-slate-900 p-2 text-right uppercase tracking-wider text-[10px]">
                Total Summary:
              </td>
              <td className="border border-slate-900 p-2 text-center font-mono">
                {items.length > 0 ? items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0) : 1}
              </td>
              <td className="border border-slate-900 p-2" />
              {isGst && (
                <>
                  <td className="border border-slate-900 p-2" />
                  <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                    {formatCurrency(taxableAmount, true)}
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                    {formatCurrency(cgstAmount, true)}
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                    {formatCurrency(sgstAmount, true)}
                  </td>
                </>
              )}
              <td className="border border-slate-900 p-2 text-right font-mono tabular-nums text-sm font-extrabold">
                {formatCurrency(totalAmount, true)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Financial Ledger & Settlement (Left 7 Cols) vs Totals (Right 5 Cols) */}
      <div className="grid grid-cols-12 border border-t-0 border-slate-900 text-[11px]">
        {/* Left: Amount in Words & Settlement History */}
        <div className="col-span-7 p-3 border-r border-slate-900 space-y-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Amount in Words:
            </div>
            <div className="font-semibold text-slate-950 italic pt-0.5 text-xs">
              {amountToWords(totalAmount)}
            </div>
          </div>

          {bill.notes && items.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Bill Notes / Warehouse Remarks:
              </span>
              <div className="text-slate-800 italic mt-0.5">{bill.notes}</div>
            </div>
          )}

          {/* Payment Records on this Bill */}
          {payments.length > 0 && (
            <div className="pt-2 border-t border-slate-200 text-[10px]">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 pb-1">
                Settlement History ({payments.length} {payments.length === 1 ? 'payment' : 'payments'} recorded):
              </div>
              <div className="space-y-0.5">
                {payments.map((p, pIdx) => (
                  <div key={pIdx} className="flex justify-between font-mono text-slate-800 text-[10.5px]">
                    <span>
                      {p.payment_date ? formatDate(p.payment_date, false) : '—'} • {p.payment_number || 'Voucher'} ({(p.payment_mode || 'Cash').toUpperCase()})
                    </span>
                    <span className="font-bold">{formatCurrency(p.amount, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplier Warranty & Inward Verification */}
          <div className="pt-2 border-t border-slate-200 p-2.5 rounded border border-slate-200 bg-slate-50/70 space-y-1.5 text-[10.5px]">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                Supplier Warranty & Inward Verification:
              </span>
              <span className="text-[9.5px] font-mono font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300">
                VERIFIED INTAKE
              </span>
            </div>
            <div className="text-[10px] text-slate-700 leading-snug">
              Consignment inspected with OEM seal intact. Manufacturer back-to-back warranty active from purchase intake date.
            </div>
            <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-200 flex items-center justify-between font-mono">
              <span>Intake Batch #{bill.bill_number}</span>
              <span>Wholesale Khata Record</span>
            </div>
          </div>
        </div>

        {/* Right: Totals Box */}
        <div className="col-span-5 p-3 space-y-1.5">
          {isGst && (
            <>
              <div className="flex justify-between text-slate-700">
                <span>Taxable Amount:</span>
                <span className="font-mono tabular-nums">{formatCurrency(taxableAmount, true)}</span>
              </div>
              {cgstAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Central GST (CGST):</span>
                  <span className="font-mono tabular-nums">{formatCurrency(cgstAmount, true)}</span>
                </div>
              )}
              {sgstAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>State GST (SGST):</span>
                  <span className="font-mono tabular-nums">{formatCurrency(sgstAmount, true)}</span>
                </div>
              )}
              {igstAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono tabular-nums">{formatCurrency(igstAmount, true)}</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between font-bold text-base pt-1.5 border-t-2 border-slate-900 text-slate-950">
            <span>Grand Total:</span>
            <span className="font-mono tabular-nums font-extrabold">{formatCurrency(totalAmount, true)}</span>
          </div>

          <div className="flex justify-between text-slate-700 pt-0.5">
            <span>Total Paid to Date:</span>
            <span className="font-mono tabular-nums font-bold text-slate-950">
              {formatCurrency(paidAmount, true)}
            </span>
          </div>

          <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
            <span>Remaining Khata Due:</span>
            <span
              className={cn(
                'font-mono tabular-nums',
                balanceAmount > 0 ? 'text-red-700 text-sm' : 'text-emerald-700'
              )}
            >
              {balanceAmount > 0 ? formatCurrency(balanceAmount, true) : '₹0 (Settled)'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Legal Terms & Symmetrical Dual Signatures */}
      <div className="grid grid-cols-2 border border-t-0 border-slate-900 p-3 text-[10px]">
        {/* Left: Supplier Signature */}
        <div className="space-y-1.5 pr-3 border-r border-slate-300">
          <div className="font-bold uppercase tracking-wider text-slate-900">Purchase Verification Note:</div>
          <ol className="list-decimal pl-3 space-y-0.5 text-slate-600 leading-snug">
            <li>Consignment quantities and physical specifications verified at warehouse intake.</li>
            <li>Inward ITC claim subject to supplier reporting in GSTR-1 and reflection in GSTR-2B.</li>
            <li>Payment disbursements tracked under Star Enterprises central ledger.</li>
          </ol>
          <div className="pt-6">
            <div className="border-t border-slate-400 w-44 pt-1 text-center text-slate-700 font-medium">
              Supplier Signature / Stamp
            </div>
          </div>
        </div>

        {/* Right: Consignee Authorized Signatory */}
        <div className="flex flex-col justify-between items-end pl-3 text-right">
          <div>
            <div className="font-semibold text-slate-800">
              For <span className="font-bold text-slate-950">{store.name || 'STAR ENTERPRISES'}</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
              Authorized Warehouse Signatory
            </div>
          </div>
          <div className="pt-10">
            <div className="border-t border-slate-900 w-44 pt-1 text-center font-bold text-slate-950">
              Authorized Signatory
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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60"
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
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  {isGst ? 'Purchase Tax Invoice Voucher' : 'Purchase Parchi / Voucher'}
                </h3>
                <span className="px-2 py-0.5 rounded border border-border bg-surface-subtle font-mono text-xs font-semibold text-text">
                  #{bill.bill_number}
                </span>
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
            <div className="preview-sheet-normal">
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
              <Button variant="solid" onClick={handlePrint} className="gap-1.5">
                <Printer size={15} />
                <span>Print Bill</span>
              </Button>
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
