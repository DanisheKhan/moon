import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/shared/ui';
import { useGrantStaffLeave } from '../hooks/useStaff';
import { formatCurrency } from '@/shared/lib/format';
import { getErrorMessage } from '@/shared/lib/errors';
import { IndianRupee, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * GrantLeaveModal allows the store owner to grant leave (e.g. 15-20 days)
 * to any staff member, with live per-day cost and automatic salary deduction.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {Array} props.staffList
 * @param {Object} [props.defaultStaff]
 */
export function GrantLeaveModal({ isOpen, onClose, staffList = [], defaultStaff = null }) {
  const grantLeaveMutation = useGrantStaffLeave();

  const [internalStaffId, setInternalStaffId] = useState('');
  const [leaveType, setLeaveType] = useState('unpaid'); // 'unpaid' | 'extended' | 'paid' | 'sick'
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const f = new Date();
    f.setDate(f.getDate() + 14);
    return f.toISOString().split('T')[0];
  });
  const [totalDays, setTotalDays] = useState('15');
  const [deductSalary, setDeductSalary] = useState(true);
  const [reason, setReason] = useState('');
  const [payrollMonth] = useState('2026-10');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const selectedStaffId = internalStaffId || defaultStaff?.id || staffList[0]?.id || '';
  const setSelectedStaffId = setInternalStaffId;
  const activeStaff = staffList.find((s) => s.id === selectedStaffId) || defaultStaff || staffList[0];

  // Auto-calculate end date when totalDays is entered
  function handleDaysChange(val) {
    const days = parseInt(val, 10);
    setTotalDays(val);
    if (!isNaN(days) && days > 0 && startDate) {
      const s = new Date(startDate);
      s.setDate(s.getDate() + days - 1);
      setEndDate(s.toISOString().split('T')[0]);
    }
  }

  // Auto-calculate total days when dates change
  function handleDateChange(newStart, newEnd) {
    setStartDate(newStart);
    setEndDate(newEnd);
    if (newStart && newEnd) {
      const s = new Date(newStart);
      const e = new Date(newEnd);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        setTotalDays(String(diffDays));
      }
    }
  }

  // Financial calculations
  const baseSalary = Number(activeStaff?.base_salary || 0);
  const dailyCost = Math.round(baseSalary / 30);
  const numDays = Math.max(0, parseInt(totalDays, 10) || 0);
  const calculatedDeduction = deductSalary ? dailyCost * numDays : 0;
  const estimatedNetSalary = Math.max(0, baseSalary - calculatedDeduction);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedStaffId) {
      setError('Please select an employee.');
      return;
    }
    if (numDays <= 0) {
      setError('Please specify a valid number of leave days.');
      return;
    }

    setError('');
    setSuccessMsg('');

    try {
      await grantLeaveMutation.mutateAsync({
        staffId: selectedStaffId,
        leaveType,
        startDate,
        endDate,
        totalDays: numDays,
        reason: reason.trim() || `Owner granted ${numDays} days ${leaveType} leave`,
        deductSalary,
        monthYear: payrollMonth,
        reviewerName: 'Store Owner',
      });

      setSuccessMsg(`Successfully granted ${numDays} days leave. Payroll deduction of ${formatCurrency(calculatedDeduction)} applied.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const staffOptions = staffList.map((s) => ({
    value: s.id,
    label: `${s.full_name} (${s.employee_code}) • Base: ${formatCurrency(s.base_salary)} (${formatCurrency(Math.round(Number(s.base_salary || 0) / 30))}/day)`,
  }));

  const leaveTypeOptions = [
    { value: 'unpaid', label: 'Unpaid Leave (Loss of Pay - Full Salary Deduction)' },
    { value: 'extended', label: 'Extended Personal Leave (Salary Deduction)' },
    { value: 'paid', label: 'Annual Paid Leave (No deduction - uses annual quota)' },
    { value: 'sick', label: 'Medical / Sick Leave (Paid)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grant Staff Leave & Salary Deduction"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success flex items-center gap-2">
            <CheckCircle size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Staff Selection Dropdown */}
        <Select
          id="grant-staff-id"
          label="Select Staff Member"
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          options={staffOptions}
          required
        />

        {/* Employee Summary & Daily Cost Card */}
        {activeStaff && (
          <div className="p-3.5 rounded-xl border border-border bg-bg text-xs space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium text-text text-sm">{activeStaff.full_name}</span>
                <span className="text-muted ml-2">({activeStaff.designation})</span>
              </div>
              <span className="font-mono text-muted text-[11px]">{activeStaff.employee_code}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-border">
              <div>
                <span className="text-muted text-[11px] block">Monthly Base:</span>
                <span className="font-medium text-text">{formatCurrency(baseSalary)}</span>
              </div>
              <div>
                <span className="text-muted text-[11px] block">Per Day Cost:</span>
                <span className="font-medium text-accent">{formatCurrency(dailyCost)} / day</span>
              </div>
              <div>
                <span className="text-muted text-[11px] block">Annual Quota:</span>
                <span className="text-text">{activeStaff.annual_leave_quota || 18} days/yr</span>
              </div>
            </div>
          </div>
        )}

        {/* Leave Type */}
        <Select
          id="grant-leave-type"
          label="Leave Type & Policy"
          value={leaveType}
          onChange={(e) => {
            const val = e.target.value;
            setLeaveType(val);
            if (val === 'unpaid' || val === 'extended') {
              setDeductSalary(true);
            } else {
              setDeductSalary(false);
            }
          }}
          options={leaveTypeOptions}
          required
        />

        {/* Date Range and Number of Days */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="grant-start-date"
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => handleDateChange(e.target.value, endDate)}
            required
          />

          <Input
            id="grant-end-date"
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => handleDateChange(startDate, e.target.value)}
            required
          />

          <Input
            id="grant-total-days"
            type="number"
            min="1"
            max="90"
            label="Total Days"
            value={totalDays}
            onChange={(e) => handleDaysChange(e.target.value)}
            required
          />
        </div>

        {/* Live Salary Deduction Calculator Card */}
        <div className="p-4 rounded-xl border border-border bg-surface text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <IndianRupee size={16} className="text-text" />
              <span className="font-medium text-text text-sm">
                Salary Deduction Calculator
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={deductSalary}
                onChange={(e) => setDeductSalary(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              <span>Deduct from Payroll</span>
            </label>
          </div>

          {deductSalary ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-muted">
                <span>Calculation Basis:</span>
                <span className="font-mono text-text">
                  {numDays} days × {formatCurrency(dailyCost)}/day
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Loss of Pay (LOP) Deduction:</span>
                <span className="font-medium text-danger">-{formatCurrency(calculatedDeduction)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Base Monthly Salary:</span>
                <span>{formatCurrency(baseSalary)}</span>
              </div>
              <div className="flex justify-between font-medium text-sm pt-1.5 border-t border-border text-text">
                <span>Estimated Net Salary:</span>
                <span className="text-accent">{formatCurrency(estimatedNetSalary)}</span>
              </div>
            </div>
          ) : (
            <div className="text-muted text-[11px]">
              No salary deduction will be applied. This leave will be recorded as paid leave against annual quota.
            </div>
          )}
        </div>

        {/* Reason / Notes */}
        <Input
          id="grant-reason"
          label="Leave Reason & Owner Notes"
          placeholder="e.g. Approved extended leave of 15 days. Deducted from salary as requested."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* Modal Actions */}
        <div className="pt-3 border-t border-border flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            pending={grantLeaveMutation.isPending}
            className="gap-1.5"
          >
            <CheckCircle size={15} /> Confirm & Grant Leave
          </Button>
        </div>
      </form>
    </Modal>
  );
}
