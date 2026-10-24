import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Badge,
  Button,
  Input,
  Select,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
  Modal,
} from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { useAuth } from '@/features/auth';
import { useStaffProfiles, useStaffLeaves, useStaffSalaries, useSubmitLeaveRequest } from '../hooks/useStaff';
import { PayslipModal } from '../components/PayslipModal';
import { formatCurrency } from '@/shared/lib/format';
import { getErrorMessage } from '@/shared/lib/errors';
import {
  User,
  Calendar,
  CreditCard,
  Plus,
  ArrowLeft,
  CheckCircle,
  Clock,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export function StaffPortalPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Leave Form
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const submitLeaveMutation = useSubmitLeaveRequest();

  const { data: staffList = [] } = useStaffProfiles();
  const { data: allLeaves = [] } = useStaffLeaves();
  const { data: allSalaries = [] } = useStaffSalaries('2026-10');

  // Match current user's profile to staff records
  const currentStaff =
    staffList.find((s) => s.email?.toLowerCase() === profile?.email?.toLowerCase()) ||
    staffList[0];

  const myLeaves = allLeaves.filter((l) => l.staff_id === currentStaff?.id);
  const mySalaries = allSalaries.filter((s) => s.staff_id === currentStaff?.id);

  // Leave Quota calculation
  const approvedLeavesDays = myLeaves
    .filter((l) => l.status === 'approved')
    .reduce((sum, l) => sum + (l.total_days || 0), 0);
  const totalQuota = currentStaff?.annual_leave_quota || 18;
  const remainingQuota = Math.max(0, totalQuota - approvedLeavesDays);

  async function handleLeaveSubmit(e) {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setFormError('Please provide start date, end date, and reason for leave.');
      return;
    }

    setFormError('');
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;

    try {
      await submitLeaveMutation.mutateAsync({
        staff_id: currentStaff.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        total_days: diffDays > 0 ? diffDays : 1,
        reason: reason.trim(),
        status: 'pending',
      });
      setIsLeaveModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  return (
    <Container size="xl" className="py-8 space-y-6 min-w-0">
      <Seo
        title="My Staff Portal | Star Enterprises"
        description="Employee self-service dashboard for attendance, leave requests, and personal salary payslips."
        path="/admin/my-portal"
        noindex
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft size={16} /> Launcher
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-text">
              Employee Self-Service Portal
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Welcome back, <span className="font-semibold text-text">{currentStaff?.full_name || profile?.full_name}</span>. Check your leaves and payslips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="accent" className="text-xs font-medium">
            Staff Portal
          </Badge>
          <Button
            variant="solid"
            size="sm"
            onClick={() => setIsLeaveModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Plus size={14} /> Apply for Leave
          </Button>
        </div>
      </div>

      {/* Profile & Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Employee Profile</span>
            <User size={18} />
          </div>
          <div className="text-lg font-semibold text-text">{currentStaff?.full_name}</div>
          <div className="text-xs text-muted">
            {currentStaff?.designation} • {currentStaff?.employee_code}
          </div>
          <div className="pt-2 text-xs text-text border-t border-border">
            Assigned: <span className="font-medium">{currentStaff?.stores?.name || 'Star Mobiles'}</span>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Annual Leave Balance</span>
            <Calendar size={18} />
          </div>
          <div className="text-2xl font-medium tracking-tight text-text">{remainingQuota} Days Left</div>
          <div className="text-xs text-muted">
            Total Quota: {totalQuota} days • Used: {approvedLeavesDays} days
          </div>
          <div className="pt-2 text-xs text-muted border-t border-border flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-text" /> Paid leave allowance for FY 2026-27
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Base Salary Package</span>
            <CreditCard size={18} />
          </div>
          <div className="text-2xl font-medium tracking-tight text-text">
            {formatCurrency(currentStaff?.base_salary || 0)}
          </div>
          <div className="text-xs text-muted">Monthly Gross Compensation</div>
          <div className="pt-2 text-xs text-muted border-t border-border">
            Bank: {currentStaff?.bank_name || 'HDFC Bank'}
          </div>
        </Card>
      </div>

      {/* My Leave Requests Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <Calendar size={16} /> My Leave Applications
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLeaveModalOpen(true)}
            className="text-xs"
          >
            <Plus size={13} /> Request Leave
          </Button>
        </div>

        {myLeaves.length === 0 ? (
          <div className="py-10 text-center border border-border rounded-2xl bg-surface text-xs text-muted">
            You have not submitted any leave applications.
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Dates</TableHeaderCell>
                <TableHeaderCell>Days</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Review Remarks</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="capitalize text-xs font-semibold text-text">
                    {leave.leave_type} Leave
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {leave.start_date} to {leave.end_date}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{leave.total_days} d</TableCell>
                  <TableCell className="text-xs italic text-muted max-w-xs truncate">
                    {leave.reason}
                  </TableCell>
                  <TableCell>
                    {leave.status === 'approved' ? (
                      <Badge variant="success" className="text-[10px]">
                        Approved
                      </Badge>
                    ) : leave.status === 'rejected' ? (
                      <Badge variant="default" className="text-[10px] text-danger border-danger/30">
                        Declined
                      </Badge>
                    ) : (
                      <Badge variant="accent" className="text-[10px]">
                        Pending Review
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {leave.review_notes || 'Pending owner decision'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* My Payslips Section */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <CreditCard size={16} /> My Salary Payslips
        </h3>

        {mySalaries.length === 0 ? (
          <div className="py-10 text-center border border-border rounded-2xl bg-surface text-xs text-muted">
            No payslip records generated for this account yet.
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Pay Cycle</TableHeaderCell>
                <TableHeaderCell>Basic Salary</TableHeaderCell>
                <TableHeaderCell>Incentives</TableHeaderCell>
                <TableHeaderCell>Deductions</TableHeaderCell>
                <TableHeaderCell>Net Take-Home</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Payslip Document</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mySalaries.map((sal) => (
                <TableRow key={sal.id}>
                  <TableCell className="font-mono text-xs font-medium text-text">
                    {sal.month_year}
                  </TableCell>
                  <TableCell className="text-xs">{formatCurrency(sal.base_salary)}</TableCell>
                  <TableCell className="text-xs text-muted">+{formatCurrency(sal.allowances)}</TableCell>
                  <TableCell className="text-xs text-danger">-{formatCurrency(sal.deductions)}</TableCell>
                  <TableCell className="text-xs font-medium text-text">
                    {formatCurrency(sal.net_salary)}
                  </TableCell>
                  <TableCell>
                    {sal.payment_status === 'paid' ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <CheckCircle size={11} /> Disbursed ({sal.payment_method?.toUpperCase()})
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] gap-1">
                        <Clock size={11} /> Processing
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPayslip(sal)}
                      className="text-xs py-1 px-2.5 gap-1.5"
                    >
                      <Printer size={12} /> View & Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Apply for Store Leave"
        size="lg"
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-4 text-text min-w-0">
          {formError && (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              {formError}
            </div>
          )}

          <Select
            id="leave-type"
            label="Leave Category"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            options={[
              { value: 'casual', label: 'Casual Leave (Personal / Urgent)' },
              { value: 'sick', label: 'Sick / Medical Leave' },
              { value: 'earned', label: 'Earned / Planned Vacation Leave' },
              { value: 'emergency', label: 'Emergency Leave' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="start-date"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              id="end-date"
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            id="leave-reason"
            label="Reason for Absence"
            placeholder="e.g. Attending family function / Doctor appointment"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="pt-2 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="solid" pending={submitLeaveMutation.isPending}>
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <PayslipModal
          salaryRecord={selectedPayslip}
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </Container>
  );
}
