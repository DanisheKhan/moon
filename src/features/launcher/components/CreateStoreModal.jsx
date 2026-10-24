import { useState } from 'react';
import { Modal, Input, Button } from '@/shared/ui';

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
    if (!form.name.trim() || !form.gstin.trim() || !form.city.trim() || !form.address_line1.trim()) {
      setError('Store name, GSTIN, city, and location are required.');
      return;
    }

    onCreate({
      name: form.name.trim(),
      gstin: form.gstin.trim().toUpperCase(),
      manager_name: form.manager_name.trim() || 'Unassigned',
      city: form.city.trim(),
      address_line1: form.address_line1.trim(),
      pincode: form.pincode.trim(),
      phone: form.phone.trim(),
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
          />
          <Input
            id="new-store-gstin"
            label="GSTIN"
            value={form.gstin}
            onChange={(e) => update('gstin', e.target.value)}
            placeholder="27AAAAA0000A1Z5"
          />
          <Input
            id="new-store-manager"
            label="Manager name"
            value={form.manager_name}
            onChange={(e) => update('manager_name', e.target.value)}
            placeholder="Amit Sharma"
          />
          <Input
            id="new-store-city"
            label="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="Mumbai"
          />
          <div className="sm:col-span-2 min-w-0">
            <Input
              id="new-store-location"
              label="Location"
              value={form.address_line1}
              onChange={(e) => update('address_line1', e.target.value)}
              placeholder="Shop 103, Main Road Market"
            />
          </div>
          <Input
            id="new-store-pincode"
            label="Pincode"
            value={form.pincode}
            onChange={(e) => update('pincode', e.target.value)}
            placeholder="400001"
          />
          <Input
            id="new-store-phone"
            label="Phone"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+91 98200 12347"
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
