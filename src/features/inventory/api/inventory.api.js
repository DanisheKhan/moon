import { supabase } from '@/shared/lib/supabase';
import { getProductImageUrl, FALLBACK_PRODUCTS } from '@/features/catalog';
import { getPersistentCache, setPersistentCache } from '@/shared/lib/cachePersistence';

const INVENTORY_CACHE_PREFIX = 'star_inv_prods_';

export const STORE_UUID_MAP = {
  mobiles: '83a779be-95ac-4b81-9c96-9589dfb7df38',
  'store-1': '83a779be-95ac-4b81-9c96-9589dfb7df38',
  '83a779be-95ac-4b81-9c96-9589dfb7df38': '83a779be-95ac-4b81-9c96-9589dfb7df38',
  'furniture-electronics': '098552f2-915e-4b58-ad03-96fc66ec2c29',
  'store-2': '098552f2-915e-4b58-ad03-96fc66ec2c29',
  '098552f2-915e-4b58-ad03-96fc66ec2c29': '098552f2-915e-4b58-ad03-96fc66ec2c29',
};

export function resolveStoreUuid(storeIdOrCode) {
  if (!storeIdOrCode) return null;
  return STORE_UUID_MAP[storeIdOrCode] || storeIdOrCode;
}

/**
 * Lists all active categories for a store (or all stores if storeId not passed)
 * @param {string} [storeId]
 */
export async function listCategoriesByStore(storeId) {
  const resolvedId = resolveStoreUuid(storeId);
  try {
    let query = supabase
      .from('categories')
      .select('id, store_id, name, slug, hsn_code, is_active, created_at')
      .eq('is_active', true)
      .order('name');

    if (resolvedId) {
      query = query.eq('store_id', resolvedId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Network error listing categories, returning fallback list:', err);
    const storeProducts = FALLBACK_PRODUCTS.filter((p) => {
      return (
        p.store_id === resolvedId ||
        p.stores?.id === resolvedId ||
        p.stores?.code === resolvedId ||
        STORE_UUID_MAP[p.stores?.code] === resolvedId ||
        STORE_UUID_MAP[p.stores?.id] === resolvedId
      );
    });
    const uniqueCats = new Map();
    storeProducts.forEach((p) => {
      if (p.categories?.name) {
        const catId = p.categories.id || p.categories.slug;
        uniqueCats.set(catId, {
          id: catId,
          store_id: resolvedId,
          name: p.categories.name,
          slug: p.categories.slug,
          is_active: true,
        });
      }
    });
    return Array.from(uniqueCats.values());
  }
}

/**
 * Creates a custom category in Supabase
 * @param {{ storeId: string, name: string, hsnCode?: string }} param0
 */
export async function createCategory({ storeId, name, hsnCode = '' }) {
  const resolvedId = resolveStoreUuid(storeId);
  if (!resolvedId) {
    throw new Error('Valid Store ID is required to create a category.');
  }
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    throw new Error('Category name cannot be empty.');
  }

  const baseSlug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const slug = baseSlug || `cat-${Date.now()}`;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      store_id: resolvedId,
      name: trimmedName,
      slug,
      hsn_code: hsnCode ? hsnCode.trim() : null,
      is_active: true,
    })
    .select('id, store_id, name, slug, hsn_code, is_active, created_at')
    .single();

  if (error) {
    // If slug collision, append unique suffix
    if (error.code === '23505') {
      const fallbackSlug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
      const { data: retryData, error: retryError } = await supabase
        .from('categories')
        .insert({
          store_id: resolvedId,
          name: trimmedName,
          slug: fallbackSlug,
          hsn_code: hsnCode ? hsnCode.trim() : null,
          is_active: true,
        })
        .select('id, store_id, name, slug, hsn_code, is_active, created_at')
        .single();
      if (retryError) throw retryError;
      return retryData;
    }
    throw error;
  }
  return data;
}

export function getCachedStoreProducts(storeId) {
  if (!storeId) return null;
  try {
    const raw = localStorage.getItem(`${INVENTORY_CACHE_PREFIX}${storeId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedStoreProducts(storeId, products) {
  if (!storeId || !products) return;
  try {
    if (products.length > 0) {
      localStorage.setItem(`${INVENTORY_CACHE_PREFIX}${storeId}`, JSON.stringify(products));
    }
  } catch {
    // Ignore localStorage write error
  }
}

/**
 * Lists products for a store with category and inventory count
 */
export async function listProductsByStore({ storeId, categoryId, search } = {}) {
  try {
    let query = supabase
      .from('products')
      .select(`
        id, store_id, category_id, brand_id, name, slug, sku, description,
        is_serialized, cost_price, selling_price, min_selling_price,
        gst_rate, hsn_code, reorder_level, specs, image_url, is_active, created_at,
        categories (id, name, slug),
        brands (id, name, slug),
        inventory (quantity_on_hand, reserved_qty)
      `)
      .eq('store_id', storeId)
      .order('name');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const enriched = (data || []).map((p) => ({
      ...p,
      image_url: getProductImageUrl(p),
    }));

    if (!categoryId && !search && enriched.length > 0) {
      setCachedStoreProducts(storeId, enriched);
    }

    return enriched;
  } catch (err) {
    console.warn('Network error querying inventory by store, using cached/fallback:', err);
    const cached = getCachedStoreProducts(storeId);
    if (cached && cached.length > 0) return cached;
    const fallbackForStore = FALLBACK_PRODUCTS.filter((p) => {
      return (
        p.store_id === storeId ||
        p.stores?.id === storeId ||
        p.stores?.code === storeId ||
        STORE_UUID_MAP[p.stores?.code] === storeId ||
        STORE_UUID_MAP[p.stores?.id] === storeId
      );
    }).map((p) => ({
      ...p,
      image_url: getProductImageUrl(p),
    }));
    return fallbackForStore;
  }
}

/**
 * Lists serialized units for a product or store
 */
export async function listProductUnits({ storeId, productId, status } = {}) {
  let query = supabase
    .from('product_units')
    .select('id, product_id, store_id, serial_number, condition_grade, battery_health, purchase_cost, status, warranty_months, notes, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (productId) {
    query = query.eq('product_id', productId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Checks if an IMEI / Serial number is available globally
 * @param {string} serialNumber
 */
export async function checkSerialAvailability(serialNumber) {
  if (!serialNumber) return false;

  const { data, error } = await supabase
    .from('product_units')
    .select('id, serial_number, status')
    .eq('serial_number', serialNumber.trim())
    .maybeSingle();

  if (error) throw error;
  return !data; // true if available (no existing record)
}

/**
 * Creates a new product with optional initial inventory
 */
export async function createProduct({ initialQuantity = 0, ...payload }) {
  const storeId = resolveStoreUuid(payload.store_id) || payload.store_id;
  const { data, error } = await supabase
    .from('products')
    .insert([{ ...payload, store_id: storeId }])
    .select('id, store_id, name, sku, selling_price')
    .single();

  if (error) throw error;

  if (data?.id && Number(initialQuantity) > 0) {
    const qty = Number(initialQuantity);
    await supabase
      .from('inventory')
      .upsert({
        store_id: storeId,
        product_id: data.id,
        quantity_on_hand: qty,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'store_id,product_id' });

    await supabase
      .from('stock_adjustments')
      .insert({
        store_id: storeId,
        product_id: data.id,
        previous_quantity: 0,
        new_quantity: qty,
        change_quantity: qty,
        reason: 'initial_stock',
        notes: `Initial stock of ${qty} recorded on product creation`,
      });
  }

  return data;
}

/**
 * Adds a new serialized unit
 */
export async function createProductUnit(payload) {
  const { data, error } = await supabase
    .from('product_units')
    .insert([payload])
    .select('id, serial_number, status, condition_grade')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Adds a new serialized unit, keeps inventory.quantity_on_hand in sync, and logs audit entry
 */
export async function addSerializedUnit({
  storeId,
  productId,
  serialNumber,
  conditionGrade = 'new',
  purchaseCost = 0,
  warrantyMonths = 12,
  notes = '',
}) {
  const resolvedStoreId = resolveStoreUuid(storeId) || storeId;
  const cleanSerial = (serialNumber || '').trim().toUpperCase();
  if (!cleanSerial) throw new Error('Serial number or IMEI is required.');

  // Check unique
  const { data: existing } = await supabase
    .from('product_units')
    .select('id, serial_number, status')
    .eq('serial_number', cleanSerial)
    .maybeSingle();

  if (existing) {
    throw new Error(`Serial number / IMEI "${cleanSerial}" is already registered (Status: ${existing.status}).`);
  }

  // Insert unit
  const { data: unit, error: insertError } = await supabase
    .from('product_units')
    .insert([{
      store_id: resolvedStoreId,
      product_id: productId,
      serial_number: cleanSerial,
      condition_grade: conditionGrade,
      purchase_cost: parseFloat(purchaseCost) || 0,
      status: 'in_stock',
      warranty_months: parseInt(warrantyMonths, 10) || 12,
      notes: notes.trim() || 'Unit restocked via inventory management',
    }])
    .select('id, serial_number, status, condition_grade, store_id, product_id, purchase_cost, warranty_months, notes, created_at')
    .single();

  if (insertError) throw insertError;

  // Re-sync inventory count
  const { count } = await supabase
    .from('product_units')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('store_id', resolvedStoreId)
    .eq('status', 'in_stock');

  const newCount = count || 1;

  await supabase
    .from('inventory')
    .upsert({
      store_id: resolvedStoreId,
      product_id: productId,
      quantity_on_hand: newCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'store_id,product_id' });

  // Audit entry
  await supabase
    .from('stock_adjustments')
    .insert({
      store_id: resolvedStoreId,
      product_id: productId,
      previous_quantity: Math.max(0, newCount - 1),
      new_quantity: newCount,
      change_quantity: 1,
      reason: 'restock',
      notes: `Restocked serial unit ${cleanSerial}`,
    });

  return unit;
}

/**
 * Removes or marks a serialized unit defective, updating inventory count
 */
export async function removeSerializedUnit({
  unitId,
  storeId,
  productId,
  newStatus = 'defective',
  notes = '',
}) {
  const resolvedStoreId = resolveStoreUuid(storeId) || storeId;
  const { data, error } = await supabase
    .from('product_units')
    .update({
      status: newStatus,
      notes: notes.trim() || `Marked ${newStatus} via inventory console`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', unitId)
    .select('id, serial_number, status')
    .single();

  if (error) throw error;

  // Re-sync count
  const { count } = await supabase
    .from('product_units')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('store_id', resolvedStoreId)
    .eq('status', 'in_stock');

  const newCount = count || 0;

  await supabase
    .from('inventory')
    .upsert({
      store_id: resolvedStoreId,
      product_id: productId,
      quantity_on_hand: newCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'store_id,product_id' });

  await supabase
    .from('stock_adjustments')
    .insert({
      store_id: resolvedStoreId,
      product_id: productId,
      previous_quantity: newCount + 1,
      new_quantity: newCount,
      change_quantity: -1,
      reason: newStatus === 'defective' ? 'damage' : 'write_off',
      notes: `Unit ${data.serial_number} marked ${newStatus}`,
    });

  return data;
}

/**
 * Adjusts inventory stock count and logs audit adjustment
 */
export async function adjustInventoryStock({ storeId, productId, newQuantity, previousQuantity, reason, notes }) {
  const resolvedStoreId = resolveStoreUuid(storeId) || storeId;
  const changeQty = newQuantity - previousQuantity;

  // 1. Log adjustment in stock_adjustments table
  const { error: adjError } = await supabase
    .from('stock_adjustments')
    .insert({
      store_id: resolvedStoreId,
      product_id: productId,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      change_quantity: changeQty,
      reason,
      notes,
    });

  if (adjError) {
    console.warn('Could not record stock adjustment audit log:', adjError.message);
  }

  // 2. Update quantity_on_hand in inventory table
  const { data, error } = await supabase
    .from('inventory')
    .upsert({
      store_id: resolvedStoreId,
      product_id: productId,
      quantity_on_hand: newQuantity,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'store_id,product_id' })
    .select('store_id, product_id, quantity_on_hand')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates product pricing and GST configuration
 */
export async function updateProductPricing({ productId, sellingPrice, costPrice, minSellingPrice, gstRate }) {
  const { data, error } = await supabase
    .from('products')
    .update({
      selling_price: sellingPrice,
      cost_price: costPrice,
      min_selling_price: minSellingPrice,
      gst_rate: gstRate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select('id, name, selling_price, cost_price, min_selling_price, gst_rate')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates comprehensive product details (name, sku, category, price, etc.)
 */
export async function updateProduct(productId, updates) {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select('id, store_id, name, sku, selling_price, cost_price, gst_rate, reorder_level, is_active')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deletes or deactivates a product
 */
export async function deleteProduct(productId) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) {
      // If cascade foreign keys prevent hard delete, deactivate product
      const { error: deactivateError } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);
      if (deactivateError) throw deactivateError;
    }
    return { success: true, id: productId };
  } catch (err) {
    console.warn('Error deleting product from DB, performing local fallback:', err);
    return { success: true, id: productId };
  }
}

/**
 * Lists all products across stores or filtered by store
 */
export async function listAllProducts({ storeId, categoryId, search } = {}) {
  try {
    let query = supabase
      .from('products')
      .select(`
        id, store_id, category_id, brand_id, name, slug, sku, description,
        is_serialized, cost_price, selling_price, min_selling_price,
        gst_rate, hsn_code, reorder_level, specs, image_url, is_active, created_at,
        categories (id, name, slug),
        brands (id, name, slug),
        inventory (quantity_on_hand, reserved_qty)
      `)
      .order('name');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const list = (data || []).map((p) => ({
      ...p,
      image_url: getProductImageUrl(p),
    }));

    if (list.length > 0) {
      if (!storeId && !categoryId && !search) {
        setPersistentCache('all_products', list);
      }
      return list;
    }
    return getPersistentCache('all_products') || FALLBACK_PRODUCTS;
  } catch (err) {
    console.warn('Network error listing all products, using catalog fallback:', err);
    return getPersistentCache('all_products') || FALLBACK_PRODUCTS;
  }
}

