import { supabase } from '@/shared/lib/supabase';

export const PRODUCT_IMAGE_FALLBACKS = {
  'iphone-15-pro-128gb': '/images/products/iphone-15-pro.jpg',
  'samsung-s24-256gb': '/images/products/samsung-s24.jpg',
  'iphone-13-128gb-pre-owned': '/images/products/iphone-13.jpg',
  'apple-20w-adapter': '/images/products/apple-20w-adapter.jpg',
  'oneplus-12-256gb': '/images/products/oneplus-12.jpg',
  'iphone-12-128gb-pre-owned': '/images/products/iphone-12.jpg',
  'apple-airpods-pro-2': '/images/products/airpods-pro-2.jpg',
  'samsung-galaxy-watch-6': '/images/products/galaxy-watch-6.jpg',
  'sony-bravia-55-4k': '/images/products/sony-bravia-55.jpg',
  'samsung-65-crystal-4k': '/images/products/samsung-65-tv.jpg',
  'lg-260l-double-door': '/images/products/lg-refrigerator.jpg',
  'bosch-8kg-front-load': '/images/products/bosch-washer.jpg',
  '3-seater-fabric-recliner-sofa': '/images/products/recliner-sofa.jpg',
  'APL-IP15P-128': '/images/products/iphone-15-pro.jpg',
  'SAM-S24-256': '/images/products/samsung-s24.jpg',
  'APL-IP13-PO': '/images/products/iphone-13.jpg',
  'APL-20W-PWR': '/images/products/apple-20w-adapter.jpg',
  '1PL-12-256': '/images/products/oneplus-12.jpg',
  'APL-IP12-PO': '/images/products/iphone-12.jpg',
  'APL-APP2-USB': '/images/products/airpods-pro-2.jpg',
  'SAM-GW6-44': '/images/products/galaxy-watch-6.jpg',
  'SNY-KD55-4K': '/images/products/sony-bravia-55.jpg',
  'SAM-65C-4K': '/images/products/samsung-65-tv.jpg',
  'LG-GL-T292': '/images/products/lg-refrigerator.jpg',
  'BSH-WAJ28468': '/images/products/bosch-washer.jpg',
  'FUR-SOFA-3S-GRY': '/images/products/recliner-sofa.jpg',
};

export function getProductImageUrl(product) {
  if (product?.image_url) return product.image_url;
  if (product?.slug && PRODUCT_IMAGE_FALLBACKS[product.slug]) {
    return PRODUCT_IMAGE_FALLBACKS[product.slug];
  }
  if (product?.sku && PRODUCT_IMAGE_FALLBACKS[product.sku]) {
    return PRODUCT_IMAGE_FALLBACKS[product.sku];
  }
  return null;
}

// Fallback seed products matching the actual dual-store inventory
export const FALLBACK_PRODUCTS = [
  {
    id: 'prod-mob-1',
    name: 'iPhone 15 Pro 128GB',
    slug: 'iphone-15-pro-128gb',
    sku: 'APL-IP15P-128',
    image_url: '/images/products/iphone-15-pro.jpg',
    selling_price: 124999,
    mrp: 134900,
    gst_rate: 18,
    is_serialized: true,
    description: 'Brand new Apple flagship smartphone with A17 Pro chip and Aerospace-grade titanium design.',
    specs: {
      storage: '128GB',
      ram: '8GB',
      color: 'Natural Titanium',
      display: '6.1 Super Retina XDR',
      battery: '100%',
      warranty: '1 Year Apple Official',
    },
    stores: { id: 'store-1', code: 'mobiles', name: 'Star Mobiles' },
    categories: { id: 'cat-smartphones', name: 'Smartphones', slug: 'smartphones' },
    brands: { id: 'brand-apple', name: 'Apple', slug: 'apple' },
    inventory: [{ quantity_on_hand: 4 }],
  },
  {
    id: 'prod-mob-2',
    name: 'Samsung Galaxy S24 256GB',
    slug: 'samsung-s24-256gb',
    sku: 'SAM-S24-256',
    image_url: '/images/products/samsung-s24.jpg',
    selling_price: 79999,
    mrp: 84999,
    gst_rate: 18,
    is_serialized: true,
    description: 'Galaxy AI powered compact flagship with Dynamic AMOLED 2X 120Hz display.',
    specs: {
      storage: '256GB',
      ram: '8GB',
      color: 'Onyx Black',
      display: '6.2 Dynamic AMOLED',
      battery: '100%',
      warranty: '1 Year Brand Warranty',
    },
    stores: { id: 'store-1', code: 'mobiles', name: 'Star Mobiles' },
    categories: { id: 'cat-smartphones', name: 'Smartphones', slug: 'smartphones' },
    brands: { id: 'brand-samsung', name: 'Samsung', slug: 'samsung' },
    inventory: [{ quantity_on_hand: 3 }],
  },
  {
    id: 'prod-mob-3',
    name: 'iPhone 13 128GB (Certified Pre-Owned)',
    slug: 'iphone-13-128gb-pre-owned',
    sku: 'APL-IP13-PO',
    image_url: '/images/products/iphone-13.jpg',
    selling_price: 38999,
    mrp: 52999,
    gst_rate: 18,
    is_serialized: true,
    description: 'Certified pre-owned iPhone 13, 52-point quality checked with 88% battery health guarantee.',
    specs: {
      storage: '128GB',
      color: 'Midnight',
      condition: 'Grade A (Flawless)',
      battery_health: 88,
      warranty: '6 Months Store Warranty',
    },
    stores: { id: 'store-1', code: 'mobiles', name: 'Star Mobiles' },
    categories: { id: 'cat-secondhand', name: 'Second-Hand Phones', slug: 'second-hand-phones' },
    brands: { id: 'brand-apple', name: 'Apple', slug: 'apple' },
    inventory: [{ quantity_on_hand: 2 }],
  },
  {
    id: 'prod-mob-4',
    name: 'Apple 20W USB-C Power Adapter',
    slug: 'apple-20w-adapter',
    sku: 'APL-20W-PWR',
    image_url: '/images/products/apple-20w-adapter.jpg',
    selling_price: 1900,
    mrp: 2199,
    gst_rate: 18,
    is_serialized: false,
    description: 'Original Apple 20W fast wall charger for all iPhone and iPad models.',
    specs: {
      wattage: '20W',
      type: 'USB-C PD',
      color: 'White',
      warranty: '6 Months Official',
    },
    stores: { id: 'store-1', code: 'mobiles', name: 'Star Mobiles' },
    categories: { id: 'cat-accessories', name: 'Accessories', slug: 'accessories' },
    brands: { id: 'brand-apple', name: 'Apple', slug: 'apple' },
    inventory: [{ quantity_on_hand: 18 }],
  },
  {
    id: 'prod-fe-1',
    name: 'Sony Bravia 55" 4K Google TV',
    slug: 'sony-bravia-55-4k',
    sku: 'SNY-KD55-4K',
    image_url: '/images/products/sony-bravia-55.jpg',
    selling_price: 64990,
    mrp: 74900,
    gst_rate: 18,
    is_serialized: true,
    description: 'Stunning 4K visual quality with Triluminos Pro color engine, Dolby Vision and Google TV.',
    specs: {
      screen_size: '55 inch (139 cm)',
      resolution: '4K Ultra HD (3840 x 2160)',
      sound: '20W Dolby Atmos',
      os: 'Google TV with Voice Remote',
      warranty: '2 Years Manufacturer On-Site',
    },
    stores: { id: 'store-2', code: 'furniture-electronics', name: 'Star Furniture & Electronics' },
    categories: { id: 'cat-tv', name: 'Televisions', slug: 'televisions' },
    brands: { id: 'brand-sony', name: 'Sony', slug: 'sony' },
    inventory: [{ quantity_on_hand: 3 }],
  },
  {
    id: 'prod-fe-2',
    name: 'LG 260L Double Door Refrigerator',
    slug: 'lg-260l-double-door',
    sku: 'LG-GL-T292',
    image_url: '/images/products/lg-refrigerator.jpg',
    selling_price: 28490,
    mrp: 33990,
    gst_rate: 18,
    is_serialized: true,
    description: 'Smart inverter compressor refrigerator with express ice freezing and multi-air flow cooling.',
    specs: {
      capacity: '260 Litres',
      energy_rating: '3 Star',
      type: 'Frost Free Double Door',
      color: 'Shiny Steel',
      warranty: '1 Year Product + 10 Years Compressor',
    },
    stores: { id: 'store-2', code: 'furniture-electronics', name: 'Star Furniture & Electronics' },
    categories: { id: 'cat-fridge', name: 'Refrigerators', slug: 'refrigerators' },
    brands: { id: 'brand-lg', name: 'LG', slug: 'lg' },
    inventory: [{ quantity_on_hand: 2 }],
  },
  {
    id: 'prod-fe-3',
    name: '3-Seater Fabric Recliner Sofa',
    slug: '3-seater-fabric-recliner-sofa',
    sku: 'FUR-SOFA-3S-GRY',
    image_url: '/images/products/recliner-sofa.jpg',
    selling_price: 34999,
    mrp: 44999,
    gst_rate: 12,
    is_serialized: true,
    description: 'Ergonomic manual reclining 3-seater sofa with high density foam and suede upholstery.',
    specs: {
      dimensions: '210cm W x 90cm D x 95cm H',
      material: 'Premium Suede Fabric',
      color: 'Slate Grey',
      assembly: 'Free Doorstep Assembly',
      warranty: '3 Years Structural Warranty',
    },
    stores: { id: 'store-2', code: 'furniture-electronics', name: 'Star Furniture & Electronics' },
    categories: { id: 'cat-furniture', name: 'Living Room Furniture', slug: 'living-room-furniture' },
    brands: { id: 'brand-furn', name: 'Royal Living', slug: 'royal-living' },
    inventory: [{ quantity_on_hand: 2 }],
  },
  {
    id: 'prod-mob-5',
    name: 'OnePlus 12 256GB',
    slug: 'oneplus-12-256gb',
    sku: '1PL-12-256',
    image_url: '/images/products/oneplus-12.jpg',
    selling_price: 64999,
    mrp: 69999,
    gst_rate: 18,
    is_serialized: true,
    description: 'Flagship performance with 4th Gen Hasselblad Camera, Snapdragon 8 Gen 3, and 100W SUPERVOOC charging.',
    specs: {
      storage: '256GB',
      ram: '12GB',
      color: 'Silky Black',
      display: '6.82 ProXDR 120Hz',
      battery: '5400 mAh',
      warranty: '1 Year Brand Official',
    },
    stores: { id: 'store-1', code: 'mobiles', name: 'Star Mobiles' },
    categories: { id: 'cat-smartphones', name: 'Smartphones', slug: 'smartphones' },
    brands: { id: 'brand-oneplus', name: 'OnePlus', slug: 'oneplus' },
    inventory: [{ quantity_on_hand: 3 }],
  },
  {
    id: 'prod-mob-6',
    name: 'iPhone 12 128GB (Pre-Owned)',
    slug: 'iphone-12-128gb-pre-owned',
    sku: 'APL-IP12-PO',
    image_url: '/images/products/iphone-12.jpg',
    selling_price: 27999,
    mrp: 39999,
    gst_rate: 18,
    is_serialized: true,
    description: 'Certified pre-owned iPhone 12 in Pacific Blue, fully tested with Super Retina XDR OLED display.',
    specs: {
      storage: '128GB',
      color: 'Pacific Blue',
      condition: 'Grade B (Very Good)',
      battery_health: 84,
      warranty: '3 Months Store Warranty',
    },
    stores: { id: 'store-1', code: 'mobiles', name: 'Star Mobiles' },
    categories: { id: 'cat-secondhand', name: 'Second-Hand Phones', slug: 'second-hand-phones' },
    brands: { id: 'brand-apple', name: 'Apple', slug: 'apple' },
    inventory: [{ quantity_on_hand: 2 }],
  },
  {
    id: 'prod-mob-7',
    name: 'Apple AirPods Pro (2nd Gen)',
    slug: 'apple-airpods-pro-2',
    sku: 'APL-APP2-USB',
    image_url: '/images/products/airpods-pro-2.jpg',
    selling_price: 21900,
    mrp: 24900,
    gst_rate: 18,
    is_serialized: false,
    description: 'Up to 2x more Active Noise Cancellation with Transparency mode and Personalized Spatial Audio.',
    specs: {
      type: 'True Wireless ANC',
      connector: 'USB-C',
      chip: 'Apple H2',
      battery: '30h with MagSafe Case',
      warranty: '1 Year Apple Official',
    },
    stores: { id: 'store-1', code: 'mobiles', name: 'Star Mobiles' },
    categories: { id: 'cat-wearables', name: 'Wearables & Audio', slug: 'wearables-audio' },
    brands: { id: 'brand-apple', name: 'Apple', slug: 'apple' },
    inventory: [{ quantity_on_hand: 8 }],
  },
  {
    id: 'prod-mob-8',
    name: 'Samsung Galaxy Watch 6 (44mm)',
    slug: 'samsung-galaxy-watch-6',
    sku: 'SAM-GW6-44',
    image_url: '/images/products/galaxy-watch-6.jpg',
    selling_price: 19999,
    mrp: 29999,
    gst_rate: 18,
    is_serialized: true,
    description: 'Personalized sleep coaching, body composition analysis, and sapphire crystal AMOLED display.',
    specs: {
      size: '44mm',
      display: 'Sapphire Crystal Super AMOLED',
      connectivity: 'Bluetooth / Wi-Fi',
      health: 'ECG, BP, Sleep Tracking',
      warranty: '1 Year Samsung Official',
    },
    stores: { id: 'store-1', code: 'mobiles', name: 'Star Mobiles' },
    categories: { id: 'cat-wearables', name: 'Wearables & Audio', slug: 'wearables-audio' },
    brands: { id: 'brand-samsung', name: 'Samsung', slug: 'samsung' },
    inventory: [{ quantity_on_hand: 4 }],
  },
  {
    id: 'prod-fe-4',
    name: 'Samsung 65" Crystal 4K UHD Smart TV',
    slug: 'samsung-65-crystal-4k',
    sku: 'SAM-65C-4K',
    image_url: '/images/products/samsung-65-tv.jpg',
    selling_price: 72990,
    mrp: 84990,
    gst_rate: 18,
    is_serialized: true,
    description: 'Billion true colors with PurColor, Crystal Processor 4K, and Motion Xcelerator for smooth 4K clarity.',
    specs: {
      screen_size: '65 inch (163 cm)',
      resolution: '4K Ultra HD (3840 x 2160)',
      os: 'Tizen Smart TV',
      sound: '20W Dolby Digital Plus',
      warranty: '2 Years Manufacturer On-Site',
    },
    stores: { id: 'store-2', code: 'furniture-electronics', name: 'Star Furniture & Electronics' },
    categories: { id: 'cat-tv', name: 'Televisions', slug: 'televisions' },
    brands: { id: 'brand-samsung-fe', name: 'Samsung', slug: 'samsung' },
    inventory: [{ quantity_on_hand: 2 }],
  },
  {
    id: 'prod-fe-5',
    name: 'Bosch 8kg Front Load Washing Machine',
    slug: 'bosch-8kg-front-load',
    sku: 'BSH-WAJ28468',
    image_url: '/images/products/bosch-washer.jpg',
    selling_price: 38490,
    mrp: 46990,
    gst_rate: 18,
    is_serialized: true,
    description: 'Anti-Tangle technology and hygienic ActiveWater Plus washing with whisper-quiet EcoSilence Drive motor.',
    specs: {
      capacity: '8.0 Kg Front Load',
      spin_speed: '1400 RPM',
      motor: 'EcoSilence Drive Inverter',
      energy_rating: '5 Star',
      warranty: '2 Years Comprehensive + 12 Years Motor',
    },
    stores: { id: 'store-2', code: 'furniture-electronics', name: 'Star Furniture & Electronics' },
    categories: { id: 'cat-washing', name: 'Washing Machines', slug: 'washing-machines' },
    brands: { id: 'brand-bosch', name: 'Bosch', slug: 'bosch' },
    inventory: [{ quantity_on_hand: 3 }],
  },
];

const PUBLIC_CATALOG_CACHE_KEY = 'star_public_catalog_cache';

export function getCachedPublicCatalog() {
  try {
    const raw = localStorage.getItem(PUBLIC_CATALOG_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore localStorage parse error
  }
  return FALLBACK_PRODUCTS.map((p) => ({
    ...p,
    image_url: getProductImageUrl(p),
  }));
}

export function setCachedPublicCatalog(products) {
  try {
    if (products && products.length > 0) {
      localStorage.setItem(PUBLIC_CATALOG_CACHE_KEY, JSON.stringify(products));
    }
  } catch {
    // Ignore localStorage write error
  }
}

/**
 * Lists all active public products across all stores with optional filtering
 *
 * @param {Object} [params]
 * @param {string} [params.storeCode] - 'mobiles' | 'furniture-electronics' | 'all'
 * @param {string} [params.categorySlug]
 * @param {string} [params.search]
 */
export async function listPublicProducts({ storeCode = 'all', categorySlug = '', search = '' } = {}) {
  try {
    let query = supabase
      .from('products')
      .select(`
        id, store_id, category_id, brand_id, name, slug, sku, description,
        is_serialized, cost_price, selling_price, min_selling_price,
        gst_rate, hsn_code, specs, image_url, is_active,
        stores (id, code, name),
        categories (id, name, slug),
        brands (id, name, slug),
        inventory (quantity_on_hand)
      `)
      .eq('is_active', true)
      .order('name');

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase query error, falling back to local catalog:', error.message);
      return filterFallbackProducts({ storeCode, categorySlug, search });
    }

    if (!data || data.length === 0) {
      return filterFallbackProducts({ storeCode, categorySlug, search });
    }

    // Hydrate image_url with fallback if missing in DB
    const enriched = data.map((p) => ({
      ...p,
      image_url: getProductImageUrl(p),
    }));

    if (!search && enriched.length > 0) {
      setCachedPublicCatalog(enriched);
    }

    // Filter by storeCode if specified
    let filtered = enriched;
    if (storeCode && storeCode !== 'all') {
      filtered = filtered.filter((p) => p.stores?.code === storeCode);
    }

    if (categorySlug) {
      filtered = filtered.filter((p) => p.categories?.slug === categorySlug);
    }

    return filtered;
  } catch (err) {
    console.warn('Network error querying catalog, using fallback catalog:', err);
    return filterFallbackProducts({ storeCode, categorySlug, search });
  }
}

function filterFallbackProducts({ storeCode, categorySlug, search }) {
  let list = FALLBACK_PRODUCTS.map((p) => ({
    ...p,
    image_url: getProductImageUrl(p),
  }));

  if (storeCode && storeCode !== 'all') {
    list = list.filter((p) => p.stores.code === storeCode);
  }

  if (categorySlug) {
    list = list.filter((p) => p.categories.slug === categorySlug);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brands.name.toLowerCase().includes(q) ||
        p.categories.name.toLowerCase().includes(q)
    );
  }

  return list;
}
