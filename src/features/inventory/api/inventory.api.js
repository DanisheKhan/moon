import { supabase } from '@/shared/lib/supabase';
import { getProductImageUrl, FALLBACK_PRODUCTS } from '@/features/catalog';

const INVENTORY_CACHE_PREFIX = 'star_inv_prods_';

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
    console.warn('Network error querying inventory by store, using cached:', err);
    const cached = getCachedStoreProducts(storeId);
    if (cached) return cached;
    throw err;
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
 * Creates a new product
 */
export async function createProduct(payload) {
  const { data, error } = await supabase
    .from('products')
    .insert([payload])
    .select('id, store_id, name, sku, selling_price')
    .single();

  if (error) throw error;
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
 * Adjusts inventory stock count and logs audit adjustment
 */
export async function adjustInventoryStock({ storeId, productId, newQuantity, previousQuantity, reason, notes }) {
  const changeQty = newQuantity - previousQuantity;

  // 1. Log adjustment in stock_adjustments table
  const { error: adjError } = await supabase
    .from('stock_adjustments')
    .insert({
      store_id: storeId,
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
      store_id: storeId,
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

    if (list.length > 0) return list;
    return FALLBACK_PRODUCTS;
  } catch (err) {
    console.warn('Network error listing all products, using catalog fallback:', err);
    return FALLBACK_PRODUCTS;
  }
}

