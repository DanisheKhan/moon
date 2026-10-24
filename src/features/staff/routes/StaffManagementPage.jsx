import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Badge,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
  Modal,
  Input,
  Select,
} from '@/shared/ui';
import { Seo } from '@/shared/seo';
import {
  useStaffProfiles,
  useStaffLeaves,
  useStaffSalaries,
  useUpdateStaffStatus,
  useMarkSalaryPaid,
} from '../hooks/useStaff';
import { StaffModal } from '../components/StaffModal';
import { PayslipModal } from '../components/PayslipModal';
import { LeaveActionModal } from '../components/LeaveActionModal';
import { GrantLeaveModal } from '../components/GrantLeaveModal';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  Users,
  Calendar,
  CreditCard,
  Plus,
  ArrowLeft,
  CheckCircle,
  Clock,
  Shield,
  Printer,
  FileCheck,
} from 'lucide-react';

export function StaffManagementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'leaves' | 'salaries'

  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isGrantLeaveOpen, setIsGrantLeaveOpen] = useState(false);
  const [grantStaffTarget, setGrantStaffTarget] = useState(null);

  // Pay Modal State
  const [salaryToPay, setSalaryToPay] = useState(null);
  const [payMethod, setPayMethod] = useState('upi');
  const [transRef, setTransRef] = useState('');

  // Queries
  const { data: staffList = [], isLoading: staffLoading } = useStaffProfiles();
  const { data: leaves = [], isLoading: leavesLoading } = useStaffLeaves();
  const { data: salaries = [], isLoading: salariesLoading } = useStaffSalaries('2026-10');

  const updateStatusMutation = useUpdateStaffStatus();
  const markPaidMutation = useMarkSalaryPaid();

  // Pending leaves count
  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  async function handleConfirmPayment(e) {
    e.preventDefault();
    if (!salaryToPay) return;

    try {
      await markPaidMutation.mutateAsync({
        salaryId: salaryToPay.id,
        paymentMethod: payMethod,
        transactionRef: transRef.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      });
      setSalaryToPay(null);
      setTransRef('');
    } catch (err) {
      console.error('Error marking salary paid:', err);
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 min-w-0">
      <Seo
        title="Staff Management System & Payroll | Star Enterprises"
        description="Comprehensive HRMS for staff directory, leave approvals, and monthly salary disbursement."
        path="/admin/staff"
        noindex
      />

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="rounded-lg font-medium text-xs">
            <ArrowLeft size={15} /> Launcher
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-text">
              Staff Management System (HRMS)
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Manage employees, review leave requests, and disburse monthly store payroll.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="accent" className="gap-1.5 py-1 px-3 rounded-lg font-medium">
            <Shield size={13} /> Owner Master Control
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGrantStaffTarget(null);
              setIsGrantLeaveOpen(true);
            }}
            className="text-xs gap-1.5 rounded-lg font-medium"
          >
            <Calendar size={14} /> Grant Leave
          </Button>
          <Button
            variant="solid"
            size="sm"
            onClick={() => {
              setStaffToEdit(null);
              setIsStaffModalOpen(true);
            }}
            className="text-xs gap-1.5 rounded-lg font-medium"
          >
            <Plus size={14} /> Onboard Staff
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`px-3.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'directory'
              ? 'bg-accent text-accent-fg border-accent shadow-2xs'
              : 'bg-surface text-muted border-border hover:text-text hover:bg-bg'
          }`}
        >
          <Users size={14} /> Staff Directory ({staffList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          className={`px-3.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'leaves'
              ? 'bg-accent text-accent-fg border-accent shadow-2xs'
              : 'bg-surface text-muted border-border hover:text-text hover:bg-bg'
          }`}
        >
          <Calendar size={14} /> Leave Management
          {pendingLeaves.length > 0 && (
            <span className="bg-danger text-white text-[10px] px-1.5 py-0.2 rounded-md font-medium ml-1">
              {pendingLeaves.length} Pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('salaries')}
          className={`px-3.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'salaries'
              ? 'bg-accent text-accent-fg border-accent shadow-2xs'
              : 'bg-surface text-muted border-border hover:text-text hover:bg-bg'
          }`}
        >
          <CreditCard size={14} /> Salary & Payroll Register
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="text-xs text-muted">
            Showing active staff members across Star Mobiles and Furniture
          </div>

          {staffLoading ? (
            <div className="py-16 text-center text-muted">Loading staff profiles...</div>
          ) : staffList.length === 0 ? (
            <div className="py-16 text-center border border-border rounded-xl bg-surface space-y-2">
              <Users size={32} className="mx-auto text-muted" />
              <p className="text-sm font-semibold text-text">No staff profiles registered yet</p>
              <Button
                variant="solid"
                size="sm"
                onClick={() => setIsStaffModalOpen(true)}
                className="mt-2 text-xs"
              >
                Onboard First Staff Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Code</TableHeaderCell>
                  <TableHeaderCell>Employee Name</TableHeaderCell>
                  <TableHeaderCell>Role & Store</TableHeaderCell>
                  <TableHeaderCell>Contact & Email</TableHeaderCell>
                  <TableHeaderCell>Base Salary / Per Day</TableHeaderCell>
                  <TableHeaderCell>Annual Quota</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffList.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-xs font-medium">{emp.employee_code}</TableCell>
                    <TableCell>
                      <div className="font-medium text-text text-xs truncate max-w-44" title={emp.full_name}>{emp.full_name}</div>
                      <div className="text-[10px] text-muted truncate max-w-44">{emp.department}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-text truncate max-w-44">{emp.designation}</div>
                      <Badge variant="default" className="text-[10px] py-0 px-1.5 mt-0.5 font-medium shrink-0">
                        {emp.stores?.name || 'All Stores'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-text truncate max-w-44">{emp.phone}</div>
                      <div className="text-[10px] text-muted font-mono truncate max-w-44">{emp.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs text-text">
                        {formatCurrency(emp.base_salary)}
                      </div>
                      <div className="text-[10px] text-muted font-mono font-normal">
                        {formatCurrency(Math.round(Number(emp.base_salary || 0) / 30))}/day
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted">
                      {emp.annual_leave_quota} days / yr
                    </TableCell>
                    <TableCell>
                      {emp.status === 'active' ? (
                        <Badge variant="success" className="text-[10px] h-5 font-medium">
                          Active
                        </Badge>
                      ) : emp.status === 'on_leave' ? (
                        <Badge variant="accent" className="text-[10px] h-5 font-medium">
                          On Leave
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] h-5 font-medium">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 h-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGrantStaffTarget(emp);
                            setIsGrantLeaveOpen(true);
                          }}
                          className="text-xs py-1 px-2.5 h-7 gap-1 text-accent border-accent/40 hover:border-accent rounded-lg font-medium cursor-pointer"
                          title="Grant Leave & Deduct Salary"
                        >
                          <Calendar size={12} /> Leave
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStaffToEdit(emp);
                            setIsStaffModalOpen(true);
                          }}
                          className="text-xs py-1 px-2.5 h-7 rounded-lg font-medium cursor-pointer"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newStatus = emp.status === 'active' ? 'inactive' : 'active';
                            updateStatusMutation.mutate({ staffId: emp.id, status: newStatus });
                          }}
                          className="text-xs py-1 px-2.5 h-7 text-muted hover:text-text rounded-lg font-medium cursor-pointer"
                        >
                          {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* TAB 2: LEAVE MANAGEMENT & APPROVALS */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          {/* Pending Leaves Callout */}
          {pendingLeaves.length > 0 && (
            <Card className="p-4 sm:p-5 border-accent bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-text" />
                  <h3 className="font-semibold text-text text-sm">
                    Pending Leave Requests ({pendingLeaves.length})
                  </h3>
                </div>
                <Badge variant="accent">Action Required</Badge>
              </div>

              <div className="divide-y divide-border border border-border rounded-2xl bg-bg overflow-hidden">
                {pendingLeaves.map((leave) => (
                  <div key={leave.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text text-sm">
                          {leave.staff_profiles?.full_name}
                        </span>
                        <Badge variant="default" className="text-[10px]">
                          {leave.staff_profiles?.designation}
                        </Badge>
                        <span className="text-muted capitalize">({leave.leave_type} Leave)</span>
                      </div>
                      <div className="text-muted">
                        Dates: <span className="font-medium text-text">{leave.start_date} to {leave.end_date}</span> ({leave.total_days} days)
                      </div>
                      <div className="italic text-text">"{leave.reason}"</div>
                    </div>

                    <Button
                      variant="solid"
                      size="sm"
                      onClick={() => setSelectedLeave(leave)}
                      className="text-xs gap-1.5 shrink-0"
                    >
                      <FileCheck size={14} /> Review & Decide
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Historical Leaves Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Leave History & Decision Logs</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGrantStaffTarget(null);
                  setIsGrantLeaveOpen(true);
                }}
                className="text-xs gap-1.5"
              >
                <Plus size={13} /> Grant Staff Leave
              </Button>
            </div>
            {leavesLoading ? (
              <div className="py-12 text-center text-muted">Loading leave logs...</div>
            ) : leaves.length === 0 ? (
              <div className="py-12 text-center border border-border rounded-2xl bg-surface text-muted text-xs">
                No leave applications recorded.
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Staff Member</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Duration</TableHeaderCell>
                    <TableHeaderCell>Days</TableHeaderCell>
                    <TableHeaderCell>Reason</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Reviewed By</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-semibold text-xs text-text">
                        {l.staff_profiles?.full_name}
                      </TableCell>
                      <TableCell className="capitalize text-xs">{l.leave_type}</TableCell>
                      <TableCell className="text-xs text-muted">
                        {l.start_date} to {l.end_date}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{l.total_days} d</TableCell>
                      <TableCell className="text-xs italic text-muted max-w-xs truncate" title={l.reason}>
                        {l.reason}
                      </TableCell>
                      <TableCell>
                        {l.status === 'approved' ? (
                          <Badge variant="success" className="text-[10px] h-5 font-medium">
                            Approved
                          </Badge>
                        ) : l.status === 'rejected' ? (
                          <Badge variant="default" className="text-[10px] h-5 text-danger border-danger/30 font-medium">
                            Rejected
                          </Badge>
                        ) : (
                          <Badge variant="accent" className="text-[10px] h-5 font-medium">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted">
                        {l.reviewed_by ? `${l.reviewed_by} (${formatDate(l.reviewed_at)})` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SALARY & PAYROLL REGISTER */}
      {activeTab === 'salaries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-text">October 2026 Monthly Payroll</h3>
              <p className="text-xs text-muted">Official salary disbursement register and printable GST payslips.</p>
            </div>
            <Badge variant="accent">Payroll Cycle: 2026-10</Badge>
          </div>

          {salariesLoading ? (
            <div className="py-16 text-center text-muted">Loading monthly payroll register...</div>
          ) : salaries.length === 0 ? (
            <div className="py-16 text-center border border-border rounded-2xl bg-surface text-muted text-xs">
              No salary entries for this cycle.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Employee</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Basic Salary / Day</TableHeaderCell>
                  <TableHeaderCell>Incentives</TableHeaderCell>
                  <TableHeaderCell>Deductions</TableHeaderCell>
                  <TableHeaderCell>Net Payout</TableHeaderCell>
                  <TableHeaderCell>Payment Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salaries.map((sal) => (
                  <TableRow key={sal.id}>
                    <TableCell>
                      <div className="font-semibold text-xs text-text truncate max-w-40" title={sal.staff_profiles?.full_name}>{sal.staff_profiles?.full_name}</div>
                      <div className="text-[10px] text-muted font-mono">{sal.staff_profiles?.employee_code}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted truncate max-w-36">{sal.staff_profiles?.designation}</TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-text">{formatCurrency(sal.base_salary)}</div>
                      <div className="text-[10px] text-muted font-mono">{formatCurrency(Math.round(Number(sal.base_salary || 0) / 30))}/day</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted">+{formatCurrency(sal.allowances)}</TableCell>
                    <TableCell>
                      <div className="text-xs text-danger font-medium">-{formatCurrency(sal.deductions)}</div>
                      {sal.notes && (
                        <div className="text-[10px] text-muted truncate max-w-44 leading-tight" title={sal.notes}>
                          {sal.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-text">
                      {formatCurrency(sal.net_salary)}
                    </TableCell>
                    <TableCell>
                      {sal.payment_status === 'paid' ? (
                        <Badge variant="success" className="text-[10px] h-5 gap-1 shrink-0 whitespace-nowrap">
                          <CheckCircle size={11} /> Paid ({sal.payment_method?.toLowerCase() === 'bank_transfer' ? 'Bank' : sal.payment_method?.toUpperCase()})
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] h-5 gap-1 shrink-0 whitespace-nowrap">
                          <Clock size={11} /> Unpaid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 h-8">
                        {sal.payment_status !== 'paid' && (
                          <Button
                            variant="solid"
                            size="sm"
                            onClick={() => {
                              setSalaryToPay(sal);
                              setTransRef(`TXN-STAR-${Math.floor(1000 + Math.random() * 9000)}`);
                            }}
                            className="text-xs py-1 px-2.5 h-7 cursor-pointer"
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayslip(sal)}
                          className="text-xs py-1 px-2.5 h-7 gap-1 cursor-pointer"
                        >
                          <Printer size={12} /> Payslip
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Staff Modal (Onboard / Edit) */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        staffToEdit={staffToEdit}
      />

      {/* Payslip Modal */}
      {selectedPayslip && (
        <PayslipModal
          salaryRecord={selectedPayslip}
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
        />
      )}

      {/* Leave Decision Modal */}
      {selectedLeave && (
        <LeaveActionModal
          leave={selectedLeave}
          isOpen={Boolean(selectedLeave)}
          onClose={() => setSelectedLeave(null)}
        />
      )}

      {/* Owner Grant Leave Modal */}
      <GrantLeaveModal
        isOpen={isGrantLeaveOpen}
        onClose={() => {
          setIsGrantLeaveOpen(false);
          setGrantStaffTarget(null);
        }}
        staffList={staffList}
        defaultStaff={grantStaffTarget}
      />

      {/* Mark Salary Paid Modal */}
      {salaryToPay && (
        <Modal
          isOpen={Boolean(salaryToPay)}
          onClose={() => setSalaryToPay(null)}
          title={`Disburse Salary: ${salaryToPay.staff_profiles?.full_name}`}
          size="lg"
        >
          <form onSubmit={handleConfirmPayment} className="space-y-4 text-text min-w-0">
            <div className="p-3.5 rounded-lg border border-border bg-bg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Net Payable Amount:</span>
                <span className="text-base font-medium text-text">{formatCurrency(salaryToPay.net_salary)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Month Cycle:</span>
                <span>{salaryToPay.month_year}</span>
              </div>
            </div>

            <Select
              id="payment-mode"
              label="Disbursement Mode"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              options={[
                { value: 'upi', label: 'UPI / Direct Instant Transfer' },
                { value: 'bank_transfer', label: 'NEFT / RTGS Bank Transfer' },
                { value: 'cash', label: 'Store Cash Drawer Register' },
                { value: 'cheque', label: 'Account Payee Cheque' },
              ]}
            />

            <Input
              id="trans-ref"
              label="Transaction / Voucher Reference"
              placeholder="e.g. UPI/20261015/STAR1234"
              value={transRef}
              onChange={(e) => setTransRef(e.target.value)}
              required
            />

            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSalaryToPay(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="solid" pending={markPaidMutation.isPending}>
                Confirm Payout
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
