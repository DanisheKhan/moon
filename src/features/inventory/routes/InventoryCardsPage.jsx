import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Input, Select } from '@/shared/ui';
import {
  useAllProducts,
  AddProductModal,
  EditProductModal,
  DeleteProductModal,
  StockAdjustmentModal,
  useCategories,
  AddCategoryModal,
} from '@/features/inventory';
import { formatCurrency } from '@/shared/lib/format';
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
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToAdjust, setProductToAdjust] = useState(null);

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

  // Derive categories combining Supabase database categories and product categories
  const categories = useMemo(() => {
    const map = new Map();
    // 1. All categories saved in DB for this store
    dbCategories.forEach((c) => {
      if (c.id && c.name) {
        map.set(c.id, c.name);
      }
    });
    // 2. Any active product categories
    rawProducts.forEach((p) => {
      if (p.categories?.id && p.categories?.name) {
        map.set(p.categories.id, p.categories.name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [dbCategories, rawProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let list = rawProducts;
    if (selectedCategoryId) {
      list = list.filter(
        (p) => p.category_id === selectedCategoryId || p.categories?.id === selectedCategoryId
      );
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
  }, [rawProducts, selectedCategoryId, search]);

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
            const isOutOfStock = qtyOnHand <= 0;

            return (
              <div
                key={prod.id}
                className="group rounded-xl border border-border bg-surface p-4 flex flex-col justify-between hover:border-text/40 transition-all select-none space-y-4 shadow-2xs h-full"
              >
                {/* Card Top: Image & Status Badges */}
                <div className="space-y-3">
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border bg-bg/40 flex items-center justify-center">
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
                        <Package size={32} />
                        <span className="text-[10px] font-mono">{prod.sku}</span>
                      </div>
                    )}

                    {/* Stock status badge overlay */}
                    <div className="absolute top-2.5 right-2.5">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-surface text-danger border border-danger/30 shadow-2xs">
                          <AlertCircle size={10} /> Out of Stock
                        </span>
                      ) : qtyOnHand < 2 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-surface text-danger border border-danger/30 shadow-2xs">
                          <AlertCircle size={10} /> In Stock ({qtyOnHand})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-brand-sage-subtle text-brand-sage-text border border-brand-sage-border shadow-2xs">
                          <CheckCircle2 size={10} className="text-brand-sage" /> In Stock ({qtyOnHand})
                        </span>
                      )}
                    </div>

                    {/* Serialized badge */}
                    {prod.is_serialized && (
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-medium uppercase tracking-wider bg-bg text-text border border-border">
                          Serialized
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category & Brand tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-bg border border-border text-muted">
                      {prod.categories?.name || 'General'}
                    </span>
                    {prod.brands?.name && prod.brands.name !== '-' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-bg border border-border text-muted">
                        {prod.brands.name}
                      </span>
                    )}
                  </div>

                  {/* Title & SKU */}
                  <div>
                    <h3 className="font-medium text-sm text-text line-clamp-1" title={prod.name}>
                      {prod.name}
                    </h3>
                    <div className="text-[11px] font-mono text-muted flex items-center gap-2 mt-0.5">
                      <span>SKU: {prod.sku}</span>
                      {prod.hsn_code && <span>• HSN {prod.hsn_code}</span>}
                    </div>
                  </div>
                </div>

                {/* Card Middle: Price & GST info */}
                <div className="pt-2 border-t border-border flex items-baseline justify-between">
                  <div>
                    <div className="text-base font-medium text-text">
                      {formatCurrency(prod.selling_price)}
                    </div>
                    <div className="text-[10px] text-muted">
                      GST {prod.gst_rate}% Included
                    </div>
                  </div>
                  {prod.cost_price > 0 && (
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-muted font-medium block">Cost</span>
                      <span className="text-xs font-mono text-muted">{formatCurrency(prod.cost_price)}</span>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Edit & Delete Buttons */}
                <div className="pt-3 border-t border-border grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProductToEdit(prod)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-bg hover:bg-surface text-text hover:border-text/40 transition-colors cursor-pointer"
                    title="Edit Product Details & Pricing"
                  >
                    <Pencil size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductToDelete(prod)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-danger/30 bg-danger/5 hover:bg-danger/10 text-danger transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 size={13} />
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
          product={productToEdit}
          isOpen={Boolean(productToEdit)}
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

      {productToAdjust && (
        <StockAdjustmentModal
          product={productToAdjust}
          storeId={productToAdjust.store_id || storeId}
          isOpen={Boolean(productToAdjust)}
          onClose={() => setProductToAdjust(null)}
        />
      )}
    </div>
  );
}
