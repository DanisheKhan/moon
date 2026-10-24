import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Button,
  Card,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/shared/ui';
import { useInvoices, useInvoiceDetail } from '../hooks/useBilling';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { Eye } from 'lucide-react';

export function InvoicesListPage() {
  const { store } = useOutletContext();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const { data: invoices = [], isLoading } = useInvoices(store?.id);
  const { data: invoiceDetail } = useInvoiceDetail(selectedInvoiceId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-text">
            {store?.name} Sales Invoices
          </h1>
          <p className="text-sm text-muted">
            GST compliant sales register, payment modes, and reprint capabilities.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted">Loading invoice register...</div>
      ) : invoices.length === 0 ? (
        <Card className="p-8 text-center text-muted border-dashed">
          No invoices generated yet for this store.
        </Card>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Invoice Number</TableHeaderCell>
              <TableHeaderCell>Date & Time</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Taxable Value</TableHeaderCell>
              <TableHeaderCell>Total GST</TableHeaderCell>
              <TableHeaderCell>Grand Total</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs font-medium whitespace-nowrap">
                  {inv.invoice_number}
                </TableCell>
                <TableCell className="text-xs text-muted whitespace-nowrap">
                  {formatDate(inv.created_at)}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-text truncate max-w-48 leading-tight" title={inv.customer_name}>
                    {inv.customer_name}
                  </div>
                  {inv.customer_phone && (
                    <div className="text-xs text-muted truncate max-w-48 leading-tight" title={inv.customer_phone}>
                      {inv.customer_phone}
                    </div>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatCurrency(inv.subtotal)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatCurrency((inv.cgst_amount || 0) + (inv.sgst_amount || 0))}
                </TableCell>
                <TableCell className="font-medium text-text whitespace-nowrap">
                  {formatCurrency(inv.grand_total)}
                </TableCell>
                <TableCell>
                  <Badge variant={inv.status === 'paid' ? 'success' : 'danger'} className="h-5">
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end h-8">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 py-1 px-2.5 inline-flex items-center gap-1.5 cursor-pointer"
                      onClick={() => setSelectedInvoiceId(inv.id)}
                    >
                      <Eye size={14} /> View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Invoice Detail & Print Modal (GST Tax Invoice) */}
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
