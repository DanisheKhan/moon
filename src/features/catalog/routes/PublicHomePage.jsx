import { useState, useMemo } from 'react';
import { Container, Card, Button, Input } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { motion } from '@/shared/motion';
import { usePublicProducts, useCart } from '../hooks/useCatalog';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { StoreHeroShowcase } from '../components/StoreHeroShowcase';
import { StoreBrandsStrip } from '../components/StoreBrandsStrip';
import { StoreDepartmentsSection } from '../components/StoreDepartmentsSection';
import { StoreEmiCalculatorSection } from '../components/StoreEmiCalculatorSection';
import { StoreReviewsSection } from '../components/StoreReviewsSection';
import { StoreSpotlightSection } from '../components/StoreSpotlightSection';
import { StoreFaqSection } from '../components/StoreFaqSection';
import { StoreFooter } from '../components/StoreFooter';
import { formatCurrency } from '@/shared/lib/format';
import {
  Smartphone,
  Tv,
  Search,
  ShoppingBag,
  Eye,
  Check,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

export function PublicHomePage() {
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const { addToCart } = useCart();
  const { data: allProducts = [], isLoading } = usePublicProducts();

  // Unique categories derived from current products scoped to selected store
  const availableCategories = useMemo(() => {
    const map = new Map();
    allProducts.forEach((p) => {
      if (selectedStore !== 'all' && p.stores?.code !== selectedStore) {
        return;
      }
      if (p.categories?.slug && p.categories?.name) {
        map.set(p.categories.slug, p.categories.name);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [allProducts, selectedStore]);

  // Instant local filtering and sorting
  const products = useMemo(() => {
    let list = [...allProducts];

    if (selectedStore && selectedStore !== 'all') {
      list = list.filter((p) => p.stores?.code === selectedStore);
    }
    if (selectedCategory) {
      list = list.filter((p) => p.categories?.slug === selectedCategory);
    }
    if (inStockOnly) {
      list = list.filter((p) => (p.inventory?.[0]?.quantity_on_hand ?? 0) > 0);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.brands?.name?.toLowerCase().includes(q) ||
          p.categories?.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.selling_price - b.selling_price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.selling_price - a.selling_price);
    } else if (sortBy === 'discount') {
      list.sort((a, b) => {
        const discA = (a.mrp || a.selling_price) - a.selling_price;
        const discB = (b.mrp || b.selling_price) - b.selling_price;
        return discB - discA;
      });
    }

    return list;
  }, [allProducts, selectedStore, selectedCategory, search, inStockOnly, sortBy]);

  // Display only 6 products initially with a "View All" toggle button
  const visibleProducts = useMemo(() => {
    return showAllProducts ? products : products.slice(0, 6);
  }, [products, showAllProducts]);

  function handleAddToCart(e, product) {
    e.stopPropagation();
    addToCart(product, 1);
    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId(null), 1800);
  }

  function handleSelectCategory(categorySlug, storeCode) {
    if (storeCode) setSelectedStore(storeCode);
    setSelectedCategory(categorySlug || '');
    scrollToCatalog();
  }

  function scrollToCatalog() {
    const el = document.getElementById('catalog-grid-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function scrollToCalculator() {
    const el = document.getElementById('emi-calculator-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-w-0 flex flex-col bg-bg text-text">
      <Seo
        title="Star Enterprises — Hall Furniture, Electronics & Mobiles | Bhiwandi Flagship"
        description="Bhiwandi’s flagship showroom near Reliance Smart on Md. Ali Road. Hallmark living furniture, inverter ACs, double-door refrigerators, washing machines, and certified smartphones with 0% EMI financing and GST billing."
        path="/"
      />

      {/* 1. Full-Height Hero Section (Shift other sections beneath the initial fold) */}
      <StoreHeroShowcase
        onExploreCatalog={scrollToCatalog}
        onOpenCalculator={scrollToCalculator}
      />

      {/* 2. Infinite Auto X-Moving Brand Strip */}
      <StoreBrandsStrip />

      {/* 3. Visual Department Explorer */}
      <StoreDepartmentsSection onSelectDepartment={handleSelectCategory} />

      {/* 4. Live Inventory Catalog Grid */}
      <section id="catalog-grid-section" className="py-20 sm:py-28 border-b border-border bg-surface min-w-0">
        <Container size="xl" className="space-y-8 sm:space-y-10">
          {/* Consistent Section Header & Global Catalog Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-crimson">
                SHOWROOM INVENTORY
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-text">
                Browse Live Products
              </h2>
            </div>

            {/* Catalog Search Bar */}
            <div className="w-full md:w-80 relative flex items-center">
              <Input
                id="catalog-instant-search"
                placeholder="Search sofa, fridge, AC, iPhone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-16 text-xs sm:text-sm"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 text-xs text-muted hover:text-text cursor-pointer"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              ) : (
                <Search size={15} className="absolute right-3 text-muted pointer-events-none" />
              )}
            </div>
          </div>

          {/* Department Filter Tabs & Subcategory Controls */}
          <div className="border border-border rounded-2xl bg-bg p-4 sm:p-5 space-y-4 shadow-sm">
            {/* Primary Department Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStore('all');
                    setSelectedCategory('');
                  }}
                  className={`px-3.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedStore === 'all'
                      ? 'bg-text text-accent-fg border-text shadow-2xs font-semibold'
                      : 'bg-surface text-muted border-border hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  <Layers size={13} /> All Collections ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStore('furniture-electronics');
                    setSelectedCategory('');
                  }}
                  className={`px-3.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedStore === 'furniture-electronics'
                      ? 'bg-text text-accent-fg border-text shadow-2xs font-semibold'
                      : 'bg-surface text-muted border-border hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  <Tv size={13} /> Furniture & Electronics
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStore('mobiles');
                    setSelectedCategory('');
                  }}
                  className={`px-3.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedStore === 'mobiles'
                      ? 'bg-text text-accent-fg border-text shadow-2xs font-semibold'
                      : 'bg-surface text-muted border-border hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  <Smartphone size={13} /> Star Mobiles
                </button>
              </div>

              {/* Sorting & In-Stock Switch */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-text select-none">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded border-border text-brand-sage focus:ring-0 cursor-pointer"
                  />
                  <span>In-Stock Only</span>
                </label>

                <div className="flex items-center gap-1 text-muted">
                  <SlidersHorizontal size={13} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-surface border border-border rounded-md px-2.5 py-1 text-xs text-text cursor-pointer focus:outline-none"
                    aria-label="Sort catalog"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="discount">Biggest Savings</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Sub-Filters */}
            {availableCategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-muted font-medium shrink-0">Filter:</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`px-2.5 py-1 rounded-md border cursor-pointer transition-all whitespace-nowrap font-medium ${
                    selectedCategory === ''
                      ? 'bg-surface-subtle text-text border-text'
                      : 'bg-surface text-muted border-border hover:text-text'
                  }`}
                >
                  All Types
                </button>
                {availableCategories.map(({ slug, name }) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setSelectedCategory(slug)}
                    className={`px-2.5 py-1 rounded-md border cursor-pointer transition-all whitespace-nowrap font-medium ${
                      selectedCategory === slug
                        ? 'bg-surface-subtle text-text border-text'
                        : 'bg-surface text-muted border-border hover:text-text'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Cards Grid with Shorter, Cleaner Cards (No Stock Badge, No GST, No EMI) */}
          {isLoading && allProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-6 h-6 rounded-full border-2 border-brand-sage border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-muted">Loading showroom inventory...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center border border-border rounded-xl bg-surface space-y-3">
              <Search size={28} className="mx-auto text-muted" />
              <h3 className="text-sm font-semibold text-text">No products found</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Try searching for another keyword or clearing the filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedStore('all');
                  setSelectedCategory('');
                  setInStockOnly(false);
                  setSortBy('featured');
                }}
                className="text-xs mt-1"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 min-w-0">
                {visibleProducts.map((product) => {
                  const isMobiles = product.stores?.code === 'mobiles';
                  const isRecentlyAdded = recentlyAddedId === product.id;

                return (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.15 }}
                    className="min-w-0"
                  >
                    <Card
                      className="group p-4 flex flex-col justify-between space-y-3 hover:border-border-strong transition-colors bg-surface border border-border shadow-2xs h-full min-w-0"
                    >
                      <div className="space-y-2.5 min-w-0">
                        {/* Taller 4:3 Image Container */}
                        <div
                          onClick={() => setActiveModalProduct(product)}
                          className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-subtle border border-border flex items-center justify-center cursor-pointer transition-opacity group-hover:opacity-95"
                        >
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover block"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted gap-1.5 py-6">
                              {isMobiles ? <Smartphone size={24} className="opacity-30" /> : <Tv size={24} className="opacity-30" />}
                              <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">{product.sku}</span>
                            </div>
                          )}
                        </div>

                        {/* Product Brand & Name */}
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                            {product.brands?.name || (isMobiles ? 'Star Mobiles' : 'Star Enterprises')}
                          </div>
                          <h3 className="text-sm font-bold text-text line-clamp-1 mt-0.5">
                            {product.name}
                          </h3>
                        </div>

                        {/* Spec Highlights Snippet */}
                        {product.specs && (
                          <div className="flex flex-wrap gap-1.5">
                            {product.specs.storage && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-bg text-muted">
                                {product.specs.storage}
                              </span>
                            )}
                            {product.specs.battery_health && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text font-medium">
                                {product.specs.battery_health}% Battery
                              </span>
                            )}
                            {product.specs.screen_size && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-bg text-muted">
                                {product.specs.screen_size}
                              </span>
                            )}
                            {product.specs.capacity && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-bg text-muted">
                                {product.specs.capacity}
                              </span>
                            )}
                            {product.specs.tonnage && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-bg text-muted">
                                {product.specs.tonnage}
                              </span>
                            )}
                            {product.specs.star_rating && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-brand-gold-border bg-brand-gold-subtle text-brand-gold-text font-medium">
                                {product.specs.star_rating}
                              </span>
                            )}
                            {product.specs.seating && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-bg text-muted">
                                {product.specs.seating}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Clean Price & Action Footer (No GST, No EMI) */}
                      <div className="pt-2.5 border-t border-border space-y-2">
                        <div className="flex items-baseline justify-between">
                          <div className="text-lg font-bold font-mono text-text tracking-tight">
                            {formatCurrency(product.selling_price)}
                          </div>
                          {product.mrp && product.mrp > product.selling_price && (
                            <div className="text-xs text-muted line-through font-mono">
                              MRP {formatCurrency(product.mrp)}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveModalProduct(product)}
                            className="text-xs justify-center gap-1.5 cursor-pointer font-medium py-1.5"
                          >
                            <Eye size={13} /> View
                          </Button>
                          <Button
                            variant="solid"
                            size="sm"
                            onClick={(e) => handleAddToCart(e, product)}
                            className="text-xs justify-center gap-1.5 cursor-pointer font-medium py-1.5"
                          >
                            {isRecentlyAdded ? (
                              <>
                                <Check size={13} /> Added
                              </>
                            ) : (
                              <>
                                <ShoppingBag size={13} /> Add to Cart
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Toggle Show All / Show Less Button */}
            {products.length > 6 && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowAllProducts((prev) => !prev)}
                  className="px-6 py-2.5 rounded-xl border-border bg-surface text-text hover:border-brand-sage hover:text-brand-sage font-bold text-xs sm:text-sm cursor-pointer shadow-2xs gap-2 inline-flex items-center"
                >
                  {showAllProducts ? (
                    <>Show Less (6 Products)</>
                  ) : (
                    <>View All Products ({products.length})</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        </Container>
      </section>

      {/* 5. Interactive 0% Paperless EMI Calculator */}
      <StoreEmiCalculatorSection />

      {/* 6. Showroom Visit & In-Person Experience */}
      <StoreSpotlightSection />

      {/* 7. Local Bhiwandi Customer Stories */}
      <StoreReviewsSection />

      {/* 8. Frequently Asked Questions */}
      <StoreFaqSection />

      {/* 9. Minimal Enterprise Footer */}
      <StoreFooter onSelectCategory={handleSelectCategory} />

      {/* 10. Product Detail Modal */}
      {activeModalProduct && (
        <ProductDetailModal
          product={activeModalProduct}
          isOpen={Boolean(activeModalProduct)}
          onClose={() => setActiveModalProduct(null)}
        />
      )}
    </div>
  );
}
