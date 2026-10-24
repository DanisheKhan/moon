import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/shared/ui';
import { useUpdateProduct } from '../hooks/useInventory';
import { getErrorMessage } from '@/shared/lib/errors';
import { Pencil, Check } from 'lucide-react';

export function EditProductModal({ product, isOpen, onClose }) {
  const updateProductMutation = useUpdateProduct();

  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [sellingPrice, setSellingPrice] = useState(String(product?.selling_price || ''));
  const [costPrice, setCostPrice] = useState(String(product?.cost_price || ''));
  const [minSellingPrice, setMinSellingPrice] = useState(String(product?.min_selling_price || ''));
  const [gstRate, setGstRate] = useState(String(product?.gst_rate || '18'));
  const [reorderLevel, setReorderLevel] = useState(String(product?.reorder_level || '5'));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!product) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name cannot be empty.');
      return;
    }
    const sp = parseFloat(sellingPrice);
    if (isNaN(sp) || sp < 0) {
      setError('Please provide a valid selling price.');
      return;
    }

    setError('');
    try {
      await updateProductMutation.mutateAsync({
        productId: product.id,
        updates: {
          name: name.trim(),
          sku: sku.trim(),
          selling_price: sp,
          cost_price: parseFloat(costPrice) || 0,
          min_selling_price: parseFloat(minSellingPrice) || sp,
          gst_rate: !isNaN(parseInt(gstRate, 10)) ? parseInt(gstRate, 10) : 18,
          reorder_level: parseInt(reorderLevel, 10) || 5,
        },
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Product: ${product.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-text min-w-0">
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 font-medium flex items-center gap-2">
            <Check size={14} /> Product updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="edit-prod-name"
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            id="edit-prod-sku"
            label="SKU / Barcode"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="edit-prod-sp"
            type="number"
            label="Selling Price (₹)"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            required
          />
          <Input
            id="edit-prod-cp"
            type="number"
            label="Cost Price (₹)"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="edit-prod-min-sp"
            type="number"
            label="Floor Price (₹)"
            value={minSellingPrice}
            onChange={(e) => setMinSellingPrice(e.target.value)}
          />
          <Select
            id="edit-prod-gst"
            label="GST Rate"
            value={gstRate}
            onChange={(e) => setGstRate(e.target.value)}
            options={[
              { value: '18', label: '18% GST (Mobiles/Elec)' },
              { value: '12', label: '12% GST (Furniture)' },
              { value: '5', label: '5% GST (Accessories)' },
              { value: '28', label: '28% GST (Luxury)' },
              { value: '0', label: '0% GST (Nil Rated / Exempt)' },
            ]}
          />
          <Input
            id="edit-prod-reorder"
            type="number"
            label="Reorder Alert Qty"
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="solid"
            pending={updateProductMutation.isPending}
            className="gap-2"
          >
            <Pencil size={14} /> Save Product
          </Button>
        </div>
      </form>
    </Modal>
  );
}
