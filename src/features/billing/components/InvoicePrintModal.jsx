import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Badge } from '@/shared/ui';
import { formatCurrency, formatDate, amountToWords } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Printer, X } from 'lucide-react';

/**
 * InvoicePrintModal renders the official standard A4 GST Tax Invoice.
 * Provides live on-screen document preview with natural scrolling
 * and isolates printing directly to #print-portal on a single A4 page.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {Object} props.invoiceDetail
 */
export function InvoicePrintModal({ isOpen, onClose, invoiceDetail }) {
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

  if (!isOpen || !invoiceDetail) return null;

  const store = invoiceDetail.stores || {};
  const items = invoiceDetail.items || [];
  const payments = invoiceDetail.payments || [];
  const grandTotal = Math.round(Number(invoiceDetail.grand_total || 0));
  const subtotal = Math.round(Number(invoiceDetail.subtotal || 0));
  const cgstAmount = Math.round(Number(invoiceDetail.cgst_amount || 0));
  const sgstAmount = Math.round(Number(invoiceDetail.sgst_amount || 0));
  const discountAmount = Math.round(Number(invoiceDetail.discount_amount || 0));
  const totalPaid = Math.round(payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0));
  const balanceDue = Math.round(Math.max(grandTotal - totalPaid, 0));

  /**
   * Triggers clean A4 invoice printing via #print-portal
   */
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
  /* OFFICIAL A4 GST TAX INVOICE DOCUMENT                          */
  /* ------------------------------------------------------------- */
  const invoiceDocumentNode = (
    <div className="bill-container-normal">
      {/* Official Top Bar */}
      <div className="flex justify-between items-start pb-2 border-b-2 border-black">
        <div>
          <div className="text-xl font-bold tracking-tight uppercase">TAX INVOICE</div>
          <div className="text-[10.5px] text-gray-700">Issued under Section 31 of CGST Act, 2017</div>
        </div>
        <div className="text-right text-[10.5px]">
          <div className="font-bold uppercase tracking-wider px-2 py-0.5 border border-black inline-block">
            Original For Recipient
          </div>
          <div className="pt-1 text-gray-700">Place of Supply: Maharashtra (State Code 27)</div>
        </div>
      </div>

      {/* Seller & Invoice Meta Header */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-black text-[11px]">
        {/* Seller Information */}
        <div className="space-y-0.5">
          <div className="font-bold text-sm tracking-wide text-black">{store.name || 'STAR ENTERPRISES'}</div>
          <div>{store.address_line1}, {store.city} {store.pincode ? `- ${store.pincode}` : ''}</div>
          <div><span className="font-semibold">GSTIN:</span> {store.gstin || '27AAAAA0000A1Z5'}</div>
          <div><span className="font-semibold">State:</span> Maharashtra (Code: 27)</div>
          <div><span className="font-semibold">Phone:</span> {store.phone || '+91 98200 12345'}</div>
          {store.email && <div><span className="font-semibold">Email:</span> {store.email}</div>}
        </div>

        {/* Invoice Meta Box */}
        <div className="border border-black p-2.5 rounded text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold">Invoice Number:</span>
            <span className="font-bold font-mono">{invoiceDetail.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Invoice Date:</span>
            <span>{formatDate(invoiceDetail.created_at, true)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Financial Year:</span>
            <span>{invoiceDetail.financial_year || '2026-27'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Payment Status:</span>
            <span className={cn(
              'uppercase font-bold',
              invoiceDetail.status === 'paid' && 'text-green-700',
              invoiceDetail.status === 'partial' && 'text-amber-700',
              invoiceDetail.status === 'pending' && 'text-red-700',
              invoiceDetail.status === 'returned' && 'text-purple-700',
              invoiceDetail.status === 'partially_returned' && 'text-purple-700'
            )}>
              {invoiceDetail.status === 'partial' ? `PARTIAL (${formatCurrency(balanceDue)} DUE)` : (invoiceDetail.status || 'PAID')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Reverse Charge:</span>
            <span>No</span>
          </div>
        </div>
      </div>

      {/* Buyer Details Grid */}
      <div className="py-2.5 border-b border-black text-[11px] bg-gray-50/70">
        <div className="font-bold text-[10px] uppercase tracking-wider text-gray-700 pb-1">
          Details of Receiver / Billed To:
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div><span className="font-semibold">Customer Name:</span> {invoiceDetail.customer_name || 'Walk-in Customer'}</div>
            <div><span className="font-semibold">Contact Mobile:</span> {invoiceDetail.customer_phone || 'N/A'}</div>
          </div>
          <div>
            <div><span className="font-semibold">Customer GSTIN:</span> {invoiceDetail.customer_gstin || 'Consumer / Unregistered'}</div>
            <div><span className="font-semibold">State of Supply:</span> Maharashtra (27)</div>
          </div>
        </div>
      </div>

      {/* GST Products & Items Table */}
      <div className="pt-3">
        <table className="w-full border-collapse border border-black text-[10.5px]">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-center font-bold">
              <th className="border border-black p-1.5 w-8">#</th>
              <th className="border border-black p-1.5 text-left">Description of Goods</th>
              <th className="border border-black p-1.5 w-16">HSN/SAC</th>
              <th className="border border-black p-1.5 w-10">Qty</th>
              <th className="border border-black p-1.5 w-20 text-right">Unit Rate (₹)</th>
              <th className="border border-black p-1.5 w-20 text-right">Taxable (₹)</th>
              <th className="border border-black p-1.5 w-18 text-right">CGST</th>
              <th className="border border-black p-1.5 w-18 text-right">SGST</th>
              <th className="border border-black p-1.5 w-22 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-black">
                <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                <td className="border border-black p-1.5">
                  <div className="font-semibold">{item.item_name}</div>
                  {item.serial_number && (
                    <div className="text-[9.5px] font-mono text-gray-700">
                      IMEI / Serial No: {item.serial_number}
                    </div>
                  )}
                </td>
                <td className="border border-black p-1.5 text-center font-mono">{item.hsn_code || '8517'}</td>
                <td className="border border-black p-1.5 text-center font-semibold">{item.quantity}</td>
                <td className="border border-black p-1.5 text-right">{formatCurrency(item.unit_price, true)}</td>
                <td className="border border-black p-1.5 text-right font-medium">
                  {formatCurrency(item.taxable_value || item.unit_price * item.quantity, true)}
                </td>
                <td className="border border-black p-1.5 text-right">
                  <div>{formatCurrency(item.cgst_amount || 0, true)}</div>
                  <div className="text-[9px] text-gray-600">{(Number(item.gst_rate ?? 18) / 2).toFixed(1)}%</div>
                </td>
                <td className="border border-black p-1.5 text-right">
                  <div>{formatCurrency(item.sgst_amount || 0, true)}</div>
                  <div className="text-[9px] text-gray-600">{(Number(item.gst_rate ?? 18) / 2).toFixed(1)}%</div>
                </td>
                <td className="border border-black p-1.5 text-right font-bold">
                  {formatCurrency(item.total_amount, true)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold bg-gray-50 border-t border-black">
              <td colSpan={3} className="border border-black p-1.5 text-right font-bold">
                Total Summary:
              </td>
              <td className="border border-black p-1.5 text-center font-bold">
                {items.reduce((acc, it) => acc + (it.quantity || 1), 0)}
              </td>
              <td className="border border-black p-1.5" />
              <td className="border border-black p-1.5 text-right font-bold">
                {formatCurrency(subtotal, true)}
              </td>
              <td className="border border-black p-1.5 text-right font-bold">
                {formatCurrency(cgstAmount, true)}
              </td>
              <td className="border border-black p-1.5 text-right font-bold">
                {formatCurrency(sgstAmount, true)}
              </td>
              <td className="border border-black p-1.5 text-right font-bold text-sm">
                {formatCurrency(grandTotal, true)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in Words & Calculation Breakdown */}
      <div className="grid grid-cols-12 border border-t-0 border-black text-[11px]">
        <div className="col-span-7 p-2.5 border-r border-black flex flex-col justify-between">
          <div>
            <div className="font-semibold text-gray-700">Invoice Amount in Words:</div>
            <div className="font-bold text-black pt-0.5">{amountToWords(grandTotal)}</div>
          </div>
          <div className="pt-3">
            <div className="font-semibold text-gray-700">Payment Breakdown:</div>
            {payments.length > 0 ? (
              payments.map((p, i) => (
                <div key={i} className="text-gray-800">
                  Paid via <span className="font-semibold uppercase">{p.payment_method}</span>: {formatCurrency(p.amount, true)}
                  {p.reference_number ? ` (Ref: ${p.reference_number})` : ''}
                </div>
              ))
            ) : (
              <div className="text-red-700 font-semibold">Payment Pending (100% Credit / Udhaar)</div>
            )}
          </div>
        </div>

        <div className="col-span-5 p-2.5 space-y-1">
          <div className="flex justify-between text-gray-700">
            <span>Taxable Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal, true)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Trade Discount:</span>
              <span className="font-medium">-{formatCurrency(discountAmount, true)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>Central GST (CGST):</span>
            <span className="font-medium">{formatCurrency(cgstAmount, true)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>State GST (SGST):</span>
            <span className="font-medium">{formatCurrency(sgstAmount, true)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1 border-t border-black text-black">
            <span>Grand Total:</span>
            <span>{formatCurrency(grandTotal, true)}</span>
          </div>
          {totalPaid < grandTotal && (
            <>
              <div className="flex justify-between text-gray-700 pt-0.5">
                <span>Amount Paid:</span>
                <span className="font-semibold text-black">{formatCurrency(totalPaid, true)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold">
                <span>Balance Due:</span>
                <span>{formatCurrency(balanceDue, true)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Terms & Signatures */}
      <div className="grid grid-cols-2 border border-t-0 border-black p-3 text-[10px]">
        <div className="space-y-1 pr-3">
          <div className="font-bold uppercase tracking-wider">Terms & Conditions:</div>
          <ol className="list-decimal pl-3 space-y-0.5 text-gray-600">
            <li>Goods once sold will not be exchanged or refunded without original tax invoice.</li>
            <li>Warranty on serialized electronics/mobiles is directly handled by authorized service centres.</li>
            <li>Star Enterprises is not liable for data loss or physical/liquid damage after purchase handover.</li>
            <li>All disputes subject to Mumbai jurisdiction only.</li>
          </ol>
        </div>
        <div className="flex flex-col justify-between items-end pl-3 text-right">
          <div className="font-semibold">
            For <span className="font-bold">{store.name || 'STAR ENTERPRISES'}</span>
          </div>
          <div className="pt-10">
            <div className="border-t border-black w-40 pt-1 text-center font-medium">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Dedicated Invoice Modal Window (Natural single scrollbar, no nested overflow) */}
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
                <h3 className="text-base sm:text-lg font-medium tracking-tight">
                  GST Tax Invoice
                </h3>
                <Badge variant="outline" className="font-mono text-xs">
                  {invoiceDetail.invoice_number}
                </Badge>
              </div>
              <div className="text-xs text-muted">
                {store.name} • {formatDate(invoiceDetail.created_at)}
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

          {/* Single Scrollable Preview Container */}
          <div className="invoice-preview-body bg-bg flex justify-center items-start">
            <div className="preview-sheet-normal">
              {invoiceDocumentNode}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface">
            <div className="text-xs text-muted">
              Official Indian GST Tax Invoice • Formatted for standard A4 paper and PDF export.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="solid" onClick={handlePrint}>
                <Printer size={15} className="mr-1.5" /> Print Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden isolated print portal mounted directly to document.body */}
      {printPortalNode &&
        createPortal(
          <div id="print-document-root">
            {invoiceDocumentNode}
          </div>,
          printPortalNode
        )}
    </>
  );
}
