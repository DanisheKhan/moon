import { useState } from 'react';
import { Modal, Button, Input, Select, Badge } from '@/shared/ui';
import { useUpdatePricing } from '../hooks/useInventory';
import { formatCurrency } from '@/shared/lib/format';
import { getErrorMessage } from '@/shared/lib/errors';
import { Tag } from 'lucide-react';

function EditPricingForm({ product, onClose }) {
  const updatePricingMutation = useUpdatePricing();

  const [sellingPrice, setSellingPrice] = useState(String(product.selling_price || ''));
  const [costPrice, setCostPrice] = useState(String(product.cost_price || ''));
  const [minSellingPrice, setMinSellingPrice] = useState(String(product.min_selling_price || ''));
  const [gstRate, setGstRate] = useState(String(product.gst_rate || '18'));
  const [error, setError] = useState('');

  const sp = parseFloat(sellingPrice) || 0;
  const cp = parseFloat(costPrice) || 0;
  const marginAmt = sp - cp;
  const marginPct = sp > 0 ? ((marginAmt / sp) * 100).toFixed(1) : 0;

  async function handlePriceSubmit(e) {
    e.preventDefault();
    if (isNaN(sp) || sp <= 0) {
      setError('Please provide a valid selling price.');
      return;
    }

    const minSp = parseFloat(minSellingPrice) || cp;
    if (minSp > sp) {
      setError('Minimum floor price cannot exceed the official selling price.');
      return;
    }

    setError('');
    try {
      await updatePricingMutation.mutateAsync({
        productId: product.id,
        sellingPrice: sp,
        costPrice: cp,
        minSellingPrice: minSp,
        gstRate: !isNaN(parseInt(gstRate, 10)) ? parseInt(gstRate, 10) : 18,
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handlePriceSubmit} className="space-y-5 text-text min-w-0">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger font-medium">
          {error}
        </div>
      )}

      {/* Structured Pricing Snapshot Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-bg/60">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1">
            Current Listed Price
          </span>
          <span className="text-xl font-bold font-mono text-text">
            {formatCurrency(product.selling_price)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1">
            Product SKU
          </span>
          <span className="font-mono text-xs font-medium text-text bg-surface px-2.5 py-1 rounded-lg border border-border inline-block">
            {product.sku}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted font-medium block mb-1">
            Est. Gross Margin
          </span>
          <Badge variant={marginAmt >= 0 ? 'success' : 'danger'} className="text-xs">
            {marginPct}% ({formatCurrency(marginAmt)})
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="selling-price"
          type="number"
          label="Selling Price (₹)"
          placeholder="e.g. 42999"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          required
        />
        <Input
          id="cost-price"
          type="number"
          label="Purchase Cost Price (₹)"
          placeholder="e.g. 36000"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="min-selling-price"
          type="number"
          label="Minimum Floor Price (₹)"
          placeholder="e.g. 39999"
          value={minSellingPrice}
          onChange={(e) => setMinSellingPrice(e.target.value)}
          required
        />
        <Select
          id="gst-rate"
          label="GST Tax Rate"
          value={gstRate}
          onChange={(e) => setGstRate(e.target.value)}
          options={[
            { value: '18', label: '18% GST (Mobiles & Electronics)' },
            { value: '12', label: '12% GST (Furniture & Apparel)' },
            { value: '5', label: '5% GST (Standard Accessories)' },
            { value: '28', label: '28% GST (Luxury Goods / ACs)' },
            { value: '0', label: '0% GST (Nil Rated / Exempt)' },
          ]}
        />
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="px-6 h-11 text-xs font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="solid"
          pending={updatePricingMutation.isPending}
          className="gap-2 px-6 h-11 text-xs font-medium"
        >
          <Tag size={15} /> Save Pricing Changes
        </Button>
      </div>
    </form>
  );
}

export function EditPricingModal({ product, isOpen, onClose }) {
  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Pricing & GST: ${product.name}`}
      size="lg"
    >
      <EditPricingForm key={product.id} product={product} onClose={onClose} />
    </Modal>
  );
}
