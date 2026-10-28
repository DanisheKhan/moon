import { useState } from 'react';
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
import { useStores } from '@/features/stores';
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
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import {
  Users,
  Calendar,
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  Printer,
  FileCheck,
  Pencil,
  UserCheck,
  UserX,
  Search,
  RotateCcw,
} from 'lucide-react';

export function StaffManagementPage() {
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

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Queries
  const { data: stores = [] } = useStores();
  const { data: staffList = [], isLoading: staffLoading } = useStaffProfiles();
  const { data: leaves = [], isLoading: leavesLoading } = useStaffLeaves();
  const { data: salaries = [], isLoading: salariesLoading } = useStaffSalaries('2026-10');

  const updateStatusMutation = useUpdateStaffStatus();
  const markPaidMutation = useMarkSalaryPaid();

  // Pending leaves count
  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  // Filtered staff list
  const filteredStaffList = staffList.filter((emp) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      emp.full_name?.toLowerCase().includes(q) ||
      emp.employee_code?.toLowerCase().includes(q) ||
      emp.designation?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.phone?.includes(q) ||
      emp.email?.toLowerCase().includes(q);

    const matchesStore =
      storeFilter === 'all' ||
      emp.primary_store_id === storeFilter ||
      emp.stores?.code === storeFilter;

    const matchesStatus =
      statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesStore && matchesStatus;
  });

  // KPI Metrics
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter((s) => s.status === 'active').length;
  const onLeaveStaffCount = staffList.filter((s) => s.status === 'on_leave').length;
  const totalPayrollAmount = staffList.reduce(
    (sum, s) => sum + (Number(s.base_salary) || 0),
    0
  );

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
    <div className="w-full space-y-6 min-w-0">
      <Seo
        title="Staff Management System & Payroll | Star Enterprises"
        description="Comprehensive HRMS for staff directory, leave approvals, and monthly salary disbursement."
        path="/admin/staff"
        noindex
      />

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text tracking-tight">
            Staff Management System (HRMS)
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Manage employee directory, review leave requests, and disburse store payroll across branches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGrantStaffTarget(null);
              setIsGrantLeaveOpen(true);
            }}
            className="text-xs gap-1.5 rounded-lg font-medium"
          >
            <Calendar size={13} /> Grant Leave
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
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={cn(
            'px-3.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium transition-colors flex items-center gap-1.5 select-none',
            activeTab === 'directory'
              ? 'bg-accent text-accent-fg border-accent shadow-2xs'
              : 'bg-surface text-muted border-border hover:text-text hover:bg-bg'
          )}
        >
          <Users size={14} /> Staff Directory ({staffList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          className={cn(
            'px-3.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium transition-colors flex items-center gap-1.5 select-none',
            activeTab === 'leaves'
              ? 'bg-accent text-accent-fg border-accent shadow-2xs'
              : 'bg-surface text-muted border-border hover:text-text hover:bg-bg'
          )}
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
          className={cn(
            'px-3.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium transition-colors flex items-center gap-1.5 select-none',
            activeTab === 'salaries'
              ? 'bg-accent text-accent-fg border-accent shadow-2xs'
              : 'bg-surface text-muted border-border hover:text-text hover:bg-bg'
          )}
        >
          <CreditCard size={14} /> Salary & Payroll Register
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="p-4 bg-surface border-border rounded-xl flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-text shrink-0">
                <Users size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-muted uppercase tracking-wider">Total Staff</div>
                <div className="text-base font-semibold text-text leading-tight mt-0.5">{totalStaffCount} Registered</div>
              </div>
            </Card>

            <Card className="p-4 bg-surface border-border rounded-xl flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <UserCheck size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-muted uppercase tracking-wider">Active on Duty</div>
                <div className="text-base font-semibold text-text leading-tight mt-0.5">{activeStaffCount} Active</div>
              </div>
            </Card>

            <Card className="p-4 bg-surface border-border rounded-xl flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Clock size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-muted uppercase tracking-wider">On Leave</div>
                <div className="text-base font-semibold text-text leading-tight mt-0.5">{onLeaveStaffCount} Staff</div>
              </div>
            </Card>

            <Card className="p-4 bg-surface border-border rounded-xl flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-brand-sage/10 border border-brand-sage/20 flex items-center justify-center text-brand-sage-text shrink-0">
                <CreditCard size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-muted uppercase tracking-wider">Monthly Payroll</div>
                <div className="text-base font-semibold text-text leading-tight mt-0.5">{formatCurrency(totalPayrollAmount)}</div>
              </div>
            </Card>
          </div>

          {/* Search & Store Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border shadow-2xs">
            <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2.5 min-w-0">
              <div className="relative flex-1 min-w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff by name, code, designation, or phone..."
                  className="w-full h-9 pl-9 pr-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>

              {/* Store Filter */}
              <div className="w-44 shrink-0">
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-hidden focus:ring-1 focus:ring-accent cursor-pointer transition-colors"
                >
                  <option value="all">All Stores</option>
                  {stores.map((s) => (
                    <option key={s.id || s.code} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-36 shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-hidden focus:ring-1 focus:ring-accent cursor-pointer transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {(searchQuery || storeFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStoreFilter('all');
                    setStatusFilter('all');
                  }}
                  className="h-9 px-2.5 text-muted hover:text-text rounded-lg border border-border bg-bg hover:bg-surface cursor-pointer text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Reset filters"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="text-xs text-muted shrink-0 self-center font-medium bg-bg border border-border px-3 py-1.5 rounded-lg shadow-2xs">
              Showing <span className="font-semibold text-text">{filteredStaffList.length}</span> of {staffList.length} staff
            </div>
          </div>

          {staffLoading ? (
            <div className="py-16 text-center text-muted text-xs">Loading staff profiles...</div>
          ) : filteredStaffList.length === 0 ? (
            <div className="py-14 text-center border border-border rounded-xl bg-surface space-y-2">
              <Users size={32} className="mx-auto text-muted" />
              <p className="text-sm font-semibold text-text">No staff profiles found</p>
              <p className="text-xs text-muted">Try adjusting your search query or store filter</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-[24%]">Employee</TableHeaderCell>
                  <TableHeaderCell className="w-[18%]">Role & Store</TableHeaderCell>
                  <TableHeaderCell className="w-[18%]">Contact</TableHeaderCell>
                  <TableHeaderCell className="w-[16%]">Compensation</TableHeaderCell>
                  <TableHeaderCell className="w-[10%]">Status</TableHeaderCell>
                  <TableHeaderCell className="text-right w-[14%]">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaffList.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-text text-bg font-medium flex items-center justify-center text-xs shrink-0 select-none">
                          {emp.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-text text-xs leading-tight truncate" title={emp.full_name}>
                            {emp.full_name}
                          </div>
                          <div className="text-[10px] text-muted leading-tight mt-0.5 truncate font-mono">
                            {emp.employee_code} • {emp.department}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="font-medium text-text text-xs leading-tight truncate">
                        {emp.designation}
                      </div>
                      <div className="text-[11px] text-muted leading-tight mt-0.5 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-sage shrink-0" />
                        <span className="truncate">{emp.stores?.name || 'All Stores'}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="text-xs font-medium text-text font-mono leading-tight truncate">
                        {emp.phone}
                      </div>
                      <div className="text-[10px] text-muted font-mono leading-tight mt-0.5 truncate" title={emp.email}>
                        {emp.email}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="font-semibold text-xs text-text leading-tight">
                        {formatCurrency(emp.base_salary)}
                      </div>
                      <div className="text-[10px] text-muted leading-tight mt-0.5 truncate">
                        {emp.annual_leave_quota}d quota • {formatCurrency(Math.round(Number(emp.base_salary || 0) / 30))}/d
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      {emp.status === 'active' ? (
                        <Badge variant="success" className="text-xs py-0.5 px-2 font-medium">
                          Active
                        </Badge>
                      ) : emp.status === 'on_leave' ? (
                        <Badge variant="warning" className="text-xs py-0.5 px-2 font-medium">
                          On Leave
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs py-0.5 px-2 font-medium">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right py-3">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGrantStaffTarget(emp);
                            setIsGrantLeaveOpen(true);
                          }}
                          className="h-7.5 px-2 text-xs font-medium gap-1 shrink-0 text-text hover:bg-bg"
                          title="Grant Leave & Deduct Salary"
                        >
                          <Calendar size={12} className="shrink-0 text-brand-sage" />
                          <span>Leave</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStaffToEdit(emp);
                            setIsStaffModalOpen(true);
                          }}
                          className="h-7.5 px-2 text-xs font-medium gap-1 shrink-0 text-text hover:bg-bg"
                          title="Edit Staff Profile"
                        >
                          <Pencil size={12} className="shrink-0 text-muted" />
                          <span>Edit</span>
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = emp.status === 'active' ? 'inactive' : 'active';
                            updateStatusMutation.mutate({ staffId: emp.id, status: newStatus });
                          }}
                          className={cn(
                            'h-7.5 w-7.5 inline-flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-bg cursor-pointer transition-colors shrink-0',
                            emp.status === 'active'
                              ? 'text-muted hover:text-danger hover:border-danger/30'
                              : 'text-brand-sage hover:border-brand-sage/30'
                          )}
                          title={emp.status === 'active' ? 'Deactivate staff profile' : 'Activate staff profile'}
                        >
                          {emp.status === 'active' ? (
                            <UserX size={13} className="text-danger/80" />
                          ) : (
                            <UserCheck size={13} className="text-brand-sage" />
                          )}
                        </button>
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
                    <TableHeaderCell className="w-[22%]">Staff Member</TableHeaderCell>
                    <TableHeaderCell className="w-[14%]">Type</TableHeaderCell>
                    <TableHeaderCell className="w-[20%]">Duration</TableHeaderCell>
                    <TableHeaderCell className="w-[10%]">Days</TableHeaderCell>
                    <TableHeaderCell className="w-[20%]">Reason</TableHeaderCell>
                    <TableHeaderCell className="w-[14%]">Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="py-3">
                        <div className="font-semibold text-xs text-text leading-tight truncate">
                          {l.staff_profiles?.full_name}
                        </div>
                        <div className="text-[10px] text-muted leading-tight mt-0.5 truncate">
                          {l.staff_profiles?.designation}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-xs py-3">{l.leave_type}</TableCell>
                      <TableCell className="text-xs text-muted py-3 truncate">
                        {l.start_date} to {l.end_date}
                      </TableCell>
                      <TableCell className="text-xs font-semibold py-3">{l.total_days} d</TableCell>
                      <TableCell className="text-xs italic text-muted truncate py-3" title={l.reason}>
                        {l.reason || '—'}
                      </TableCell>
                      <TableCell className="py-3">
                        {l.status === 'approved' ? (
                          <Badge variant="success" className="text-xs py-0.5 px-2 font-medium">
                            Approved
                          </Badge>
                        ) : l.status === 'rejected' ? (
                          <Badge variant="danger" className="text-xs py-0.5 px-2 font-medium">
                            Rejected
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs py-0.5 px-2 font-medium">
                            Pending
                          </Badge>
                        )}
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
                  <TableHeaderCell className="w-[24%]">Employee</TableHeaderCell>
                  <TableHeaderCell className="w-[18%]">Role</TableHeaderCell>
                  <TableHeaderCell className="w-[18%]">Basic Salary / Day</TableHeaderCell>
                  <TableHeaderCell className="w-[16%]">Net Payout</TableHeaderCell>
                  <TableHeaderCell className="w-[12%]">Status</TableHeaderCell>
                  <TableHeaderCell className="text-right w-[12%]">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salaries.map((sal) => (
                  <TableRow key={sal.id}>
                    <TableCell className="py-3">
                      <div className="font-semibold text-xs text-text leading-tight truncate" title={sal.staff_profiles?.full_name}>
                        {sal.staff_profiles?.full_name}
                      </div>
                      <div className="text-[10px] text-muted font-mono leading-tight mt-0.5 truncate">
                        {sal.staff_profiles?.employee_code}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted py-3 truncate">
                      {sal.staff_profiles?.designation}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="text-xs font-medium text-text leading-tight">{formatCurrency(sal.base_salary)}</div>
                      <div className="text-[10px] text-muted font-mono mt-0.5 leading-tight">{formatCurrency(Math.round(Number(sal.base_salary || 0) / 30))}/day</div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="text-xs font-semibold text-text leading-tight">{formatCurrency(sal.net_salary)}</div>
                      <div className="text-[10px] text-muted leading-tight mt-0.5">
                        +{formatCurrency(sal.allowances)} • -{formatCurrency(sal.deductions)}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      {sal.payment_status === 'paid' ? (
                        <Badge variant="success" className="text-xs gap-1 shrink-0 py-0.5 px-2 font-medium">
                          <CheckCircle size={11} className="shrink-0" /> Paid
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs gap-1 shrink-0 py-0.5 px-2 font-medium">
                          <Clock size={11} className="shrink-0" /> Unpaid
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right py-3">
                      <div className="inline-flex items-center justify-end gap-1">
                        {sal.payment_status !== 'paid' && (
                          <Button
                            variant="solid"
                            size="sm"
                            onClick={() => {
                              setSalaryToPay(sal);
                              setTransRef(`TXN-STAR-${Math.floor(1000 + Math.random() * 9000)}`);
                            }}
                            className="h-7.5 px-2 text-xs font-medium gap-1 shrink-0"
                          >
                            <CreditCard size={12} className="shrink-0" />
                            <span>Pay</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayslip(sal)}
                          className="h-7.5 px-2 text-xs font-medium gap-1 shrink-0 text-text hover:bg-bg"
                          title="Generate Official Payslip"
                        >
                          <Printer size={12} className="shrink-0 text-muted" />
                          <span>Payslip</span>
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
