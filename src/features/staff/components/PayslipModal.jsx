import { Modal, Button, Badge } from '@/shared/ui';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { Printer, CheckCircle, Clock } from 'lucide-react';
import { SITE } from '@/shared/lib/site';

export function PayslipModal({ salaryRecord, isOpen, onClose }) {
  if (!salaryRecord) return null;

  const staff = salaryRecord.staff_profiles;
  const isPaid = salaryRecord.payment_status === 'paid';

  function handlePrint() {
    window.print();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payslip: ${staff?.full_name} (${salaryRecord.month_year})`}
      className="max-w-2xl"
    >
      <div className="space-y-4 text-text min-w-0" id="printable-payslip">
        {/* Company Header */}
        <div className="p-4 rounded-xl border border-border bg-bg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-base font-medium text-text tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
              <span>STAR ENTERPRISES</span>
            </div>
            <div className="text-xs text-muted mt-0.5">{SITE.address}</div>
            <div className="text-[11px] text-muted font-mono mt-0.5">GSTIN: {SITE.gstin}</div>
          </div>
          <div className="sm:text-right">
            <Badge variant="accent" className="font-mono text-xs">
              PAYSLIP - {salaryRecord.month_year}
            </Badge>
            <div className="text-[11px] text-muted mt-1">Generated: {formatDate(new Date())}</div>
          </div>
        </div>

        {/* Employee Summary Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-surface text-xs">
          <div>
            <span className="text-muted block text-[11px]">Employee Code:</span>
            <span className="font-medium text-text font-mono">{staff?.employee_code}</span>
          </div>
          <div>
            <span className="text-muted block text-[11px]">Employee Name:</span>
            <span className="font-medium text-text">{staff?.full_name}</span>
          </div>
          <div>
            <span className="text-muted block text-[11px]">Designation:</span>
            <span className="font-medium text-text">{staff?.designation}</span>
          </div>
          <div>
            <span className="text-muted block text-[11px]">Assigned Store:</span>
            <span className="font-medium text-text">{staff?.stores?.name || 'Star Enterprises'}</span>
          </div>
        </div>

        {/* Salary Ledger Breakdown */}
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-bg border-b border-border text-muted uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 font-medium">Earnings & Allowances</th>
                <th className="p-3 font-medium text-right">Amount (₹)</th>
                <th className="p-3 font-medium border-l border-border">Deductions</th>
                <th className="p-3 font-medium text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-3">Monthly Basic Salary</td>
                <td className="p-3 text-right font-medium">{formatCurrency(salaryRecord.base_salary)}</td>
                <td className="p-3 border-l border-border">TDS / Advance Deductions</td>
                <td className="p-3 text-right font-medium">{formatCurrency(salaryRecord.deductions)}</td>
              </tr>
              <tr>
                <td className="p-3">Performance & Store Incentives</td>
                <td className="p-3 text-right font-medium">{formatCurrency(salaryRecord.allowances)}</td>
                <td className="p-3 border-l border-border">Unpaid Leave Penalties</td>
                <td className="p-3 text-right font-medium">₹0</td>
              </tr>
            </tbody>
            <tfoot className="bg-bg font-medium text-xs border-t border-border">
              <tr>
                <td className="p-3">Gross Earnings:</td>
                <td className="p-3 text-right">
                  {formatCurrency(parseFloat(salaryRecord.base_salary) + parseFloat(salaryRecord.allowances))}
                </td>
                <td className="p-3 border-l border-border">Total Deductions:</td>
                <td className="p-3 text-right text-danger">
                  {formatCurrency(salaryRecord.deductions)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Net Salary Summary */}
        <div className="p-4 rounded-xl border border-border bg-bg flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-muted">Net Disbursed Take-Home Salary:</div>
            <div className="text-2xl font-medium tracking-tight text-text">
              {formatCurrency(salaryRecord.net_salary)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPaid ? (
              <Badge variant="success" className="text-xs gap-1.5 py-1 px-3">
                <CheckCircle size={14} /> Paid via {salaryRecord.payment_method?.toUpperCase()}
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs gap-1.5 py-1 px-3">
                <Clock size={14} /> Payment Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Payment Reference & Bank Account */}
        <div className="text-xs text-muted space-y-1">
          {salaryRecord.transaction_ref && (
            <div>Transaction Reference: <span className="font-mono text-text">{salaryRecord.transaction_ref}</span></div>
          )}
          {staff?.bank_name && (
            <div>Bank Account: {staff.bank_name} • A/C: {staff.account_number || 'Registered'}</div>
          )}
          {salaryRecord.notes && (
            <div>Remarks: <span className="text-text italic">{salaryRecord.notes}</span></div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-border flex justify-end gap-2 no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="solid" onClick={handlePrint} className="gap-2">
            <Printer size={15} /> Print Payslip
          </Button>
        </div>
      </div>
    </Modal>
  );
}
