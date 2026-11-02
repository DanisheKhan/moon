import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment');
}

export const supabase = createClient(url || '', key || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Subscribes to database change events for financial, inventory, and staff telemetry.
 * Returns an unsubscribe teardown function.
 */
export function subscribeToFinancialEvents(onChange) {
  const channel = supabase
    .channel('realtime-store-telemetry')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'invoices' },
      (payload) => onChange('invoices', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'payments' },
      (payload) => onChange('payments', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_items' },
      (payload) => onChange('order_items', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sales_returns' },
      (payload) => onChange('sales_returns', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inventory' },
      (payload) => onChange('inventory', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => onChange('products', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'product_units' },
      (payload) => onChange('product_units', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      (payload) => onChange('categories', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'staff_profiles' },
      (payload) => onChange('staff_profiles', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'staff_leaves' },
      (payload) => onChange('staff_leaves', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'staff_salaries' },
      (payload) => onChange('staff_salaries', payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'stores' },
      (payload) => onChange('stores', payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
