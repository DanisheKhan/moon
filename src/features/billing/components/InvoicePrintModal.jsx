import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/ui';
import { formatCurrency, formatDate, amountToWords } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Printer, X } from 'lucide-react';

function WhatsAppIcon({ size = 14, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Resolves standard or item-specific warranty coverage text
 */
function resolveItemWarranty(item) {
  if (item.warranty) return item.warranty;
  if (item.product_units?.warranty_months) {
    return `${item.product_units.warranty_months} Months Store Warranty`;
  }
  if (item.products?.specs?.warranty) {
    return item.products.specs.warranty;
  }
  const name = (item.item_name || item.name || '').toLowerCase();
  if (name.includes('iphone') || name.includes('apple')) {
    return '1 Year Official Apple India Warranty';
  }
  if (name.includes('samsung') || name.includes('galaxy')) {
    return '1 Year Official Samsung Warranty';
  }
  if (name.includes('tv') || name.includes('bravia') || name.includes('sony')) {
    return '2 Years Brand Comprehensive';
  }
  if (name.includes('refrigerator') || name.includes('fridge') || name.includes('washing machine')) {
    return '2 Yrs Comprehensive + 10 Yrs Motor';
  }
  if (name.includes('sofa') || name.includes('recliner') || name.includes('furniture') || name.includes('desk') || name.includes('chair')) {
    return '3 Years Frame & Structural Warranty';
  }
  return '1 Year Official Brand Warranty';
}

/**
 * InvoicePrintModal renders the official standard A4 GST Tax Invoice.
 * Designed with timeless, classic typography, minimal layout, proper branding,
 * and comprehensive warranty & statutory GST Rule 46 compliance.
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
  const returns = invoiceDetail.returns || [];

  const grandTotal = Math.round(Number(invoiceDetail.grand_total || 0));
  const subtotal = Math.round(Number(invoiceDetail.subtotal || 0));
  const cgstAmount = Math.round(Number(invoiceDetail.cgst_amount || 0));
  const sgstAmount = Math.round(Number(invoiceDetail.sgst_amount || 0));
  const igstAmount = Math.round(Number(invoiceDetail.igst_amount || 0));
  const discountAmount = Math.round(Number(invoiceDetail.discount_amount || 0));
  const totalPaid = Math.round(payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0));
  const balanceDue = Math.round(Math.max(grandTotal - totalPaid, 0));

  const gstin = store.gstin || '27AAAAA0000A1Z5';
  const pan = gstin && gstin.length >= 12 ? gstin.substring(2, 12) : null;

  const isReturned = invoiceDetail.status === 'returned';
  const isPartReturned = invoiceDetail.status === 'partially_returned';

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

  function handleShareWhatsApp() {
    const isDue = balanceDue > 0.01;
    const storeName = store.name || 'Star Enterprises';
    const storePhone = store.phone || '+91 93700 11653';
    const customerName = invoiceDetail.customer_name?.trim() || 'Valued Customer';
    const purchaseDate = invoiceDetail.created_at
      ? formatDate(invoiceDetail.created_at, false)
      : 'Recent Purchase';

    const itemsList =
      Array.isArray(items) && items.length > 0
        ? items
            .slice(0, 3)
            .map((it) => `• ${it.item_name || 'Product'} (Qty: ${it.quantity || 1})`)
            .join('\n')
        : '• Purchased Store Goods';

    let message = '';
    if (isDue) {
      message = `*PAYMENT REMINDER - ${storeName.toUpperCase()}*
----------------------------------------
*Dear ${customerName},*
This is a gentle reminder regarding the outstanding balance for your purchase invoice:

*Invoice No:* #${invoiceDetail.invoice_number}
*Date of Purchase:* ${purchaseDate}
*Items Purchased:*
${itemsList}

*Total Bill Amount:* ${formatCurrency(grandTotal)}
*Amount Received:* ${formatCurrency(totalPaid)}
----------------------------------------
*REMAINING AMOUNT DUE:* ${formatCurrency(balanceDue)}
----------------------------------------
Kindly arrange payment clearance to ${storeName} at your earliest convenience.

*Pay To:* ${storeName}
*Store Contact:* ${storePhone}

Thank you for your business!`;
    } else {
      message = `*TAX INVOICE RECEIPT - ${storeName.toUpperCase()}*
----------------------------------------
*Dear ${customerName},*
Thank you for your purchase with ${storeName}!

*Invoice No:* #${invoiceDetail.invoice_number}
*Date of Purchase:* ${purchaseDate}
*Items Purchased:*
${itemsList}

*Total Bill Amount:* ${formatCurrency(grandTotal)}
*Amount Paid:* ${formatCurrency(totalPaid)}
*Payment Status:* Fully Settled / Paid
----------------------------------------
*Store:* ${storeName}
*Store Contact:* ${storePhone}

We appreciate your business and look forward to serving you again!`;
    }

    const cleanPhone = (invoiceDetail.customer_phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encoded = encodeURIComponent(message);
    const url = phoneWithCountry
      ? `https://wa.me/${phoneWithCountry}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* ------------------------------------------------------------- */
  /* PRINTABLE DOCUMENT NODE                                       */
  /* ------------------------------------------------------------- */
  const invoiceDocumentNode = (
    <div className="bill-container-normal p-6 sm:p-8 bg-white text-slate-900 font-sans text-[11px] leading-relaxed">
      {/* 1. Clean Classic Masthead with Brand Designation */}
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
            {store.name || 'Star Furniture & Electronics'}
          </div>
          <div className="text-[10px] text-slate-600 font-medium">
            Consumer Electronics • Furniture • Mobiles • Smart Appliances
          </div>
        </div>

        {/* Right: Legal Tax Invoice Designation */}
        <div className="text-left sm:text-right">
          <div className="inline-block px-2.5 py-0.5 rounded border border-slate-900 bg-slate-900 text-white font-mono text-[9.5px] uppercase tracking-wider font-semibold">
            Original For Recipient
          </div>
          <div className="text-lg font-extrabold tracking-tight uppercase text-slate-950 mt-1">
            GST TAX INVOICE
          </div>
          <div className="text-[10px] text-slate-600 font-medium">
            Issued under Rule 46 of CGST Rules, 2017
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Place of Supply: Maharashtra (State Code 27)
          </div>
        </div>
      </div>

      {/* 2. Business Entity Cards (Billed By vs Billed To) */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-900 text-[11px]">
        {/* Supplier / Seller (Billed By) */}
        <div className="space-y-0.5 pr-3 border-r border-slate-300">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Billed By / Supplier (Consignor):
          </div>
          <div className="font-bold text-sm tracking-wide text-slate-950">
            {store.name || 'STAR ENTERPRISES'}
          </div>
          <div className="text-slate-800">
            {store.address_line1 || 'Shop 102, Main Road Market'}, {store.city || 'Mumbai'}
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
              <span className="font-mono">{store.phone || '+91 98200 12346'}</span>
            </div>
          </div>
          {store.email && (
            <div>
              <span className="font-semibold text-slate-900">Email:</span> {store.email}
            </div>
          )}
        </div>

        {/* Recipient / Customer (Billed To) */}
        <div className="space-y-0.5 pl-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Details of Receiver / Billed To:
          </div>
          <div className="font-bold text-sm tracking-wide text-slate-950">
            {invoiceDetail.customer_name || 'Walk-in Customer'}
          </div>
          {invoiceDetail.customer_phone && (
            <div>
              <span className="font-semibold text-slate-900">Mobile Phone:</span>{' '}
              <span className="font-mono">{invoiceDetail.customer_phone}</span>
            </div>
          )}
          <div>
            <span className="font-semibold text-slate-900">Customer GSTIN:</span>{' '}
            <span className="font-mono font-bold">
              {invoiceDetail.customer_gstin || 'Consumer / Unregistered Person'}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">State of Supply:</span> Maharashtra (Code: 27)
            </div>
            <div>
              <span className="font-semibold text-slate-900">Counter Sale:</span> Walk-in Handover
            </div>
          </div>
        </div>
      </div>

      {/* 3. Invoice Metadata Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2.5 px-3 border-b border-slate-900 text-[11px] bg-slate-50/90">
        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
            Tax Invoice Number:
          </span>
          <span className="font-mono font-bold text-slate-950 text-xs">
            #{invoiceDetail.invoice_number}
          </span>
        </div>

        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
            Invoice Date & Time:
          </span>
          <span className="font-semibold text-slate-950">
            {formatDate(invoiceDetail.created_at, true)}
          </span>
        </div>

        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
            Financial Year & Terms:
          </span>
          <span className="font-medium text-slate-900">
            FY {invoiceDetail.financial_year || '2026-27'} • RCM: No
          </span>
        </div>

        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
            Settlement Status:
          </span>
          <span
            className={cn(
              'font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border inline-block font-mono',
              isReturned || isPartReturned
                ? 'bg-purple-100 text-purple-900 border-purple-400'
                : balanceDue <= 0.01
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                : totalPaid > 0
                ? 'bg-amber-100 text-amber-900 border-amber-400'
                : 'bg-red-100 text-red-900 border-red-400'
            )}
          >
            {isReturned
              ? 'RETURNED'
              : isPartReturned
              ? 'PART RETURN'
              : balanceDue <= 0.01
              ? 'PAID / SETTLED'
              : `PARTIAL (${formatCurrency(balanceDue)} DUE)`}
          </span>
        </div>
      </div>

      {/* 4. Itemized Goods & Services Table */}
      <div className="pt-3">
        <table className="w-full border-collapse border border-slate-900 text-[10.5px]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900 text-center font-bold text-slate-900">
              <th className="border border-slate-900 p-2 w-8">#</th>
              <th className="border border-slate-900 p-2 text-left">Description of Goods & Services</th>
              <th className="border border-slate-900 p-2 w-16 text-center">HSN/SAC</th>
              <th className="border border-slate-900 p-2 w-10 text-center">Qty</th>
              <th className="border border-slate-900 p-2 w-20 text-right">Unit Rate (₹)</th>
              <th className="border border-slate-900 p-2 w-20 text-right">Taxable (₹)</th>
              <th className="border border-slate-900 p-2 w-18 text-right">CGST</th>
              <th className="border border-slate-900 p-2 w-18 text-right">SGST</th>
              <th className="border border-slate-900 p-2 w-24 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = Number(item.quantity) || 1;
              const rate = Number(item.unit_price) || 0;
              const gstRate = Number(item.gst_rate ?? 18);
              const halfRate = (gstRate / 2).toFixed(1);
              const taxable = item.taxable_value != null ? Number(item.taxable_value) : rate * qty;
              const cgst = item.cgst_amount != null ? Number(item.cgst_amount) : Math.round(taxable * (gstRate / 200));
              const sgst = item.sgst_amount != null ? Number(item.sgst_amount) : Math.round(taxable * (gstRate / 200));
              const total = item.total_amount != null ? Number(item.total_amount) : taxable + cgst + sgst;
              const itemWarranty = resolveItemWarranty(item);

              return (
                <tr key={idx} className="border-b border-slate-900">
                  <td className="border border-slate-900 p-2 text-center text-slate-600">{idx + 1}</td>
                  <td className="border border-slate-900 p-2">
                    <div className="font-bold text-slate-950">{item.item_name}</div>
                    <div className="text-[9.5px] font-mono text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2">
                      {item.serial_number && <span>IMEI/Serial: {item.serial_number}</span>}
                      {item.serial_number && <span>•</span>}
                      <span className="text-slate-800 font-sans font-medium">
                        Warranty: {itemWarranty}
                      </span>
                    </div>
                  </td>
                  <td className="border border-slate-900 p-2 text-center font-mono text-slate-700">
                    {item.hsn_code || '8517'}
                  </td>
                  <td className="border border-slate-900 p-2 text-center font-semibold text-slate-950">
                    {qty}
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                    {formatCurrency(rate, true)}
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                    {formatCurrency(taxable, true)}
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono tabular-nums text-[9.5px]">
                    <div>{formatCurrency(cgst, true)}</div>
                    <div className="text-slate-500 font-sans">{halfRate}%</div>
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-mono tabular-nums text-[9.5px]">
                    <div>{formatCurrency(sgst, true)}</div>
                    <div className="text-slate-500 font-sans">{halfRate}%</div>
                  </td>
                  <td className="border border-slate-900 p-2 text-right font-bold font-mono tabular-nums text-slate-950">
                    {formatCurrency(total, true)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-900 font-bold text-slate-950">
              <td colSpan={3} className="border border-slate-900 p-2 text-right uppercase tracking-wider text-[10px]">
                Total Summary:
              </td>
              <td className="border border-slate-900 p-2 text-center font-mono">
                {items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)}
              </td>
              <td className="border border-slate-900 p-2" />
              <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                {formatCurrency(subtotal, true)}
              </td>
              <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                {formatCurrency(cgstAmount, true)}
              </td>
              <td className="border border-slate-900 p-2 text-right font-mono tabular-nums">
                {formatCurrency(sgstAmount, true)}
              </td>
              <td className="border border-slate-900 p-2 text-right font-mono tabular-nums text-sm font-extrabold">
                {formatCurrency(grandTotal, true)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Financial Ledger & Warranty (Left 7 Cols) vs Totals (Right 5 Cols) */}
      <div className="grid grid-cols-12 border border-t-0 border-slate-900 text-[11px]">
        {/* Left: Words, Payments, Returns, Warranty Coverage Card */}
        <div className="col-span-7 p-3 border-r border-slate-900 space-y-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Invoice Amount in Words:
            </div>
            <div className="font-semibold text-slate-950 italic pt-0.5 text-xs">
              {amountToWords(grandTotal)}
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-1">
              Payment & Settlement Breakdown:
            </div>
            {payments.length > 0 ? (
              <div className="space-y-0.5">
                {payments.map((p, i) => (
                  <div key={i} className="flex justify-between font-mono text-slate-800 text-[10.5px]">
                    <span>
                      Received via <strong className="uppercase font-sans font-bold">{p.payment_method}</strong>
                      {p.reference_number ? ` (Ref: ${p.reference_number})` : ''}
                    </span>
                    <span className="font-bold">{formatCurrency(p.amount, true)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-red-700 font-semibold text-xs">
                Payment Pending (100% Credit / Udhaar)
              </div>
            )}
          </div>

          {/* Return & Deduction Telemetry (if returns exist) */}
          {returns.length > 0 && (
            <div className="pt-2 border-t border-slate-200 text-[10px]">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-purple-900 pb-1">
                Sales Return & Deduction Telemetry:
              </div>
              <div className="space-y-1">
                {returns.map((ret) => (
                  <div key={ret.id} className="p-1.5 rounded bg-purple-50/70 border border-purple-200 font-mono text-[10px]">
                    <div className="flex justify-between font-bold text-slate-950">
                      <span>Voucher #{ret.return_number}</span>
                      <span>Net Refund: {formatCurrency(ret.refund_amount, true)}</span>
                    </div>
                    <div className="text-slate-600 font-sans mt-0.5 flex items-center justify-between">
                      <span>Gross Value: {formatCurrency(ret.gross_amount || ret.refund_amount, true)}</span>
                      {Number(ret.deduction_amount) > 0 && (
                        <span className="text-amber-800 font-semibold font-mono">
                          Less Deduction ({ret.deduction_reason || 'Fee'}): -{formatCurrency(ret.deduction_amount, true)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Warranty & Guarantee Coverage Card */}
          <div className="pt-2 border-t border-slate-200 p-2.5 rounded border border-slate-200 bg-slate-50/70 space-y-1.5 text-[10.5px]">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                Product Warranty & Assurance Coverage:
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                100% GENUINE WARRANTY
              </span>
            </div>

            <div className="space-y-1">
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-baseline font-mono text-[10px]">
                  <span className="font-sans font-medium text-slate-900 truncate max-w-60">
                    {it.item_name}
                  </span>
                  <span className="font-bold text-slate-950 shrink-0 ml-2">
                    {resolveItemWarranty(it)}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-200 flex items-center justify-between">
              <span>Warranty Active From: {formatDate(invoiceDetail.created_at, false)}</span>
              <span>Store Support: {store.phone || '+91 98200 12346'}</span>
            </div>
          </div>
        </div>

        {/* Right: Calculations Summary Ledger */}
        <div className="col-span-5 p-3 space-y-1.5">
          <div className="flex justify-between text-slate-700">
            <span>Taxable Subtotal:</span>
            <span className="font-mono tabular-nums">{formatCurrency(subtotal, true)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>Trade Discount:</span>
              <span className="font-mono tabular-nums text-emerald-700">
                -{formatCurrency(discountAmount, true)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-slate-700">
            <span>Central GST (CGST):</span>
            <span className="font-mono tabular-nums">{formatCurrency(cgstAmount, true)}</span>
          </div>

          <div className="flex justify-between text-slate-700">
            <span>State GST (SGST):</span>
            <span className="font-mono tabular-nums">{formatCurrency(sgstAmount, true)}</span>
          </div>

          {igstAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>Integrated GST (IGST):</span>
              <span className="font-mono tabular-nums">{formatCurrency(igstAmount, true)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-base pt-1.5 border-t-2 border-slate-900 text-slate-950">
            <span>Grand Total:</span>
            <span className="font-mono tabular-nums font-extrabold">{formatCurrency(grandTotal, true)}</span>
          </div>

          <div className="flex justify-between text-slate-700 pt-0.5">
            <span>Amount Paid:</span>
            <span className="font-mono tabular-nums font-bold text-slate-950">
              {formatCurrency(totalPaid, true)}
            </span>
          </div>

          <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
            <span>Balance Due:</span>
            <span
              className={cn(
                'font-mono tabular-nums',
                balanceDue > 0 ? 'text-red-700 text-sm' : 'text-emerald-700'
              )}
            >
              {balanceDue > 0 ? formatCurrency(balanceDue, true) : '₹0 (Fully Settled)'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Legal Terms & Symmetrical Dual Signatures */}
      <div className="grid grid-cols-2 border border-t-0 border-slate-900 p-3 text-[10px]">
        {/* Left: Terms and Customer Acknowledgment */}
        <div className="space-y-1.5 pr-3 border-r border-slate-300">
          <div className="font-bold uppercase tracking-wider text-slate-900">Terms & Conditions:</div>
          <ol className="list-decimal pl-3 space-y-0.5 text-slate-600 leading-snug">
            <li>Goods once sold will not be returned or exchanged without original tax invoice.</li>
            <li>Warranty on electronics and mobiles is handled directly by authorized brand service centres.</li>
            <li>Star Enterprises is not liable for data loss or physical/liquid damage post delivery.</li>
            <li>All disputes subject to Mumbai / Bhusawal jurisdiction only.</li>
          </ol>
          <div className="pt-6">
            <div className="border-t border-slate-400 w-44 pt-1 text-center text-slate-700 font-medium">
              Customer / Receiver Signature
            </div>
          </div>
        </div>

        {/* Right: Seller Authorized Signatory */}
        <div className="flex flex-col justify-between items-end pl-3 text-right">
          <div>
            <div className="font-semibold text-slate-800">
              For <span className="font-bold text-slate-950">{store.name || 'STAR ENTERPRISES'}</span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
              Authorized Signatory & Seal
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
                  GST Tax Invoice
                </h3>
                <span className="px-2 py-0.5 rounded border border-border bg-surface-subtle font-mono text-xs font-semibold text-text">
                  #{invoiceDetail.invoice_number}
                </span>
              </div>
              <div className="text-xs text-muted">
                {store.name} • {formatDate(invoiceDetail.created_at, true)}
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
              <Button
                variant="outline"
                onClick={handleShareWhatsApp}
                className={cn(
                  'gap-1.5 cursor-pointer font-medium',
                  balanceDue > 0.01
                    ? 'text-emerald-700 border-emerald-400 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-500'
                    : 'text-emerald-700 border-border hover:bg-emerald-50 hover:border-emerald-300'
                )}
                title={
                  balanceDue > 0.01
                    ? `Send WhatsApp Payment Reminder (Due: ${formatCurrency(balanceDue)})`
                    : 'Send Invoice on WhatsApp'
                }
              >
                <WhatsAppIcon size={15} />
                <span>{balanceDue > 0.01 ? 'Remind on WhatsApp' : 'WhatsApp'}</span>
              </Button>
              <Button variant="solid" onClick={handlePrint} className="gap-1.5">
                <Printer size={15} />
                <span>Print Invoice</span>
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
