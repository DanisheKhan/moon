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
 * Subscribes to database change events for financial and inventory telemetry.
 * Returns an unsubscribe teardown function.
 */
export function subscribeToFinancialEvents(onChange) {
  const channel = supabase
    .channel('realtime-financial-telemetry')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'invoices' },
      () => onChange('invoices')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'payments' },
      () => onChange('payments')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_items' },
      () => onChange('order_items')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inventory' },
      () => onChange('inventory')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      () => onChange('products')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'product_units' },
      () => onChange('product_units')
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
