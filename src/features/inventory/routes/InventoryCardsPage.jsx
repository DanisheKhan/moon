import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Input, Select } from '@/shared/ui';
import {
  useAllProducts,
  AddProductModal,
  EditProductModal,
  DeleteProductModal,
  useCategories,
  AddCategoryModal,
} from '@/features/inventory';
import { formatCurrency } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';

export function InventoryCardsPage() {
  const outletCtx = useOutletContext();
  const currentStore = outletCtx?.store;
  const storeCode = outletCtx?.storeCode || currentStore?.code || 'mobiles';
  const storeId = currentStore?.id || '';

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [editInitialTab, setEditInitialTab] = useState('details');
  const [productToDelete, setProductToDelete] = useState(null);

  // Strictly isolate products to selected store
  const { data: allProds = [], isLoading } = useAllProducts();
  const { data: dbCategories = [] } = useCategories(storeId);

  const rawProducts = useMemo(() => {
    return allProds.filter((p) => {
      if (storeCode === 'mobiles') {
        return (
          p.stores?.code === 'mobiles' ||
          p.stores?.id === 'store-1' ||
          p.store_id === storeId ||
          p.categories?.slug === 'smartphones' ||
          p.categories?.slug === 'accessories' ||
          p.categories?.slug === 'second-hand-phones'
        );
      }
      if (storeCode === 'furniture-electronics') {
        return (
          p.stores?.code === 'furniture-electronics' ||
          p.stores?.id === 'store-2' ||
          p.store_id === storeId ||
          p.categories?.slug === 'televisions' ||
          p.categories?.slug === 'refrigerators' ||
          p.categories?.slug === 'living-room-furniture'
        );
      }
      return p.store_id === storeId || p.stores?.id === storeId;
    });
  }, [allProds, storeCode, storeId]);

  // Derive category options
  const categories = useMemo(() => {
    const map = new Map();
    dbCategories.forEach((c) => {
      if (c.id && c.name) {
        map.set(c.id, c.name);
      }
    });
    rawProducts.forEach((p) => {
      if (p.categories?.id && p.categories?.name) {
        map.set(p.categories.id, p.categories.name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [dbCategories, rawProducts]);

  // Compute stock health breakdown for quick filtering
  const stockCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    rawProducts.forEach((p) => {
      const q = p.inventory?.[0]?.quantity_on_hand ?? 0;
      const reorder = p.reorder_level || 2;
      if (q <= 0) {
        outOfStock += 1;
      } else if (q <= reorder) {
        lowStock += 1;
        inStock += 1;
      } else {
        inStock += 1;
      }
    });
    return { all: rawProducts.length, inStock, lowStock, outOfStock };
  }, [rawProducts]);

  // Filter products by category, search, and stock level
  const filteredProducts = useMemo(() => {
    let list = rawProducts;
    if (selectedCategoryId) {
      list = list.filter(
        (p) => p.category_id === selectedCategoryId || p.categories?.id === selectedCategoryId
      );
    }
    if (stockFilter === 'in_stock') {
      list = list.filter((p) => (p.inventory?.[0]?.quantity_on_hand ?? 0) > 0);
    } else if (stockFilter === 'low_stock') {
      list = list.filter((p) => {
        const q = p.inventory?.[0]?.quantity_on_hand ?? 0;
        const reorder = p.reorder_level || 2;
        return q > 0 && q <= reorder;
      });
    } else if (stockFilter === 'out_of_stock') {
      list = list.filter((p) => (p.inventory?.[0]?.quantity_on_hand ?? 0) <= 0);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.categories?.name?.toLowerCase().includes(q) ||
          p.brands?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rawProducts, selectedCategoryId, stockFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border min-w-0">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted block mb-1">
            CATALOG MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-text">
            Inventory & Products
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Browse all items in visual card format with live stock badges, edit details, and delete controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-surface hover:bg-bg border border-border text-text font-medium text-xs sm:text-sm px-3.5 py-2 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            <FolderPlus size={15} />
            <span>+ Add Category</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-text text-bg hover:opacity-90 font-medium text-xs sm:text-sm px-4 py-2 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            <Plus size={16} />
            <span>+ Add new Product</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-xl border border-border bg-surface shadow-2xs">
        <div className="sm:col-span-8 relative">
          <Input
            id="search-cards"
            placeholder="Search by name, SKU, brand, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sm:col-span-4">
          <Select
            id="filter-category"
            options={[
              { value: '', label: 'All Categories' },
              ...categories,
              { value: '__add_category__', label: '+ Add Custom Category...' },
            ]}
            value={selectedCategoryId}
            onChange={(e) => {
              if (e.target.value === '__add_category__') {
                setIsAddCategoryModalOpen(true);
              } else {
                setSelectedCategoryId(e.target.value);
              }
            }}
          />
        </div>
      </div>

      {/* Stock Health Quick Filter Ribbon */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setStockFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border shadow-2xs',
            stockFilter === 'all'
              ? 'bg-text text-bg border-text font-semibold'
              : 'bg-surface text-muted hover:text-text border-border'
          )}
        >
          All Items ({stockCounts.all})
        </button>
        <button
          type="button"
          onClick={() => setStockFilter('in_stock')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border shadow-2xs',
            stockFilter === 'in_stock'
              ? 'bg-brand-sage text-white border-brand-sage font-semibold'
              : 'bg-surface text-muted hover:text-text border-border'
          )}
        >
          In Stock ({stockCounts.inStock})
        </button>
        <button
          type="button"
          onClick={() => setStockFilter('low_stock')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border shadow-2xs',
            stockFilter === 'low_stock'
              ? 'bg-amber-600 text-white border-amber-600 font-semibold'
              : 'bg-surface text-muted hover:text-text border-border'
          )}
        >
          Low Stock ({stockCounts.lowStock})
        </button>
        <button
          type="button"
          onClick={() => setStockFilter('out_of_stock')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border shadow-2xs',
            stockFilter === 'out_of_stock'
              ? 'bg-danger text-white border-danger font-semibold'
              : 'bg-surface text-muted hover:text-text border-border'
          )}
        >
          Out of Stock ({stockCounts.outOfStock})
        </button>
      </div>

      {/* Product Summary stats */}
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <span>
          Showing <span className="font-medium text-text">{filteredProducts.length}</span> of {rawProducts.length} products
        </span>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-muted hover:text-text underline cursor-pointer font-medium"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Products in Card Format */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted">Loading product catalog cards...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-xl bg-surface space-y-3">
          <Package size={36} className="mx-auto text-muted" />
          <h3 className="text-base font-medium text-text">No products found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try adjusting your search query, selecting another category, or add a new product.
          </p>
          <Button
            variant="solid"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs gap-1.5 font-medium rounded-lg"
          >
            <Plus size={14} /> Add Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => {
            const qtyOnHand = prod.inventory?.[0]?.quantity_on_hand ?? 0;
            const reorderLevel = prod.reorder_level || 2;
            const isOutOfStock = qtyOnHand <= 0;
            const isLowStock = !isOutOfStock && qtyOnHand <= reorderLevel;

            return (
              <div
                key={prod.id}
                className="group rounded-xl border border-border bg-surface p-3 flex flex-col justify-between hover:border-text/40 transition-all select-none space-y-2.5 shadow-2xs h-full"
              >
                {/* Card Top: Image & Status Badges */}
                <div className="space-y-2.5">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border bg-bg/40 flex items-center justify-center">
                    {prod.image_url ? (
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted">
                        <Package size={28} />
                        <span className="text-[10px] font-mono">{prod.sku}</span>
                      </div>
                    )}

                    {/* Prominent, Highlighted Stock status badge (Clickable to view & adjust stock) */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToEdit(prod);
                          setEditInitialTab('stock');
                        }}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                        title="Click to view and adjust stock level"
                      >
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger text-white shadow-2xs">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-2xs">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>Low Stock ({qtyOnHand})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-sage text-white shadow-2xs">
                            <CheckCircle2 size={12} className="shrink-0" />
                            <span>In Stock ({qtyOnHand})</span>
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Serialized badge */}
                    {prod.is_serialized && (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-surface/95 text-text border border-border shadow-2xs">
                          Serialized
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category & Brand tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-bg border border-border text-muted">
                      {prod.categories?.name || 'General'}
                    </span>
                    {prod.brands?.name && prod.brands.name !== '-' && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-bg border border-border text-muted">
                        {prod.brands.name}
                      </span>
                    )}
                  </div>

                  {/* Title & SKU */}
                  <div>
                    <h3 className="font-bold text-base text-text line-clamp-1" title={prod.name}>
                      {prod.name}
                    </h3>
                    <div className="text-xs font-mono text-muted flex items-center gap-2 mt-0.5">
                      <span>SKU: {prod.sku}</span>
                      {prod.hsn_code && <span>• HSN {prod.hsn_code}</span>}
                    </div>
                  </div>
                </div>

                {/* Card Middle: Price & GST info */}
                <div className="pt-2.5 border-t border-border flex items-baseline justify-between">
                  <div>
                    <div className="text-xl sm:text-2xl font-extrabold text-text font-mono tracking-tight">
                      {formatCurrency(prod.selling_price)}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      GST {prod.gst_rate}% Included
                    </div>
                  </div>
                  {prod.cost_price > 0 && (
                    <div className="text-right">
                      <span className="text-xs uppercase tracking-wider text-muted font-semibold block">Cost</span>
                      <span className="text-sm font-bold font-mono text-muted">{formatCurrency(prod.cost_price)}</span>
                    </div>
                  )}
                </div>

                {/* Card Combined Action Controls: Single row with Edit & Stock + Delete */}
                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProductToEdit(prod);
                      setEditInitialTab('details');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-surface-subtle hover:bg-surface text-text border border-border hover:border-brand-sage transition-all cursor-pointer shadow-2xs"
                    title="Edit details, pricing, and stock"
                  >
                    <Pencil size={12} className="text-brand-sage" />
                    <span>Edit & Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductToDelete(prod)}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-danger/30 bg-danger/5 hover:bg-danger/10 text-danger transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddCategoryModal
        storeId={storeId}
        storeName={currentStore?.name || (storeCode === 'mobiles' ? 'Star Mobiles' : 'Star Furniture & Electronics')}
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onSuccess={(newCat) => {
          if (newCat?.id) {
            setSelectedCategoryId(newCat.id);
          }
        }}
      />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        storeId={storeId}
        storeCode={storeCode}
      />

      {productToEdit && (
        <EditProductModal
          key={`${productToEdit.id}-${editInitialTab}`}
          product={productToEdit}
          storeId={storeId}
          isOpen={Boolean(productToEdit)}
          initialTab={editInitialTab}
          onClose={() => setProductToEdit(null)}
        />
      )}

      {productToDelete && (
        <DeleteProductModal
          product={productToDelete}
          isOpen={Boolean(productToDelete)}
          onClose={() => setProductToDelete(null)}
        />
      )}
    </div>
  );
}
