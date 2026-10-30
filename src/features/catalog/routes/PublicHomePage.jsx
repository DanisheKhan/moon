import { useState, useMemo } from 'react';
import { Container, Card, Badge, Button, Input } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { usePublicProducts, useCart } from '../hooks/useCatalog';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { formatCurrency } from '@/shared/lib/format';
import {
  Smartphone,
  Tv,
  Search,
  ShoppingBag,
  Eye,
  MapPin,
  Phone,
  ShieldCheck,
  Check,
  Layers,
} from 'lucide-react';

export function PublicHomePage() {
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);

  const { addToCart } = useCart();
  const { data: allProducts = [], isLoading } = usePublicProducts();

  // Unique categories derived from current products and scoped to selected store
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

  // Instant local filtering without network round trips
  const products = useMemo(() => {
    let list = allProducts;
    if (selectedStore && selectedStore !== 'all') {
      list = list.filter((p) => p.stores?.code === selectedStore);
    }
    if (selectedCategory) {
      list = list.filter((p) => p.categories?.slug === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.brands?.name?.toLowerCase().includes(q) ||
          p.categories?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allProducts, selectedStore, selectedCategory, search]);

  function handleAddToCart(e, product) {
    e.stopPropagation();
    addToCart(product, 1);
    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId(null), 1800);
  }

  return (
    <div className="space-y-12 sm:space-y-16 py-8 sm:py-12 min-w-0">
      <Seo
        title="Star Enterprises — Mobiles, Electronics & Modern Furniture"
        description="Browse certified smartphones, home electronics, and premium furniture with official warranty and GST invoicing across our two Mumbai branches."
        path="/"
      />

      {/* Hero Section */}
      <Container size="xl" className="text-center space-y-4">
        <Badge variant="accent" className="px-3.5 py-1 text-xs">
          Two Specialized Stores • One Enterprise Destination
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-text max-w-3xl mx-auto leading-tight">
          Genuine Mobiles, Smart Electronics & Premium Furniture
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto">
          Explore certified smartphones with battery health guarantee, high-definition smart TVs, inverter refrigerators, and luxury living room collections.
        </p>

        {/* Global Catalog Search Bar */}
        <div className="max-w-xl mx-auto pt-4 flex gap-2">
          <div className="relative flex-1">
            <Input
              id="public-catalog-search"
              placeholder="Search iPhone, Samsung, Sony 4K TV, Fridge, Recliner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-text cursor-pointer"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>
          <Button
            variant="solid"
            onClick={() => {}}
            className="gap-2 cursor-pointer"
            aria-label="Submit search"
          >
            <Search size={16} /> Search
          </Button>
        </div>
      </Container>

      {/* Store Filter Tabs */}
      <Container size="xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              type="button"
              onClick={() => {
                setSelectedStore('all');
                setSelectedCategory('');
              }}
              className={`px-4 py-2 text-xs rounded-full border cursor-pointer font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedStore === 'all'
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'bg-surface text-text border-border hover:bg-bg'
              }`}
            >
              <Layers size={14} /> All Collections ({products.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStore('mobiles');
                setSelectedCategory('');
              }}
              className={`px-4 py-2 text-xs rounded-full border cursor-pointer font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedStore === 'mobiles'
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'bg-surface text-text border-border hover:bg-bg'
              }`}
            >
              <Smartphone size={14} /> Star Mobiles
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStore('furniture-electronics');
                setSelectedCategory('');
              }}
              className={`px-4 py-2 text-xs rounded-full border cursor-pointer font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedStore === 'furniture-electronics'
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'bg-surface text-text border-border hover:bg-bg'
              }`}
            >
              <Tv size={14} /> Furniture & Electronics
            </button>
          </div>

          <div className="text-xs text-muted">
            Showing <span className="font-semibold text-text">{products.length}</span> verified items
          </div>
        </div>

        {/* Category Pill Sub-Filters */}
        {availableCategories.length > 0 && (
          <div className="flex items-center gap-2 pt-4 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors whitespace-nowrap ${
                selectedCategory === ''
                  ? 'bg-accent text-accent-fg border-accent font-medium'
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
                className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors whitespace-nowrap ${
                  selectedCategory === slug
                    ? 'bg-accent text-accent-fg border-accent font-medium'
                    : 'bg-surface text-muted border-border hover:text-text'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </Container>

      {/* Live Product Cards Grid */}
      <Container size="xl">
        {isLoading && allProducts.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-muted">Loading live inventory from stores...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center border border-border rounded-3xl bg-surface space-y-3">
            <Search size={32} className="mx-auto text-muted" />
            <h3 className="text-base font-semibold text-text">No matching products found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              We couldn't find items matching your search or filter. Try clearing filters or searching for another keyword.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedStore('all');
                setSelectedCategory('');
              }}
              className="text-xs mt-2"
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
            {products.map((product) => {
              const inStockQty = product.inventory?.[0]?.quantity_on_hand ?? 0;
              const isAvailable = inStockQty > 0;
              const isMobiles = product.stores?.code === 'mobiles';
              const isRecentlyAdded = recentlyAddedId === product.id;

              return (
                <Card
                  key={product.id}
                  className="group p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-accent transition-all min-w-0"
                >
                  <div className="space-y-3 min-w-0">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="default" className="text-[11px] font-medium">
                        {isMobiles ? 'Star Mobiles' : 'Furniture & Electronics'}
                      </Badge>
                      {isAvailable ? (
                        <Badge variant={inStockQty < 2 ? 'danger' : 'success'} className="text-[10px]">
                          In Stock ({inStockQty})
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="text-[10px]">
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    {/* Product Image Preview */}
                    <div
                      onClick={() => setActiveModalProduct(product)}
                      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface/60 border border-border flex items-center justify-center cursor-pointer group-hover:border-accent/60 transition-all shadow-sm"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover block transition-opacity duration-300 group-hover:opacity-90"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted gap-2 py-8">
                          {isMobiles ? <Smartphone size={32} className="opacity-30" /> : <Tv size={32} className="opacity-30" />}
                          <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">{product.sku}</span>
                        </div>
                      )}
                    </div>

                    {/* Product Name & Brand */}
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted font-medium">
                        {product.brands?.name || 'Star Store'}
                      </div>
                      <h3 className="text-base font-semibold text-text line-clamp-1 mt-0.5">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>

                    {/* Spec Highlights Snippet */}
                    {product.specs && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {product.specs.storage && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-bg text-muted">
                            {product.specs.storage}
                          </span>
                        )}
                        {product.specs.battery_health && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-bg text-muted">
                            {product.specs.battery_health}% Battery
                          </span>
                        )}
                        {product.specs.screen_size && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-bg text-muted">
                            {product.specs.screen_size}
                          </span>
                        )}
                        {product.specs.capacity && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-bg text-muted">
                            {product.specs.capacity}
                          </span>
                        )}
                        {product.specs.condition && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-bg text-muted">
                            {product.specs.condition}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price & Action Footer */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-text tracking-tight">
                          {formatCurrency(product.selling_price)}
                        </div>
                        <div className="text-xs text-muted mt-0.5">
                          Incl. {product.gst_rate}% GST
                        </div>
                      </div>
                      {product.mrp && product.mrp > product.selling_price && (
                        <div className="text-sm text-muted line-through font-mono">
                          MRP {formatCurrency(product.mrp)}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveModalProduct(product)}
                        className="text-xs justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={14} /> Quick View
                      </Button>
                      <Button
                        variant="solid"
                        size="sm"
                        onClick={(e) => handleAddToCart(e, product)}
                        className="text-xs justify-center gap-1.5 cursor-pointer"
                      >
                        {isRecentlyAdded ? (
                          <>
                            <Check size={14} /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={14} /> Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>

      {/* Trust & Store Contact Section */}
      <Container size="xl">
        <div className="border border-border rounded-2xl p-6 sm:p-8 bg-surface grid grid-cols-1 md:grid-cols-3 gap-6 text-left min-w-0 shadow-2xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-text">
              <MapPin size={16} className="text-brand-sage" /> Verified Branches
            </div>
            <div className="text-xs text-muted space-y-1">
              <p><strong className="text-text font-medium">Star Mobiles:</strong> Shop 101, Main Road Market, Mumbai</p>
              <p><strong className="text-text font-medium">Star Furniture:</strong> Shop 102, Main Road Market, Mumbai</p>
            </div>
            <p className="text-[11px] text-muted pt-1">Open 7 days • 10:00 AM - 9:30 PM</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-text">
              <Phone size={16} className="text-brand-sage" /> Direct Helpline & WhatsApp
            </div>
            <p className="text-xs text-muted">
              Have questions about stock availability or certified trade-in values? Chat with our store team.
            </p>
            <div className="text-xs font-semibold text-text font-mono">+91 98200 12345</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-text">
              <ShieldCheck size={16} className="text-brand-sage" /> Official GST Invoicing
            </div>
            <p className="text-xs text-muted">
              GSTIN: <span className="font-mono font-medium text-text">27AAAAA0000A1Z5</span>. Full B2B and B2C tax compliance with Input Tax Credit.
            </p>
            <p className="text-[11px] text-muted pt-1">Certified authentic inventory with official warranty.</p>
          </div>
        </div>
      </Container>

      {/* Product Detail Modal */}
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
