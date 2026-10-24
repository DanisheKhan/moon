import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStores } from '@/features/stores';
import { useInvoices, useInvoiceDetail, InvoicePrintModal } from '@/features/billing';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  Plus,
  Store,
  ExternalLink,
  Smartphone,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export function BillingConsolePage() {
  const navigate = useNavigate();
  const { data: stores = [] } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const { data: invoices = [], isLoading } = useInvoices(selectedStoreId || stores[0]?.id);
  const { data: invoiceDetail } = useInvoiceDetail(selectedInvoiceId);

  const filteredInvoices = invoices.filter((inv) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.customer_phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">
            POS & CASH REGISTER
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Billing & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Select store terminal to launch live point of sale billing, print receipts, and track daily sales collections.
          </p>
        </div>

        {stores[0] && (
          <button
            type="button"
            onClick={() => navigate(`/admin/${stores[0].code}/billing`)}
            className="inline-flex items-center gap-2 bg-text text-bg hover:opacity-90 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <Plus size={16} />
            <span>+ Open POS Terminal</span>
          </button>
        )}
      </div>

      {/* Store POS Terminal Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((s) => (
          <div
            key={s.id}
            onClick={() => navigate(`/admin/${s.code}/billing`)}
            className="p-5 rounded-2xl border border-border bg-surface hover:border-text/30 transition-all cursor-pointer space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-text">
                {s.code === 'mobiles' ? <Smartphone size={18} /> : <Store size={18} />}
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pastel-mint text-pastel-mint-text border border-pastel-mint-border">
                ONLINE
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-text">{s.name}</h3>
              <p className="text-xs text-muted font-mono mt-0.5">GSTIN: {s.gstin}</p>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-semibold text-text">
              <span>Prefix: {s.invoice_prefix}</span>
              <span className="inline-flex items-center gap-1 text-bg bg-text px-2.5 py-1 rounded-md text-[11px] font-bold">
                Launch POS <ExternalLink size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Invoices Register Section */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden space-y-4 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-text">Recent Sales Invoices</h2>
            <p className="text-xs text-muted">
              Live electronic invoices generated across selected branch terminal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-bg text-text outline-none"
            >
              <option value="">All Branches</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search invoice, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-bg text-text outline-none focus:border-text"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted text-xs">Loading invoice register...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border rounded-xl text-muted text-xs">
            No invoices recorded for this branch. Launch the POS terminal above to create your first bill.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg/40 border-b border-border text-muted font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Invoice Number</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Subtotal</th>
                  <th className="py-3 px-3">Tax (GST)</th>
                  <th className="py-3 px-3">Grand Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-text">{inv.invoice_number}</td>
                    <td className="py-3 px-3 text-muted">{formatDate(inv.created_at)}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-text">{inv.customer_name}</div>
                      <div className="text-[10px] text-muted">{inv.customer_phone}</div>
                    </td>
                    <td className="py-3 px-3 text-muted">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-3 text-muted">
                      {formatCurrency((inv.cgst_amount || 0) + (inv.sgst_amount || 0))}
                    </td>
                    <td className="py-3 px-3 font-bold text-text">{formatCurrency(inv.grand_total)}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pastel-mint text-pastel-mint-text border border-pastel-mint-border">
                        <CheckCircle2 size={10} /> {inv.status?.toUpperCase() || 'PAID'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-bg hover:bg-surface text-text text-xs font-semibold cursor-pointer"
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail & Print Modal */}
      {selectedInvoiceId && (
        <InvoicePrintModal
          isOpen={Boolean(selectedInvoiceId)}
          onClose={() => setSelectedInvoiceId(null)}
          invoiceDetail={invoiceDetail}
        />
      )}
    </div>
  );
}
