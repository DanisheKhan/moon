import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
  Card,
  Badge,
  Modal,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/shared/ui';
import { useProducts, useProductUnits, useCreateProductUnit } from '../hooks/useInventory';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import { EditPricingModal } from '../components/EditPricingModal';
import { AddProductModal } from '../components/AddProductModal';
import { formatCurrency } from '@/shared/lib/format';
import { getErrorMessage } from '@/shared/lib/errors';
import { Plus, Sliders, Tag, AlertCircle, Eye } from 'lucide-react';

export function InventoryPage() {
  const { store } = useOutletContext();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState(null);
  const [productToEditPrice, setProductToEditPrice] = useState(null);

  // New Unit Form State
  const [newSerial, setNewSerial] = useState('');
  const [conditionGrade, setConditionGrade] = useState('new');
  const [batteryHealth, setBatteryHealth] = useState('100');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [formError, setFormError] = useState('');

  const { data: products = [], isLoading, error } = useProducts(store?.id);

  const { data: units = [], isLoading: unitsLoading } = useProductUnits(
    store?.id,
    selectedProduct?.id,
    null,
    {
      enabled: Boolean(store?.id && selectedProduct?.id && isUnitModalOpen),
    }
  );

  const createUnitMutation = useCreateProductUnit();

  async function handleAddUnit(e) {
    e.preventDefault();
    if (!newSerial.trim()) {
      setFormError('Serial / IMEI number is required.');
      return;
    }
    setFormError('');

    try {
      await createUnitMutation.mutateAsync({
        product_id: selectedProduct.id,
        store_id: store.id,
        serial_number: newSerial.trim(),
        condition_grade: conditionGrade,
        battery_health: store.code === 'mobiles' ? parseInt(batteryHealth, 10) || null : null,
        purchase_cost: parseFloat(purchaseCost) || 0,
        status: 'in_stock',
        warranty_months: 12,
      });
      setIsAddUnitOpen(false);
      setNewSerial('');
      setPurchaseCost('');
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  // Derive unique categories from full products list
  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'All Categories' },
      ...Array.from(
        new Map(
          products
            .filter((p) => p.categories)
            .map((p) => [p.categories.id, { value: p.categories.id, label: p.categories.name }])
        ).values()
      ),
    ],
    [products]
  );

  // Fast client-side filter
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) {
      list = list.filter(
        (p) => p.category_id === selectedCategory || p.categories?.id === selectedCategory
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, selectedCategory, search]);

  if (isLoading && products.length === 0) {
    return (
      <div className="py-12 text-center text-muted">
        Loading inventory for {store?.name}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-danger">
        {getErrorMessage(error)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text">
            {store?.name} Inventory
          </h1>
          <p className="text-sm text-muted">
            Manage catalog, serialized units (IMEI/Serial), pricing, and live stock adjustments.
          </p>
        </div>
        <Button
          variant="solid"
          size="sm"
          onClick={() => setIsAddProductOpen(true)}
          className="text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={14} /> Add Product to Catalog
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Input
            id="search-inventory"
            label="Search Catalog"
            placeholder="Search by name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            id="filter-category"
            label="Category"
            options={categoryOptions}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          />
        </div>
      </Card>

      {/* Products Table */}
      {products.length === 0 ? (
        <Card className="p-8 text-center text-muted">
          No products found matching the criteria.
        </Card>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Product & SKU</TableHeaderCell>
              <TableHeaderCell>Category / Brand</TableHeaderCell>
              <TableHeaderCell>Selling Price</TableHeaderCell>
              <TableHeaderCell>Stock Status</TableHeaderCell>
              <TableHeaderCell>Tracking</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted">
                  No products found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((prod) => {
                const qtyOnHand = prod.inventory?.[0]?.quantity_on_hand ?? 0;

                return (
                  <TableRow key={prod.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {prod.image_url && (
                          <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-border bg-surface">
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 w-full h-full object-cover block"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      <div className="min-w-0">
                        <div className="font-semibold text-text truncate max-w-48 leading-tight" title={prod.name}>
                          {prod.name}
                        </div>
                        <div className="text-xs text-muted font-mono leading-tight">{prod.sku}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-text truncate max-w-36 leading-tight">
                      {prod.categories?.name || 'Unassigned'}
                    </div>
                    {prod.brands?.name && prod.brands.name !== '-' && (
                      <div className="text-xs text-muted font-normal mt-0.5 truncate max-w-36 leading-tight">
                        {prod.brands.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="font-semibold">{formatCurrency(prod.selling_price)}</div>
                    <div className="text-xs text-muted">GST {prod.gst_rate}%</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{qtyOnHand}</span>
                      {qtyOnHand <= 0 ? (
                        <Badge variant="danger" className="h-5 text-xs">
                          Out of Stock
                        </Badge>
                      ) : qtyOnHand < 2 ? (
                        <Badge variant="danger" className="h-5 text-xs">
                          In Stock
                        </Badge>
                      ) : (
                        <Badge variant="success" className="h-5 text-xs">
                          In Stock
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {prod.is_serialized ? (
                      <Badge variant="accent" className="h-5">
                        Serialized ({store.code === 'mobiles' ? 'IMEI' : 'Serial'})
                      </Badge>
                    ) : (
                      <Badge variant="default" className="h-5">Quantity Batch</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap h-8">
                      {prod.is_serialized ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(prod);
                              setIsUnitModalOpen(true);
                            }}
                            className="h-7 text-xs py-1 px-2.5 gap-1 cursor-pointer hover:bg-bg"
                            title="View Serial / IMEI Units"
                          >
                            <Eye size={12} /> Units
                          </Button>
                          <Button
                            variant="solid"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(prod);
                              setIsAddUnitOpen(true);
                            }}
                            className="h-7 text-xs py-1 px-2.5 gap-1 cursor-pointer"
                            title="Add Single Serialized Unit"
                          >
                            <Plus size={12} /> Unit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProductToEditPrice(prod)}
                            className="h-7 text-xs py-1 px-2.5 gap-1 cursor-pointer hover:bg-bg"
                            title="Edit price & GST"
                          >
                            <Tag size={12} /> Price
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProductToAdjust(prod)}
                            className="h-7 text-xs py-1 px-2.5 gap-1 cursor-pointer hover:bg-bg"
                            title="Adjust physical stock quantity"
                          >
                            <Sliders size={12} /> Stock
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProductToEditPrice(prod)}
                            className="h-7 text-xs py-1 px-2.5 gap-1 cursor-pointer hover:bg-bg"
                            title="Edit price & GST"
                          >
                            <Tag size={12} /> Price
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }))}
          </TableBody>
        </Table>
      )}

      {/* Units Listing Modal */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={`Units for ${selectedProduct?.name}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted">
              Track individual serial numbers, battery health, and warranty status.
            </p>
            <Button
              variant="solid"
              size="sm"
              onClick={() => {
                setIsUnitModalOpen(false);
                setIsAddUnitOpen(true);
              }}
              className="gap-1.5 shrink-0"
            >
              <Plus size={14} /> Add New Unit
            </Button>
          </div>

          {unitsLoading ? (
            <div className="py-8 text-center text-muted">Loading serialized units...</div>
          ) : units.length === 0 ? (
            <div className="py-8 text-center text-muted border border-dashed border-border rounded-2xl">
              No serialized units currently registered for this product.
            </div>
          ) : (
            <Table containerClassName="rounded-2xl border border-border shadow-none">
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-48">Serial / IMEI</TableHeaderCell>
                  <TableHeaderCell className="w-24">Condition</TableHeaderCell>
                  {store?.code === 'mobiles' && <TableHeaderCell className="w-24">Battery</TableHeaderCell>}
                  <TableHeaderCell className="w-28">Status</TableHeaderCell>
                  <TableHeaderCell className="w-28">Warranty</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-mono text-xs font-semibold text-text">
                      {unit.serial_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.condition_grade === 'new' ? 'success' : 'default'} className="text-[10px]">
                        {unit.condition_grade}
                      </Badge>
                    </TableCell>
                    {store?.code === 'mobiles' && (
                      <TableCell className="text-xs text-text">
                        {unit.battery_health ? `${unit.battery_health}%` : '-'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge
                        variant={
                          unit.status === 'in_stock'
                            ? 'success'
                            : unit.status === 'sold'
                            ? 'accent'
                            : 'danger'
                        }
                        className="text-[10px]"
                      >
                        {unit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted">{unit.warranty_months} Mos</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Modal>

      {/* Add New Unit Modal */}
      <Modal
        isOpen={isAddUnitOpen}
        onClose={() => {
          setIsAddUnitOpen(false);
          setFormError('');
        }}
        title={`Add Serialized Unit - ${selectedProduct?.name}`}
        size="lg"
      >
        <form onSubmit={handleAddUnit} className="space-y-5">
          {formError && (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 p-3.5 text-sm text-danger flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="unit-serial"
              label={store?.code === 'mobiles' ? 'IMEI Number (15 digits)' : 'Serial Number'}
              placeholder={store?.code === 'mobiles' ? 'e.g. 358941091234567' : 'e.g. SNY2026TV001'}
              value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
              required
              autoFocus
            />

            <Select
              id="condition-grade"
              label="Condition Grade"
              options={[
                { value: 'new', label: 'Brand New (Sealed Pack)' },
                { value: 'A+', label: 'Pre-Owned Grade A+ (Like New, Flawless)' },
                { value: 'A', label: 'Pre-Owned Grade A (Minor Micro-Scratches)' },
                { value: 'B', label: 'Pre-Owned Grade B (Visible Wear & Tear)' },
                { value: 'C', label: 'Pre-Owned Grade C (Heavy Usage / Budget)' },
                { value: 'refurbished', label: 'Certified Refurbished' },
              ]}
              value={conditionGrade}
              onChange={(e) => setConditionGrade(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {store?.code === 'mobiles' ? (
              <Input
                id="battery-health"
                label="Battery Health Percentage (0 - 100)"
                type="number"
                min="1"
                max="100"
                placeholder="e.g. 92"
                value={batteryHealth}
                onChange={(e) => setBatteryHealth(e.target.value)}
              />
            ) : (
              <div />
            )}

            <Input
              id="purchase-cost"
              label="Purchase Cost Price (₹)"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 45000"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddUnitOpen(false);
                setFormError('');
              }}
              className="px-6 h-11 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="solid"
              pending={createUnitMutation.isPending}
              className="px-6 h-11 text-xs font-semibold"
            >
              Register Unit to Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      {productToAdjust && (
        <StockAdjustmentModal
          product={productToAdjust}
          storeId={store?.id}
          isOpen={Boolean(productToAdjust)}
          onClose={() => setProductToAdjust(null)}
        />
      )}

      {/* Edit Pricing Modal */}
      {productToEditPrice && (
        <EditPricingModal
          product={productToEditPrice}
          isOpen={Boolean(productToEditPrice)}
          onClose={() => setProductToEditPrice(null)}
        />
      )}

      {/* Add Product Modal */}
      <AddProductModal
        storeId={store?.id}
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
      />
    </div>
  );
}

