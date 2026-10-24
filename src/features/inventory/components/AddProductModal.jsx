import { useState, useMemo } from 'react';
import { Modal, Button, Input, Select } from '@/shared/ui';
import { useCreateProduct, useCategories, useCreateCategory } from '../hooks/useInventory';
import { getErrorMessage } from '@/shared/lib/errors';
import { Plus, FolderPlus, Check } from 'lucide-react';

export function AddProductModal({ storeId, storeCode = 'mobiles', isOpen, onClose }) {
  const createProductMutation = useCreateProduct();
  const createCategoryMutation = useCreateCategory();
  const { data: dbCategories = [] } = useCategories(storeId);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [gstRate, setGstRate] = useState('18');
  const [isSerialized, setIsSerialized] = useState(storeCode === 'mobiles');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  // Custom Category Inline Creation
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatHsn, setNewCatHsn] = useState('');
  const [newCatSuccess, setNewCatSuccess] = useState('');

  const isMobileStore = storeCode === 'mobiles';

  const categoryOptions = useMemo(() => {
    const list = dbCategories.map((c) => ({ value: c.id, label: c.name }));
    return [
      { value: '', label: '-- Select Category --' },
      ...list,
      { value: '__create_new__', label: '+ Add New Custom Category...' },
    ];
  }, [dbCategories]);

  async function handleQuickCreateCategory(e) {
    e?.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const created = await createCategoryMutation.mutateAsync({
        storeId,
        name: newCatName.trim(),
        hsnCode: newCatHsn.trim() || null,
      });
      setCategoryId(created.id);
      setNewCatSuccess(`Added "${created.name}"`);
      setTimeout(() => {
        setNewCatSuccess('');
        setShowNewCatInput(false);
        setNewCatName('');
        setNewCatHsn('');
      }, 900);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !sellingPrice) {
      setError('Product name, SKU code, and selling price are required.');
      return;
    }

    const sp = parseFloat(sellingPrice);
    const cp = parseFloat(costPrice) || 0;

    setError('');
    try {
      await createProductMutation.mutateAsync({
        store_id: storeId,
        category_id: categoryId || (dbCategories[0]?.id || null),
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: sku.trim().toUpperCase(),
        selling_price: sp,
        cost_price: cp,
        min_selling_price: cp,
        gst_rate: !isNaN(parseInt(gstRate, 10)) ? parseInt(gstRate, 10) : 18,
        is_serialized: isSerialized,
        description: description.trim() || `${name.trim()} available at Star Enterprises.`,
        image_url: imageUrl.trim() || null,
        is_active: true,
      });
      onClose();
      setName('');
      setSku('');
      setCategoryId('');
      setSellingPrice('');
      setCostPrice('');
      setDescription('');
      setImageUrl('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Product to Store Catalog"
      size="lg"
    >
      <form onSubmit={handleCreateSubmit} className="space-y-4 text-text min-w-0">
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        <Input
          id="prod-name"
          label="Product Full Name"
          placeholder="e.g. OnePlus 12R 256GB / 3-Seater Fabric Recliner Sofa"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!sku) {
              setSku(`SKU-${e.target.value.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
            }
          }}
          required
        />

        {/* Category Selector with Inline Custom Category Creation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="prod-category" className="text-xs font-medium text-text uppercase tracking-wider">
              PRODUCT CATEGORY
            </label>
            <button
              type="button"
              onClick={() => setShowNewCatInput((prev) => !prev)}
              className="text-xs font-medium text-text hover:text-accent cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <FolderPlus size={13} />
              <span>{showNewCatInput ? 'Hide Custom Category' : '+ Add Custom Category'}</span>
            </button>
          </div>

          <Select
            id="prod-category"
            value={categoryId}
            onChange={(e) => {
              if (e.target.value === '__create_new__') {
                setShowNewCatInput(true);
              } else {
                setCategoryId(e.target.value);
              }
            }}
            options={categoryOptions}
          />

          {showNewCatInput && (
            <div className="p-3 rounded-xl border border-border bg-surface space-y-3 mt-2">
              <span className="text-[11px] font-medium text-text block">
                Create & Save New Category to Database:
              </span>
              {newCatSuccess && (
                <div className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                  <Check size={13} /> {newCatSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="new-inline-cat-name"
                  placeholder="Category Name (e.g. Gaming Chairs)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <Input
                  id="new-inline-cat-hsn"
                  placeholder="HSN Code (e.g. 9401)"
                  value={newCatHsn}
                  onChange={(e) => setNewCatHsn(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCatInput(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="solid"
                  size="sm"
                  pending={createCategoryMutation.isPending}
                  onClick={handleQuickCreateCategory}
                  className="gap-1.5"
                >
                  <Plus size={13} /> Save Category
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="prod-sku"
            label="Product SKU Code"
            placeholder="e.g. 1PL-12R-256 / FUR-SOFA-01"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />
          <Select
            id="prod-tracking"
            label="INVENTORY TRACKING MODE"
            value={isSerialized ? 'serialized' : 'batch'}
            onChange={(e) => setIsSerialized(e.target.value === 'serialized')}
            options={[
              {
                value: 'serialized',
                label: isMobileStore
                  ? 'Serialized (IMEI Units)'
                  : 'Serialized (Serial Units)',
              },
              {
                value: 'batch',
                label: 'Non-Serialized (Batch / Qty)',
              },
            ]}
            hint={
              isSerialized
                ? (isMobileStore ? 'Unique IMEI tracking per device' : 'Unique Serial Number tracking')
                : 'Standard bulk stock tracked by total quantity'
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Input
            id="prod-selling-price"
            type="number"
            label="Selling Price (₹)"
            placeholder="42999"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            required
          />
          <Input
            id="prod-cost-price"
            type="number"
            label="Cost Price (₹)"
            placeholder="36000"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            required
          />
          <Select
            id="prod-gst"
            label="GST Tax Rate"
            value={gstRate}
            onChange={(e) => setGstRate(e.target.value)}
            options={[
              { value: '18', label: '18% GST' },
              { value: '12', label: '12% GST' },
              { value: '5', label: '5% GST' },
              { value: '28', label: '28% GST' },
              { value: '0', label: '0% GST (Nil Rated / Exempt)' },
            ]}
          />
        </div>

        <Input
          id="prod-desc"
          label="Product Description / Specs"
          placeholder="Short specifications overview for billing and customer receipts"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Input
          id="prod-img"
          label="Product Image URL (Optional)"
          placeholder="e.g. /images/products/phone.jpg or https://..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="px-5">
            Cancel
          </Button>
          <Button type="submit" variant="solid" pending={createProductMutation.isPending} className="gap-2 px-5">
            <Plus size={15} /> Add Product to Catalog
          </Button>
        </div>
      </form>
    </Modal>
  );
}
