import { supabase } from '@/shared/lib/supabase';

/**
 * Places a sale transaction atomically via database RPC
 */
export async function placeSale({
  storeId,
  customerName = 'Walk-in Customer',
  customerPhone = null,
  customerGstin = null,
  items,
  payments,
}) {
  const { data, error } = await supabase.rpc('place_sale', {
    p_store_id: storeId,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_customer_gstin: customerGstin,
    p_items: items,
    p_payments: payments,
  });

  if (error) throw error;
  return data;
}

/**
 * Lists past invoices for a store
 */
export async function listInvoices({ storeId, limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, store_id, invoice_number, financial_year, customer_name, customer_phone, subtotal, discount_amount, cgst_amount, sgst_amount, grand_total, status, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Lists all invoices across all stores with full filtering & relation telemetry
 */
export async function listAllInvoices({
  storeId = 'all',
  status = 'all',
  dateRange = 'all',
  search = '',
} = {}) {
  let query = supabase
    .from('invoices')
    .select(`
      id, store_id, invoice_number, financial_year, customer_name, customer_phone, customer_gstin,
      subtotal, discount_amount, cgst_amount, sgst_amount, igst_amount, grand_total, status, created_at,
      stores (id, name, code, invoice_prefix, gstin, city),
      payments (id, payment_method, amount, reference_number),
      order_items (id, item_name, serial_number, quantity, unit_price, discount, total_amount, gst_rate)
    `)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (dateRange && dateRange !== 'all') {
    const now = new Date();
    let dateFilter = null;
    if (dateRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = startOfDay.toISOString();
    } else if (dateRange === 'week') {
      const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = pastWeek.toISOString();
    } else if (dateRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = startOfMonth.toISOString();
    }
    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  let results = data || [];

  // Filter in memory by storeCode or store_id if not 'all'
  if (storeId && storeId !== 'all') {
    results = results.filter((inv) => inv.store_id === storeId || inv.stores?.code === storeId);
  }

  // Filter by search query
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (inv) =>
        (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
        (inv.customer_phone && inv.customer_phone.toLowerCase().includes(q)) ||
        (inv.customer_gstin && inv.customer_gstin.toLowerCase().includes(q)) ||
        (inv.stores?.name && inv.stores.name.toLowerCase().includes(q))
    );
  }

  return results;
}

/**
 * Updates an invoice, its line items, and payment details
 */
export async function updateInvoice({ invoiceId, updates, items = [], payment = null }) {
  // 1. Update invoice header
  const { data: invData, error: invErr } = await supabase
    .from('invoices')
    .update({
      customer_name: updates.customer_name ?? 'Walk-in Customer',
      customer_phone: updates.customer_phone || null,
      customer_gstin: updates.customer_gstin || null,
      status: updates.status || 'paid',
      subtotal: updates.subtotal,
      discount_amount: updates.discount_amount || 0,
      cgst_amount: updates.cgst_amount,
      sgst_amount: updates.sgst_amount,
      grand_total: updates.grand_total,
    })
    .eq('id', invoiceId)
    .select('id, store_id, invoice_number, customer_name, customer_phone, customer_gstin, subtotal, discount_amount, cgst_amount, sgst_amount, grand_total, status, created_at')
    .single();

  if (invErr) throw invErr;

  // 2. Update line items
  if (items && items.length > 0) {
    for (const item of items) {
      if (item.id) {
        const taxable = Math.max((Number(item.unit_price) - Number(item.discount || 0)) * Number(item.quantity), 0);
        const gstRate = Number(item.gst_rate ?? 18);
        const cgst = taxable * (gstRate / 200);
        const sgst = taxable * (gstRate / 200);
        const total = Math.round(taxable + cgst + sgst);

        const { error: itemErr } = await supabase
          .from('order_items')
          .update({
            item_name: item.item_name,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            discount: Number(item.discount || 0),
            taxable_value: taxable,
            cgst_amount: cgst,
            sgst_amount: sgst,
            total_amount: total,
          })
          .eq('id', item.id);

        if (itemErr) throw itemErr;
      }
    }
  }

  // 3. Handle removed items if any
  if (updates.removedItemIds && updates.removedItemIds.length > 0) {
    const { error: delErr } = await supabase
      .from('order_items')
      .delete()
      .in('id', updates.removedItemIds);

    if (delErr) throw delErr;
  }

  // 4. Update payment details if provided
  if (payment) {
    const paymentUpdates = {
      payment_method: payment.payment_method || 'cash',
      amount: updates.grand_total,
    };
    if (payment.reference_number !== undefined) {
      paymentUpdates.reference_number = payment.reference_number || null;
    }

    if (payment.id) {
      const { error: payErr } = await supabase
        .from('payments')
        .update(paymentUpdates)
        .eq('id', payment.id);
      if (payErr) throw payErr;
    } else {
      const { error: payErr } = await supabase
        .from('payments')
        .update(paymentUpdates)
        .eq('invoice_id', invoiceId);
      if (payErr) throw payErr;
    }
  }

  return invData;
}

/**
 * Voids an invoice
 */
export async function voidInvoice(invoiceId) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'void' })
    .eq('id', invoiceId)
    .select('id, invoice_number, status')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches complete invoice with items and payments for receipt printing or editing
 */
export async function getInvoiceDetail(invoiceId) {
  const [invRes, itemsRes, payRes] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        id, store_id, invoice_number, financial_year, customer_name, customer_phone, customer_gstin,
        subtotal, discount_amount, cgst_amount, sgst_amount, grand_total, status, created_at,
        stores (id, name, code, gstin, address_line1, city, pincode, phone, email)
      `)
      .eq('id', invoiceId)
      .single(),
    supabase
      .from('order_items')
      .select('id, product_id, unit_id, item_name, serial_number, hsn_code, quantity, unit_price, discount, taxable_value, gst_rate, cgst_amount, sgst_amount, total_amount')
      .eq('invoice_id', invoiceId),
    supabase
      .from('payments')
      .select('id, payment_method, amount, reference_number')
      .eq('invoice_id', invoiceId),
  ]);

  if (invRes.error) throw invRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (payRes.error) throw payRes.error;

  return {
    ...invRes.data,
    items: itemsRes.data || [],
    payments: payRes.data || [],
  };
}
