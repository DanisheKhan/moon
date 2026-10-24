import { useState } from 'react';
import { Button, Input, Modal } from '@/shared/ui';
import { useStaffProfiles } from '../hooks/useStaff';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
} from 'lucide-react';

const STORAGE_KEY = 'star_staff_attendance_records';

function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function StaffAttendancePage() {
  const { data: staffList = [], isLoading } = useStaffProfiles();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [search, setSearch] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [modalEmployee, setModalEmployee] = useState(null);
  const [checkInTime, setCheckInTime] = useState('09:30 AM');
  const [checkOutTime, setCheckOutTime] = useState('08:00 PM');
  const [notes, setNotes] = useState('');

  function saveRecords(updated) {
    setAttendanceRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  // Get status for an employee on selectedDate
  function getEmployeeAttendance(empId) {
    const dayRecords = attendanceRecords[selectedDate] || {};
    return dayRecords[empId] || {
      status: 'present',
      checkIn: '09:30 AM',
      checkOut: '08:00 PM',
      notes: '',
    };
  }

  function updateStatus(empId, status) {
    const current = getEmployeeAttendance(empId);
    const updated = {
      ...attendanceRecords,
      [selectedDate]: {
        ...(attendanceRecords[selectedDate] || {}),
        [empId]: {
          ...current,
          status,
        },
      },
    };
    saveRecords(updated);
  }

  function handleSavePunch() {
    if (!modalEmployee) return;
    const current = getEmployeeAttendance(modalEmployee.id);
    const updated = {
      ...attendanceRecords,
      [selectedDate]: {
        ...(attendanceRecords[selectedDate] || {}),
        [modalEmployee.id]: {
          ...current,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          notes,
        },
      },
    };
    saveRecords(updated);
    setModalEmployee(null);
  }

  function openPunchModal(emp) {
    const att = getEmployeeAttendance(emp.id);
    setModalEmployee(emp);
    setCheckInTime(att.checkIn || '09:30 AM');
    setCheckOutTime(att.checkOut || '08:00 PM');
    setNotes(att.notes || '');
  }

  // Filter staff
  const filteredStaff = staffList.filter((emp) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        emp.full_name?.toLowerCase().includes(q) ||
        emp.employee_code?.toLowerCase().includes(q) ||
        emp.designation?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate summary stats
  const stats = {
    total: filteredStaff.length,
    present: 0,
    absent: 0,
    halfDay: 0,
    onLeave: 0,
  };

  filteredStaff.forEach((emp) => {
    const att = getEmployeeAttendance(emp.id);
    if (att.status === 'present') stats.present++;
    else if (att.status === 'absent') stats.absent++;
    else if (att.status === 'half_day') stats.halfDay++;
    else if (att.status === 'on_leave') stats.onLeave++;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted block mb-1">
            STAFF & HUMAN RESOURCES
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-text">
            Staff Daily Attendance
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Track daily check-in / check-out times, biometric shifts, and record attendance logs.
          </p>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1.5 shadow-2xs shrink-0">
          <Calendar size={15} className="text-muted ml-2 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-medium bg-transparent text-text border-none outline-none pr-2 cursor-pointer"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-medium text-muted tracking-wider block">
              Present Today
            </span>
            <span className="text-2xl font-medium text-text">{stats.present}</span>
            <span className="text-[10px] text-muted block mt-0.5">Checked in</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-bg border border-border flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-medium text-muted tracking-wider block">
              Absent
            </span>
            <span className="text-2xl font-medium text-text">{stats.absent}</span>
            <span className="text-[10px] text-muted block mt-0.5">Unexcused</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-bg border border-border flex items-center justify-center text-danger">
            <XCircle size={18} />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-medium text-muted tracking-wider block">
              Half-Day
            </span>
            <span className="text-2xl font-medium text-text">{stats.halfDay}</span>
            <span className="text-[10px] text-muted block mt-0.5">Short shift</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-bg border border-border flex items-center justify-center text-amber-600">
            <Clock size={18} />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-medium text-muted tracking-wider block">
              On Leave
            </span>
            <span className="text-2xl font-medium text-text">{stats.onLeave}</span>
            <span className="text-[10px] text-muted block mt-0.5">Approved leave</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-bg border border-border flex items-center justify-center text-purple-600">
            <Calendar size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-border bg-surface shadow-2xs">
        <div className="flex-1">
          <Input
            id="search-attendance"
            placeholder="Search employee name, code, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Attendance Register Table */}
      {isLoading ? (
        <div className="py-16 text-center text-muted">Loading staff members...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl bg-surface text-muted text-xs">
          No staff records found.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg/60 border-b border-border text-muted font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role & Store</th>
                  <th className="py-3 px-4">Shift Timings</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4 text-right">Quick Mark Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStaff.map((emp) => {
                  const att = getEmployeeAttendance(emp.id);

                  return (
                    <tr key={emp.id} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-bg border border-border flex items-center justify-center font-medium text-text text-xs uppercase shrink-0">
                            {emp.full_name?.slice(0, 2) || 'ST'}
                          </div>
                          <div>
                            <div className="font-medium text-text text-xs">{emp.full_name}</div>
                            <div className="font-mono text-[10px] text-muted">{emp.employee_code}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-text">{emp.designation}</div>
                        <div className="text-[10px] text-muted">{emp.stores?.name || 'All Branches'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openPunchModal(emp)}
                          className="flex items-center gap-1.5 text-muted hover:text-text cursor-pointer transition-colors"
                          title="Click to edit timings"
                        >
                          <Clock size={12} />
                          <span className="font-mono text-[11px]">
                            {att.checkIn} – {att.checkOut}
                          </span>
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        {att.status === 'present' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            • PRESENT
                          </span>
                        )}
                        {att.status === 'absent' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-danger/10 text-danger border border-danger/20">
                            • ABSENT
                          </span>
                        )}
                        {att.status === 'half_day' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            • HALF DAY
                          </span>
                        )}
                        {att.status === 'on_leave' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            • ON LEAVE
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateStatus(emp.id, 'present')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-colors ${
                              att.status === 'present'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-bg text-muted hover:text-text border border-border'
                            }`}
                            title="Mark Present"
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(emp.id, 'absent')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-colors ${
                              att.status === 'absent'
                                ? 'bg-danger text-white'
                                : 'bg-bg text-muted hover:text-text border border-border'
                            }`}
                            title="Mark Absent"
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(emp.id, 'half_day')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-colors ${
                              att.status === 'half_day'
                                ? 'bg-amber-600 text-white'
                                : 'bg-bg text-muted hover:text-text border border-border'
                            }`}
                            title="Mark Half-Day"
                          >
                            HD
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(emp.id, 'on_leave')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium cursor-pointer transition-colors ${
                              att.status === 'on_leave'
                                ? 'bg-purple-600 text-white'
                                : 'bg-bg text-muted hover:text-text border border-border'
                            }`}
                            title="Mark On Leave"
                          >
                            L
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log punch timing modal */}
      {modalEmployee && (
        <Modal
          isOpen={Boolean(modalEmployee)}
          onClose={() => setModalEmployee(null)}
          title={`Log Shift Timings: ${modalEmployee.full_name}`}
          size="md"
        >
          <div className="space-y-4 text-text min-w-0">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="check-in-time"
                label="Check In Time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
              <Input
                id="check-out-time"
                label="Check Out Time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
            <Input
              id="att-notes"
              label="Shift Remarks / Late Reason"
              placeholder="e.g. Traffic delay, regular shift"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalEmployee(null)}>
                Cancel
              </Button>
              <Button variant="solid" onClick={handleSavePunch}>
                Save Timings
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
