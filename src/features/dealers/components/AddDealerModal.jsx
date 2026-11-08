import { useState } from 'react';
import { Modal, Button, Input } from '@/shared/ui';
import { useCreateDealer } from '../hooks/useDealers';
import { Building2, ShieldCheck, CreditCard } from 'lucide-react';

export function AddDealerModal({ isOpen, onClose, storeId }) {
  const createDealerMutation = useCreateDealer();

  const [formData, setFormData] = useState({
    name: '',
    brand_name: '',
    contact_person: '',
    phone: '',
    alternate_phone: '',
    email: '',
    address: '',
    city: 'Local',
    state_code: '09',
    gstin: '',
    pan_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    dealer_type: 'brand_direct',
    billing_mode: 'both',
    default_credit_days: 30,
    opening_balance: 0,
    notes: '',
  });

  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Dealer legal or firm name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Primary contact phone is required.');
      return;
    }

    try {
      await createDealerMutation.mutateAsync({
        ...formData,
        store_id: storeId || null,
      });
      onClose();
    } catch (err) {
      console.error('Failed to create dealer:', err);
      setErrorMsg(err.message || 'Error creating dealer profile. Please verify fields.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Dealer / Brand Supplier"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-brand-crimson-subtle border border-brand-crimson-border text-xs text-brand-crimson font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Brand Name */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Brand Display Name <span className="text-brand-crimson">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Godrej, Samsung, Onida..."
              value={formData.brand_name}
              onChange={(e) => handleChange('brand_name', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          {/* Legal Firm Name */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Full Legal Company / Firm Name <span className="text-brand-crimson">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Godrej Appliances Ltd / Sri Balaji Distributors"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Contact Person / Sales Manager
            </label>
            <input
              type="text"
              placeholder="e.g. Rajesh Sharma"
              value={formData.contact_person}
              onChange={(e) => handleChange('contact_person', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Mobile Phone <span className="text-brand-crimson">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Dealer Category
            </label>
            <select
              value={formData.dealer_type}
              onChange={(e) => handleChange('dealer_type', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            >
              <option value="brand_direct">Brand Direct (OEM / Corporate)</option>
              <option value="distributor">Regional Distributor / Stockist</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="local_vendor">Local / Cash Wholesaler</option>
            </select>
          </div>

          {/* Billing Mode */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Billing Ledger Mode
            </label>
            <select
              value={formData.billing_mode}
              onChange={(e) => handleChange('billing_mode', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            >
              <option value="both">Both GST (Pakka) & Kaccha (Estimates)</option>
              <option value="gst">Strictly GST Tax Invoices Only</option>
              <option value="kaccha">Kaccha / Slip Invoices Only</option>
            </select>
          </div>

          {/* GSTIN */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              GSTIN (If Tax Invoiced)
            </label>
            <input
              type="text"
              placeholder="e.g. 09AAACG1234F1Z5"
              value={formData.gstin}
              onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-surface text-text uppercase focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          {/* Credit Terms */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Default Credit Terms (Days)
            </label>
            <input
              type="number"
              min="0"
              max="180"
              placeholder="30"
              value={formData.default_credit_days}
              onChange={(e) => handleChange('default_credit_days', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>
        </div>

        {/* Banking / Payout Section */}
        <div className="pt-3 border-t border-border">
          <span className="text-[11px] font-bold uppercase text-muted tracking-wide block mb-2">
            Bank Details (For Direct NEFT / RTGS / UPI Payouts)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-muted mb-1">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank"
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1">Account Number</label>
              <input
                type="text"
                placeholder="Account number"
                value={formData.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-border bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1">IFSC Code / UPI ID</label>
              <input
                type="text"
                placeholder="IFSC or UPI ID"
                value={formData.ifsc_code}
                onChange={(e) => handleChange('ifsc_code', e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-border bg-surface text-text uppercase"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createDealerMutation.isPending}
          >
            {createDealerMutation.isPending ? 'Saving...' : 'Add Dealer Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
