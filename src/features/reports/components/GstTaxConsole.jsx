import { formatCurrency } from '@/shared/lib/format';
import {
  Receipt,
  Download,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export function GstTaxConsole({ gstCompliance = {}, dateRange = 'month' }) {
  const slabs = gstCompliance.slabs || [];
  const b2b = gstCompliance.b2b || { count: 0, taxable: 0, tax: 0, total: 0 };
  const b2c = gstCompliance.b2c || { count: 0, taxable: 0, tax: 0, total: 0 };
  const gstr1Rows = gstCompliance.gstr1Rows || [];

  const totalTaxable = slabs.reduce((acc, s) => acc + s.taxable, 0);
  const totalCgst = slabs.reduce((acc, s) => acc + s.cgst, 0);
  const totalSgst = slabs.reduce((acc, s) => acc + s.sgst, 0);
  const totalIgst = slabs.reduce((acc, s) => acc + s.igst, 0);
  const totalTax = totalCgst + totalSgst + totalIgst;
  const totalValue = slabs.reduce((acc, s) => acc + s.totalValue, 0);

  const handleExportCsv = () => {
    if (!gstr1Rows || gstr1Rows.length === 0) return;

    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Store Branch',
      'Customer Name',
      'Customer Phone',
      'Customer GSTIN',
      'Place of Supply',
      'Taxable Value (INR)',
      'CGST Amount (INR)',
      'SGST Amount (INR)',
      'IGST Amount (INR)',
      'Grand Total (INR)',
      'Invoice Status',
    ];

    const csvContent = [
      headers.join(','),
      ...gstr1Rows.map((r) =>
        [
          `"${r.invoiceNumber}"`,
          `"${r.invoiceDate}"`,
          `"${r.storeName}"`,
          `"${r.customerName}"`,
          `"${r.customerPhone}"`,
          `"${r.customerGstin}"`,
          `"${r.placeOfSupply}"`,
          r.taxableValue,
          r.cgstAmount,
          r.sgstAmount,
          r.igstAmount,
          r.grandTotal,
          `"${r.status}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Star_Enterprises_GSTR1_Sales_Register_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & 1-Click CA Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
            <Receipt size={17} className="text-brand-sage" />
            Indian GST Compliance & Sales Register (GSTR-1 Ready)
          </h2>
          <p className="text-xs text-muted">
            Official tax matrix segmented by CGST, SGST, IGST, and HSN tax rates for CA audit and monthly filing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-sage text-white hover:bg-brand-sage-hover text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0 select-none"
        >
          <Download size={14} />
          <span>Download GSTR-1 Sales Register (CSV)</span>
        </button>
      </div>

      {/* B2B vs B2C Split Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* B2B Tax Invoices */}
        <div className="p-4 sm:p-5 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800">
              <Building2 size={15} />
              <span>B2B Invoices (With Customer GSTIN)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-700 border border-blue-500/30">
              {b2b.count} Invoices
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-500/20 text-xs">
            <div>
              <span className="text-[10px] text-muted block">Taxable Value</span>
              <span className="font-bold font-mono text-text">{formatCurrency(b2b.taxable)}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">GST Value</span>
              <span className="font-bold font-mono text-blue-700">{formatCurrency(b2b.tax)}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Total Billed</span>
              <span className="font-bold font-mono text-text">{formatCurrency(b2b.total)}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted pt-1">
            Eligible for Input Tax Credit (ITC) claiming by business buyers.
          </p>
        </div>

        {/* B2C Retail Bills */}
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-text">
              <Users size={15} className="text-muted" />
              <span>B2C Small Retail Invoices (Consumer Walk-ins)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-bg border border-border text-muted">
              {b2c.count} Invoices
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-xs">
            <div>
              <span className="text-[10px] text-muted block">Taxable Value</span>
              <span className="font-bold font-mono text-text">{formatCurrency(b2c.taxable)}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">GST Value</span>
              <span className="font-bold font-mono text-brand-sage">{formatCurrency(b2c.tax)}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Total Billed</span>
              <span className="font-bold font-mono text-text">{formatCurrency(b2c.total)}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted pt-1">
            Aggregated under Table 7 of GSTR-1 (B2C Others - Maharashtra intra-state).
          </p>
        </div>
      </div>

      {/* Tax Slabs Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-border bg-bg/40 flex items-center justify-between">
          <div className="text-xs font-semibold text-text uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={14} className="text-brand-sage" />
            <span>HSN Tax Slab Distribution Matrix</span>
          </div>
          <span className="text-[11px] text-muted font-mono">
            HSN-Wise Sales Summary
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/60 border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider">
              <tr className="h-11">
                <th className="px-4 py-0 align-middle">GST Rate & Category</th>
                <th className="px-4 py-0 align-middle text-center">Items Sold</th>
                <th className="px-4 py-0 align-middle text-right">Taxable Value (₹)</th>
                <th className="px-4 py-0 align-middle text-right">CGST (Central)</th>
                <th className="px-4 py-0 align-middle text-right">SGST (State)</th>
                <th className="px-4 py-0 align-middle text-right">Total Tax (₹)</th>
                <th className="px-4 py-0 align-middle text-right">Gross Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {slabs.map((slab) => (
                <tr key={slab.rate} className="h-13 min-h-13 hover:bg-bg/40 transition-colors">
                  <td className="px-4 py-2 align-middle">
                    <div className="font-semibold text-text">{slab.label}</div>
                    <div className="text-[10px] text-muted font-mono">{slab.rate}% Statutory Rate</div>
                  </td>
                  <td className="px-4 py-2 align-middle text-center font-mono text-text">
                    {slab.itemCount} units
                  </td>
                  <td className="px-4 py-2 align-middle text-right font-mono font-medium text-text">
                    {formatCurrency(slab.taxable)}
                  </td>
                  <td className="px-4 py-2 align-middle text-right font-mono text-muted">
                    {formatCurrency(slab.cgst)}
                  </td>
                  <td className="px-4 py-2 align-middle text-right font-mono text-muted">
                    {formatCurrency(slab.sgst)}
                  </td>
                  <td className="px-4 py-2 align-middle text-right font-mono font-semibold text-brand-sage">
                    {formatCurrency(slab.totalTax)}
                  </td>
                  <td className="px-4 py-2 align-middle text-right font-mono font-bold text-text">
                    {formatCurrency(slab.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Consolidated Total Row */}
            <tfoot className="bg-bg/60 border-t border-border font-semibold text-text">
              <tr className="h-13 min-h-13">
                <td className="px-4 py-2 align-middle uppercase text-[11px] tracking-wider">
                  Consolidated Tax Total
                </td>
                <td className="px-4 py-2 align-middle text-center font-mono">
                  {slabs.reduce((acc, s) => acc + s.itemCount, 0)} units
                </td>
                <td className="px-4 py-2 align-middle text-right font-mono font-bold">
                  {formatCurrency(totalTaxable)}
                </td>
                <td className="px-4 py-2 align-middle text-right font-mono">
                  {formatCurrency(totalCgst)}
                </td>
                <td className="px-4 py-2 align-middle text-right font-mono">
                  {formatCurrency(totalSgst)}
                </td>
                <td className="px-4 py-2 align-middle text-right font-mono font-bold text-brand-sage">
                  {formatCurrency(totalTax)}
                </td>
                <td className="px-4 py-2 align-middle text-right font-mono font-extrabold text-text">
                  {formatCurrency(totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* CA Audit Note */}
      <div className="p-3.5 rounded-lg border border-border bg-bg/40 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-brand-sage shrink-0" />
          <span>
            Maharashtra State Code: <strong>27</strong> • Dual GST split into equal CGST (50%) & SGST (50%)
          </span>
        </div>
        <span className="font-mono text-[11px]">Ready for GSTR-1 & GSTR-3B Reconciliation</span>
      </div>
    </div>
  );
}
