import { useState } from 'react';
import { Modal, Input, Button } from '@/shared/ui';
import { isValidIndianPhone, isValidGstin, isValidPincode, cleanPhone } from '@/shared/lib/validation';

const EMPTY_FORM = {
  name: '',
  gstin: '',
  manager_name: '',
  city: '',
  address_line1: '',
  pincode: '',
  phone: '',
};

export function CreateStoreModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setError('');
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Store Name is mandatory.');
      return;
    }
    if (!isValidGstin(form.gstin)) {
      setError('A valid 15-character GSTIN is mandatory (e.g. 27AAAAA0000A1Z5).');
      return;
    }
    if (!form.manager_name.trim()) {
      setError('Store Manager Name is mandatory.');
      return;
    }
    if (!form.city.trim() || !form.address_line1.trim()) {
      setError('City and Store Location address are mandatory.');
      return;
    }
    if (!isValidPincode(form.pincode)) {
      setError('A valid 6-digit PIN code is mandatory (e.g. 400001).');
      return;
    }
    if (!isValidIndianPhone(form.phone)) {
      setError('A valid 10-digit store contact phone is mandatory (starts with 6-9).');
      return;
    }

    onCreate({
      name: form.name.trim(),
      gstin: form.gstin.trim().toUpperCase(),
      manager_name: form.manager_name.trim(),
      city: form.city.trim(),
      address_line1: form.address_line1.trim(),
      pincode: form.pincode.trim(),
      phone: cleanPhone(form.phone),
    });

    setForm(EMPTY_FORM);
    setError('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create new store" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
        <p className="text-sm text-muted">
          Add another branch to the owner portal. You can open it from the store cards after saving.
        </p>

        {error ? (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <Input
            id="new-store-name"
            label="Store name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Star Appliances"
            required
          />
          <Input
            id="new-store-gstin"
            label="GSTIN"
            value={form.gstin}
            onChange={(e) => update('gstin', e.target.value)}
            placeholder="27AAAAA0000A1Z5"
            maxLength={15}
            className="font-mono uppercase"
            required
          />
          <Input
            id="new-store-manager"
            label="Manager name"
            value={form.manager_name}
            onChange={(e) => update('manager_name', e.target.value)}
            placeholder="Amit Sharma"
            required
          />
          <Input
            id="new-store-city"
            label="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="Mumbai"
            required
          />
          <div className="sm:col-span-2 min-w-0">
            <Input
              id="new-store-location"
              label="Location"
              value={form.address_line1}
              onChange={(e) => update('address_line1', e.target.value)}
              placeholder="Shop 103, Main Road Market"
              required
            />
          </div>
          <Input
            id="new-store-pincode"
            label="Pincode"
            value={form.pincode}
            onChange={(e) => update('pincode', e.target.value)}
            placeholder="400001"
            maxLength={6}
            required
          />
          <Input
            id="new-store-phone"
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="9820012347"
            maxLength={10}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="solid" size="sm" type="submit">
            Save store
          </Button>
        </div>
      </form>
    </Modal>
  );
}
