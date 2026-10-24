import { useState } from 'react';
import { Badge } from '@/shared/ui';
import {
  ShieldCheck,
  Check,
  Key,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';

const INITIAL_ROLES = [
  {
    id: 'superadmin',
    name: 'Superadmin',
    description: 'Master owner privileges. Unrestricted access across all branches, ledger, and settings.',
    badge: 'Owner Access',
    usersCount: 1,
  },
  {
    id: 'store_manager',
    name: 'Store Manager',
    description: 'Operational manager. Oversees local inventory, daily cash counters, and staff attendance.',
    badge: 'Store Lead',
    usersCount: 2,
  },
  {
    id: 'cashier',
    name: 'POS Cashier',
    description: 'Front-desk point of sale operator. Can register customers, checkout bills, and take payments.',
    badge: 'POS Terminal',
    usersCount: 3,
  },
  {
    id: 'inventory_clerk',
    name: 'Inventory Clerk',
    description: 'Warehouse and stock handler. Manages IMEI/Serial intakes and physical stock adjustments.',
    badge: 'Stock Handler',
    usersCount: 2,
  },
];

const PERMISSION_MODULES = [
  {
    name: 'POS & Billing Terminal',
    icon: ShoppingBag,
    permissions: [
      { id: 'pos_create_invoice', label: 'Create and generate tax invoices' },
      { id: 'pos_apply_discount', label: 'Apply custom price discounts / price override' },
      { id: 'pos_void_invoice', label: 'Void or cancel generated invoices' },
      { id: 'pos_print_reprint', label: 'Print thermal / A4 duplicate tax receipts' },
    ],
  },
  {
    name: 'Catalog & Inventory Management',
    icon: Package,
    permissions: [
      { id: 'inv_view_catalog', label: 'View all products and live inventory stock counts' },
      { id: 'inv_add_product', label: 'Add new products and serialized units (IMEI)' },
      { id: 'inv_edit_product', label: 'Edit product details, selling prices, and GST rates' },
      { id: 'inv_delete_product', label: 'Delete or deactivate catalog products' },
      { id: 'inv_adjust_stock', label: 'Conduct physical stock adjustments and discrepancy audits' },
    ],
  },
  {
    name: 'Staff & Human Resources (HRMS)',
    icon: Users,
    permissions: [
      { id: 'staff_view_dir', label: 'View staff directory and contact profiles' },
      { id: 'staff_mark_attendance', label: 'Record and edit daily staff attendance and shifts' },
      { id: 'staff_review_leaves', label: 'Review and approve/reject employee leave requests' },
      { id: 'staff_disburse_payroll', label: 'Disburse monthly salaries and generate payslips' },
    ],
  },
  {
    name: 'Executive Reports & Financials',
    icon: BarChart3,
    permissions: [
      { id: 'rep_view_daily', label: 'View branch daily sales and revenue charts' },
      { id: 'rep_view_master_ledger', label: 'Access consolidated multi-store master ledger' },
      { id: 'rep_gstr1_export', label: 'Export official GSTR-1 government tax filings' },
    ],
  },
  {
    name: 'System & Security Settings',
    icon: Settings,
    permissions: [
      { id: 'sys_edit_store', label: 'Modify store profile, GSTIN, and branch locations' },
      { id: 'sys_manage_roles', label: 'Edit roles and permissions matrix' },
    ],
  },
];

const DEFAULT_MATRIX = {
  superadmin: {
    pos_create_invoice: true,
    pos_apply_discount: true,
    pos_void_invoice: true,
    pos_print_reprint: true,
    inv_view_catalog: true,
    inv_add_product: true,
    inv_edit_product: true,
    inv_delete_product: true,
    inv_adjust_stock: true,
    staff_view_dir: true,
    staff_mark_attendance: true,
    staff_review_leaves: true,
    staff_disburse_payroll: true,
    rep_view_daily: true,
    rep_view_master_ledger: true,
    rep_gstr1_export: true,
    sys_edit_store: true,
    sys_manage_roles: true,
  },
  store_manager: {
    pos_create_invoice: true,
    pos_apply_discount: true,
    pos_void_invoice: false,
    pos_print_reprint: true,
    inv_view_catalog: true,
    inv_add_product: true,
    inv_edit_product: true,
    inv_delete_product: false,
    inv_adjust_stock: true,
    staff_view_dir: true,
    staff_mark_attendance: true,
    staff_review_leaves: true,
    staff_disburse_payroll: false,
    rep_view_daily: true,
    rep_view_master_ledger: false,
    rep_gstr1_export: false,
    sys_edit_store: false,
    sys_manage_roles: false,
  },
  cashier: {
    pos_create_invoice: true,
    pos_apply_discount: false,
    pos_void_invoice: false,
    pos_print_reprint: true,
    inv_view_catalog: true,
    inv_add_product: false,
    inv_edit_product: false,
    inv_delete_product: false,
    inv_adjust_stock: false,
    staff_view_dir: false,
    staff_mark_attendance: false,
    staff_review_leaves: false,
    staff_disburse_payroll: false,
    rep_view_daily: false,
    rep_view_master_ledger: false,
    rep_gstr1_export: false,
    sys_edit_store: false,
    sys_manage_roles: false,
  },
  inventory_clerk: {
    pos_create_invoice: false,
    pos_apply_discount: false,
    pos_void_invoice: false,
    pos_print_reprint: false,
    inv_view_catalog: true,
    inv_add_product: true,
    inv_edit_product: true,
    inv_delete_product: false,
    inv_adjust_stock: true,
    staff_view_dir: false,
    staff_mark_attendance: false,
    staff_review_leaves: false,
    staff_disburse_payroll: false,
    rep_view_daily: false,
    rep_view_master_ledger: false,
    rep_gstr1_export: false,
    sys_edit_store: false,
    sys_manage_roles: false,
  },
};

export function RolesPermissionsPage() {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [selectedRole, setSelectedRole] = useState('superadmin');
  const [savedSuccess, setSavedSuccess] = useState(false);

  function togglePermission(roleId, permId) {
    if (roleId === 'superadmin') return; // Superadmin always has full access
    setMatrix((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permId]: !prev[roleId]?.[permId],
      },
    }));
  }

  function handleSave() {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted block mb-1">
            ACCESS CONTROL & SECURITY
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-text">
            Roles & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Configure system capabilities, module access, and managerial override powers by position.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-text text-bg hover:opacity-90 font-medium text-xs sm:text-sm px-4 py-2 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs"
        >
          {savedSuccess ? (
            <>
              <Check size={16} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Save Permissions Matrix</span>
            </>
          )}
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {INITIAL_ROLES.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer space-y-2.5 shadow-2xs ${
                isSelected
                  ? 'border-text bg-surface ring-1 ring-text/20'
                  : 'border-border bg-surface hover:border-text/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-text">{role.name}</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-bg border border-border text-muted">
                  {role.badge}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed line-clamp-2">
                {role.description}
              </p>
              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted">
                <span>{role.usersCount} Active Staff</span>
                <span className="font-medium text-text">
                  {isSelected ? 'Editing' : 'Select'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden space-y-6 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-text">
              <Key size={15} />
            </div>
            <div>
              <h2 className="text-base font-medium text-text">
                Permissions for {INITIAL_ROLES.find((r) => r.id === selectedRole)?.name}
              </h2>
              <p className="text-xs text-muted">
                {selectedRole === 'superadmin'
                  ? 'Superadmin holds permanent owner permissions across all domains.'
                  : 'Click any checkbox to grant or restrict this permission for this role.'}
              </p>
            </div>
          </div>
          <Badge variant={selectedRole === 'superadmin' ? 'accent' : 'default'} className="font-medium">
            {selectedRole === 'superadmin' ? 'Immutable Root' : 'Customizable'}
          </Badge>
        </div>

        <div className="space-y-6">
          {PERMISSION_MODULES.map((module) => {
            const ModIcon = module.icon;
            return (
              <div key={module.name} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-text uppercase tracking-wider">
                  <ModIcon size={14} className="text-muted" />
                  <span>{module.name}</span>
                </div>

                <div className="divide-y divide-border border border-border rounded-lg bg-bg/40 overflow-hidden">
                  {module.permissions.map((perm) => {
                    const isGranted = Boolean(matrix[selectedRole]?.[perm.id]);
                    const isSuper = selectedRole === 'superadmin';

                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(selectedRole, perm.id)}
                        className={`p-3.5 flex items-center justify-between gap-4 transition-colors select-none ${
                          isSuper
                            ? 'cursor-default opacity-90'
                            : 'cursor-pointer hover:bg-surface'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-text">{perm.label}</div>
                          <div className="text-[10px] font-mono text-muted">{perm.id}</div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                              isGranted
                                ? 'bg-text text-bg'
                                : 'border border-border bg-surface'
                            }`}
                          >
                            {isGranted && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
