import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/shared/ui';
import { useUpdateProduct } from '../hooks/useInventory';
import { StockAdjustmentForm } from './StockAdjustmentModal';
import { getErrorMessage } from '@/shared/lib/errors';
import { cn } from '@/shared/lib/cn';
import { Pencil, Check, Boxes } from 'lucide-react';

export function EditProductModal({
  product,
  storeId,
  isOpen,
  onClose,
  initialTab = 'details',
  onOpenAdjustStock,
}) {
  const updateProductMutation = useUpdateProduct();

  const [activeTab, setActiveTab] = useState(initialTab || 'details');
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

  const currentQty = product?.inventory?.[0]?.quantity_on_hand ?? 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name cannot be empty.');
      return;
    }
    if (!sku.trim()) {
      setError('Product SKU code is mandatory.');
      return;
    }
    const sp = parseFloat(sellingPrice);
    if (isNaN(sp) || sp <= 0) {
      setError('Please provide a valid selling price greater than ₹0.');
      return;
    }
    const cp = parseFloat(costPrice) || 0;
    if (isNaN(cp) || cp < 0) {
      setError('Please provide a valid non-negative cost price.');
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
      title={`Manage Product: ${product.name}`}
      size="xl"
    >
      <div className="space-y-4 text-text min-w-0">
        {/* Navigation Tabs */}
        <div className="flex border-b border-border text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={cn(
              'px-4 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2',
              activeTab === 'details'
                ? 'border-brand-sage text-brand-sage font-semibold'
                : 'border-transparent text-muted hover:text-text'
            )}
          >
            <Pencil size={14} />
            <span>Product Details & Pricing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={cn(
              'px-4 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2',
              activeTab === 'stock'
                ? 'border-brand-sage text-brand-sage font-semibold'
                : 'border-transparent text-muted hover:text-text'
            )}
          >
            <Boxes size={14} />
            <span>Stock & Inventory ({currentQty} on hand)</span>
          </button>
        </div>

        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-text min-w-0">
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-brand-sage-border bg-brand-sage-subtle p-3 text-xs text-brand-sage-text font-medium flex items-center gap-2">
                <Check size={14} className="text-brand-sage" /> Product updated successfully!
              </div>
            )}

            {/* Current Stock Ribbon with 1-click switch to Stock tab */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-subtle shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted block tracking-wider">
                  Warehouse Stock Level
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-base font-bold font-mono text-text">
                    {currentQty} units
                  </span>
                  <span className="text-[11px] text-muted">
                    {product.is_serialized ? '(Serialized Unit Tracking)' : '(Standard Batch)'}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (onOpenAdjustStock) {
                    onOpenAdjustStock(product);
                  } else {
                    setActiveTab('stock');
                  }
                }}
                className="text-xs font-semibold gap-1.5 border-border hover:border-brand-sage text-text cursor-pointer"
              >
                <Boxes size={13} className="text-brand-sage" />
                <span>Adjust Stock & Serials →</span>
              </Button>
            </div>

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
                required
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
                required
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
        ) : (
          <StockAdjustmentForm
            product={product}
            storeId={storeId || product.store_id}
            onClose={onClose}
          />
        )}
      </div>
    </Modal>
  );
}
