import { supabase } from '@/shared/lib/supabase';

export const STORE_DIRECTORY = {
  mobiles: {
    display_name: 'Star Mobile',
    manager_name: 'Rajesh Kulkarni',
  },
  'furniture-electronics': {
    display_name: 'Star Furniture',
    manager_name: 'Priya Deshpande',
  },
};

export const DEFAULT_STORES = [
  {
    id: '83a779be-95ac-4b81-9c96-9589dfb7df38',
    code: 'mobiles',
    name: 'Star Mobiles',
    display_name: 'Star Mobile',
    manager_name: 'Rajesh Kulkarni',
    gstin: '27AAAAA0000A1Z5',
    state_code: '27',
    legal_name: 'Star Enterprises',
    trade_name: 'Star Mobiles',
    address_line1: 'Shop 101, Main Road Market',
    city: 'Mumbai',
    pincode: '400001',
    phone: '+91 98200 12345',
    email: 'mobiles@starenterprises.in',
    invoice_prefix: 'MOB',
    is_active: true,
  },
  {
    id: '098552f2-915e-4b58-ad03-96fc66ec2c29',
    code: 'furniture-electronics',
    name: 'Star Furniture & Electronics',
    display_name: 'Star Furniture',
    manager_name: 'Priya Deshpande',
    gstin: '27AAAAA0000A1Z5',
    state_code: '27',
    legal_name: 'Star Enterprises',
    trade_name: 'Star Furniture & Electronics',
    address_line1: 'Shop 102, Main Road Market',
    city: 'Mumbai',
    pincode: '400001',
    phone: '+91 98200 12346',
    email: 'fe@starenterprises.in',
    invoice_prefix: 'FE',
    is_active: true,
  },
];

const STORES_CACHE_KEY = 'star_stores_cache';
const EXTRA_STORES_KEY = 'star_extra_stores';

export function enrichStore(store) {
  if (!store) return store;
  const directory = STORE_DIRECTORY[store.code] || {};
  return {
    ...directory,
    ...store,
    display_name: store.display_name || directory.display_name || store.name,
    manager_name: store.manager_name || directory.manager_name || 'Unassigned',
  };
}

export function getExtraStores() {
  try {
    const raw = localStorage.getItem(EXTRA_STORES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(enrichStore) : [];
  } catch {
    return [];
  }
}

function slugifyStoreCode(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  return slug || `store-${Date.now()}`;
}

export function createOwnerStore(payload) {
  const existing = [...(getCachedStores() || DEFAULT_STORES), ...getExtraStores()];
  let code = slugifyStoreCode(payload.name);
  if (existing.some((s) => s.code === code)) {
    code = `${code}-${Date.now().toString().slice(-4)}`;
  }

  const prefixBase = payload.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'STR';
  const invoice_prefix = existing.some((s) => s.invoice_prefix === prefixBase)
    ? `${prefixBase}${Date.now().toString().slice(-2)}`
    : prefixBase;

  const store = enrichStore({
    id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
    code,
    name: payload.name,
    display_name: payload.name,
    manager_name: payload.manager_name || 'Unassigned',
    gstin: payload.gstin,
    state_code: '27',
    legal_name: 'Star Enterprises',
    trade_name: payload.name,
    address_line1: payload.address_line1,
    city: payload.city,
    pincode: payload.pincode || '',
    phone: payload.phone || '',
    email: `${code}@starenterprises.in`,
    invoice_prefix,
    is_active: true,
    is_local: true,
  });

  const next = [...getExtraStores(), store];
  try {
    localStorage.setItem(EXTRA_STORES_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage write error
  }
  return store;
}

function mergeStoreLists(primary) {
  const extras = getExtraStores();
  const extraCodes = new Set(extras.map((s) => s.code));
  return [...primary.map(enrichStore).filter((s) => !extraCodes.has(s.code)), ...extras];
}

export function getCachedStores() {
  try {
    const raw = localStorage.getItem(STORES_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedStores(stores) {
  try {
    if (stores && stores.length > 0) {
      localStorage.setItem(STORES_CACHE_KEY, JSON.stringify(stores));
    }
  } catch {
    // Ignore localStorage write error
  }
}

/**
 * Lists all active stores
 */
export async function listStores() {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, code, name, gstin, state_code, legal_name, trade_name, address_line1, city, pincode, phone, email, invoice_prefix, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    if (data && data.length > 0) {
      setCachedStores(data);
      return mergeStoreLists(data);
    }
    return mergeStoreLists(getCachedStores() || DEFAULT_STORES);
  } catch (err) {
    console.warn('Network error loading stores, using cached/default stores:', err);
    return mergeStoreLists(getCachedStores() || DEFAULT_STORES);
  }
}

/**
 * Gets a single store by its unique code ('mobiles' or 'furniture-electronics')
 * @param {string} code
 */
export async function getStoreByCode(code) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, code, name, gstin, state_code, legal_name, trade_name, address_line1, city, pincode, phone, email, invoice_prefix, is_active')
      .eq('code', code)
      .single();

    if (error) throw error;
    if (data) return enrichStore(data);
  } catch (err) {
    console.warn(`Network error loading store ${code}, using fallback:`, err);
  }

  const extra = getExtraStores().find((s) => s.code === code);
  if (extra) return extra;

  const cached = getCachedStores();
  if (cached) {
    const match = cached.find((s) => s.code === code);
    if (match) return enrichStore(match);
  }
  const fallback = DEFAULT_STORES.find((s) => s.code === code) || null;
  return enrichStore(fallback);
}
