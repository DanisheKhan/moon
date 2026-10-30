import { supabase } from '@/shared/lib/supabase';
import { getPersistentCache, setPersistentCache } from '@/shared/lib/cachePersistence';

/**
 * Lists all staff members with their store assignment
 */
export async function listStaffProfiles() {
  try {
    const { data, error } = await supabase
      .from('staff_profiles')
      .select(`
        id, employee_code, full_name, email, phone, designation, department,
        primary_store_id, joining_date, emergency_phone, base_salary,
        bank_name, account_number, ifsc_code, annual_leave_quota, status, created_at,
        stores (id, code, name)
      `)
      .order('employee_code');

    if (error) throw error;
    const profiles = data || [];
    setPersistentCache('staff_profiles', profiles);
    return profiles;
  } catch (err) {
    console.warn('[Staff API] Network error loading staff profiles, using cache:', err);
    return getPersistentCache('staff_profiles') || [];
  }
}

/**
 * Creates or updates a staff profile
 */
export async function upsertStaffProfile(payload) {
  const { data, error } = await supabase
    .from('staff_profiles')
    .upsert(payload)
    .select(`
      id, employee_code, full_name, email, phone, designation, department,
      primary_store_id, joining_date, emergency_phone, base_salary,
      bank_name, account_number, ifsc_code, annual_leave_quota, status
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deactivates or updates status of a staff member
 */
export async function updateStaffStatus(staffId, status) {
  const { data, error } = await supabase
    .from('staff_profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', staffId)
    .select('id, employee_code, status')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lists leave applications with staff details
 */
export async function listStaffLeaves({ status } = {}) {
  let query = supabase
    .from('staff_leaves')
    .select(`
      id, staff_id, leave_type, start_date, end_date, total_days,
      reason, status, reviewed_by, reviewed_at, review_notes, created_at,
      staff_profiles (id, employee_code, full_name, email, designation, annual_leave_quota, stores (name, code))
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Submits a new leave request (from staff)
 */
export async function submitLeaveRequest(payload) {
  const { data, error } = await supabase
    .from('staff_leaves')
    .insert(payload)
    .select('id, staff_id, leave_type, start_date, end_date, total_days, reason, status')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reviews a leave request (Owner action: approve or reject)
 */
export async function reviewLeaveRequest({ leaveId, status, reviewNotes, reviewerName = 'Store Owner' }) {
  const { data, error } = await supabase
    .from('staff_leaves')
    .update({
      status,
      review_notes: reviewNotes,
      reviewed_by: reviewerName,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', leaveId)
    .select('id, status, review_notes, reviewed_by, reviewed_at')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lists monthly payroll entries
 */
export async function listStaffSalaries({ monthYear } = {}) {
  let query = supabase
    .from('staff_salaries')
    .select(`
      id, staff_id, month_year, base_salary, allowances, deductions,
      net_salary, payment_status, payment_date, payment_method,
      transaction_ref, notes, created_at,
      staff_profiles (id, employee_code, full_name, email, designation, bank_name, account_number, stores (name, code))
    `)
    .order('created_at', { ascending: false });

  if (monthYear) {
    query = query.eq('month_year', monthYear);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Marks salary as paid with payment mode and transaction reference
 */
export async function markSalaryPaid({ salaryId, paymentMethod, transactionRef, notes }) {
  const { data, error } = await supabase
    .from('staff_salaries')
    .update({
      payment_status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      transaction_ref: transactionRef,
      notes: notes || null,
    })
    .eq('id', salaryId)
    .select('id, payment_status, payment_date, payment_method, transaction_ref')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Generates or updates monthly payroll for an employee
 */
export async function upsertSalaryRecord(payload) {
  const { data, error } = await supabase
    .from('staff_salaries')
    .upsert(payload, { onConflict: 'staff_id,month_year' })
    .select('id, staff_id, month_year, base_salary, allowances, deductions, net_salary, payment_status')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Grants leave to a staff member by owner, and automatically calculates and deducts
 * loss of pay from the employee's monthly payroll based on their per-day cost.
 */
export async function grantStaffLeave({
  staffId,
  leaveType = 'unpaid',
  startDate,
  endDate,
  totalDays,
  reason,
  deductSalary = true,
  monthYear = '2026-10',
  reviewerName = 'Store Owner',
}) {
  // 1. Insert approved leave into staff_leaves
  const { data: leaveRecord, error: leaveError } = await supabase
    .from('staff_leaves')
    .insert({
      staff_id: staffId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      total_days: Number(totalDays),
      reason: reason || `Leave granted by ${reviewerName}`,
      status: 'approved',
      reviewed_by: reviewerName,
      reviewed_at: new Date().toISOString(),
      review_notes: deductSalary
        ? `Approved by Owner with ${totalDays} days salary deduction`
        : 'Approved by Owner as paid leave',
    })
    .select('id, staff_id, leave_type, start_date, end_date, total_days, status')
    .single();

  if (leaveError) throw leaveError;

  // 2. If deductSalary is true, calculate deduction and update staff_salaries
  if (deductSalary) {
    // Fetch employee's current base salary
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('id, base_salary, full_name')
      .eq('id', staffId)
      .single();

    if (!staffError && staff) {
      const dailyCost = Math.round(Number(staff.base_salary || 0) / 30);
      const leaveDeduction = dailyCost * Number(totalDays);

      // Check if salary record already exists for this staff and monthYear
      const { data: existingSal } = await supabase
        .from('staff_salaries')
        .select('id, base_salary, allowances, deductions, net_salary, notes')
        .eq('staff_id', staffId)
        .eq('month_year', monthYear)
        .maybeSingle();

      const baseSalary = Number(existingSal?.base_salary ?? staff.base_salary ?? 0);
      const allowances = Number(existingSal?.allowances ?? 0);
      const prevDeductions = Number(existingSal?.deductions ?? 0);
      const newDeductions = prevDeductions + leaveDeduction;
      const netSalary = Math.max(0, baseSalary + allowances - newDeductions);
      const deductionNote = `${Number(totalDays)} days leave deduction (₹${leaveDeduction.toLocaleString('en-IN')} @ ₹${dailyCost}/day)`;
      const newNotes = existingSal?.notes
        ? `${existingSal.notes}; ${deductionNote}`
        : deductionNote;

      if (existingSal?.id) {
        await supabase
          .from('staff_salaries')
          .update({
            deductions: newDeductions,
            net_salary: netSalary,
            notes: newNotes,
          })
          .eq('id', existingSal.id);
      } else {
        await supabase
          .from('staff_salaries')
          .insert({
            staff_id: staffId,
            month_year: monthYear,
            base_salary: baseSalary,
            allowances: allowances,
            deductions: newDeductions,
            net_salary: netSalary,
            payment_status: 'unpaid',
            notes: newNotes,
          });
      }
    }
  }

  // 3. If leave covers current date, update staff status to 'on_leave'
  const today = new Date().toISOString().split('T')[0];
  if (startDate <= today && endDate >= today) {
    await supabase
      .from('staff_profiles')
      .update({ status: 'on_leave' })
      .eq('id', staffId);
  }

  return leaveRecord;
}

