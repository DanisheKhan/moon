import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/shared/ui';
import { useUpsertStaffProfile } from '../hooks/useStaff';
import { useStores } from '@/features/stores';
import { getErrorMessage } from '@/shared/lib/errors';
import { formatCurrency } from '@/shared/lib/format';
import { isValidIndianPhone, isValidEmail, cleanPhone } from '@/shared/lib/validation';

function StaffForm({ staffToEdit, stores, onClose }) {
  const upsertMutation = useUpsertStaffProfile();

  const [formData, setFormData] = useState(() => {
    if (staffToEdit) {
      return {
        id: staffToEdit.id,
        employee_code: staffToEdit.employee_code || '',
        full_name: staffToEdit.full_name || '',
        email: staffToEdit.email || '',
        phone: staffToEdit.phone || '',
        designation: staffToEdit.designation || 'Senior Cashier',
        department: staffToEdit.department || 'Store Operations',
        primary_store_id: staffToEdit.primary_store_id || '',
        base_salary: String(staffToEdit.base_salary || '30000'),
        emergency_phone: staffToEdit.emergency_phone || '',
        bank_name: staffToEdit.bank_name || 'HDFC Bank',
        account_number: staffToEdit.account_number || '',
        ifsc_code: staffToEdit.ifsc_code || '',
        annual_leave_quota: String(staffToEdit.annual_leave_quota || '18'),
        status: staffToEdit.status || 'active',
      };
    }
    return {
      employee_code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      full_name: '',
      email: '',
      phone: '',
      designation: 'Senior Cashier',
      department: 'Store Operations',
      primary_store_id: stores[0]?.id || '',
      base_salary: '30000',
      emergency_phone: '',
      bank_name: 'HDFC Bank',
      account_number: '',
      ifsc_code: '',
      annual_leave_quota: '18',
      status: 'active',
    };
  });

  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.full_name?.trim()) {
      setError('Employee Full Name is mandatory.');
      return;
    }
    if (!isValidIndianPhone(formData.phone)) {
      setError('A valid 10-digit mobile phone number is mandatory (starts with 6-9).');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError('A valid Gmail or login email address is mandatory.');
      return;
    }
    if (!formData.primary_store_id) {
      setError('Please select an assigned store branch for this staff member.');
      return;
    }
    const salary = parseFloat(formData.base_salary);
    if (isNaN(salary) || salary <= 0) {
      setError('Monthly base salary must be greater than ₹0.');
      return;
    }

    setError('');
    try {
      await upsertMutation.mutateAsync({
        ...formData,
        full_name: formData.full_name.trim(),
        phone: cleanPhone(formData.phone),
        email: formData.email.trim().toLowerCase(),
        base_salary: Math.round(salary),
        annual_leave_quota: parseInt(formData.annual_leave_quota, 10) || 18,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const storeOptions = [
    { value: '', label: 'Select Store Assignment...' },
    ...stores.map((s) => ({ value: s.id, label: s.name })),
  ];

  const designationOptions = [
    { value: 'Store Manager', label: 'Store Manager' },
    { value: 'Senior Cashier', label: 'Senior Cashier' },
    { value: 'Inventory & QA Specialist', label: 'Inventory & QA Specialist' },
    { value: 'Sales Executive', label: 'Sales Executive' },
    { value: 'Logistics & Delivery Head', label: 'Logistics & Delivery Head' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active Employee' },
    { value: 'on_leave', label: 'On Extended Leave' },
    { value: 'inactive', label: 'Inactive / Suspended' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="emp-code"
          label="Employee Code"
          value={formData.employee_code}
          onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
          required
        />

        <Input
          id="emp-name"
          label="Full Name"
          placeholder="e.g. Imran Khan"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
        />

        <Input
          id="emp-email"
          type="email"
          label="Gmail / Login Email"
          placeholder="e.g. staff@starenterprises.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          id="emp-phone"
          label="Mobile Phone"
          type="tel"
          placeholder="9820011223"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          maxLength={10}
          required
        />

        <Select
          id="emp-store"
          label="Assigned Store Branch"
          value={formData.primary_store_id}
          onChange={(e) => setFormData({ ...formData, primary_store_id: e.target.value })}
          options={storeOptions}
          required
        />

        <Select
          id="emp-designation"
          label="Designation / Role"
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          options={designationOptions}
          required
        />

        <div>
          <Input
            id="emp-salary"
            type="number"
            label="Monthly Base Salary (₹)"
            value={formData.base_salary}
            onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
            required
          />
          {Number(formData.base_salary) > 0 && (
            <div className="mt-1 text-[11px] text-muted flex items-center justify-between">
              <span>Per Day Cost (Base ÷ 30):</span>
              <span className="font-semibold text-text font-mono">
                {formatCurrency(Math.round(Number(formData.base_salary) / 30))}/day
              </span>
            </div>
          )}
        </div>

        <Input
          id="emp-leave-quota"
          type="number"
          label="Annual Paid Leaves (Days)"
          value={formData.annual_leave_quota}
          onChange={(e) => setFormData({ ...formData, annual_leave_quota: e.target.value })}
          required
        />

        <Select
          id="emp-status"
          label="Employment Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={statusOptions}
        />

        <Input
          id="emp-emergency"
          label="Emergency Contact Phone"
          placeholder="+91 98200 99999"
          value={formData.emergency_phone}
          onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
        />
      </div>

      {/* Bank Details Section */}
      <div className="pt-2 border-t border-border space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">
          Bank Details for Salary Disbursal
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            id="emp-bank"
            label="Bank Name"
            placeholder="HDFC / SBI / ICICI"
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
          />
          <Input
            id="emp-acc"
            label="Account Number"
            placeholder="5010049281928"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
          />
          <Input
            id="emp-ifsc"
            label="IFSC Code"
            placeholder="HDFC0001234"
            value={formData.ifsc_code}
            onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-border flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="solid" pending={upsertMutation.isPending}>
          {staffToEdit ? 'Save Profile Changes' : 'Confirm Onboarding'}
        </Button>
      </div>
    </form>
  );
}

export function StaffModal({ isOpen, onClose, staffToEdit }) {
  const { data: stores = [] } = useStores();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={staffToEdit ? `Edit Staff: ${staffToEdit.full_name}` : 'Onboard New Staff Member'}
      className="max-w-2xl"
    >
      <StaffForm
        key={staffToEdit?.id || 'new'}
        staffToEdit={staffToEdit}
        stores={stores}
        onClose={onClose}
      />
    </Modal>
  );
}
