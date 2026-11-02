import { useEffect } from 'react';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/shared/lib/queryClient';
import { subscribeToFinancialEvents } from '@/shared/lib/supabase';
import { evictPersistentCache } from '@/shared/lib/cachePersistence';
import { AuthProvider } from '@/features/auth';
import { CartProvider } from '@/features/catalog';

function RealtimeSyncManager({ children }) {
  const qc = useQueryClient();

  useEffect(() => {
    // Setup cross-tab sync channel
    let broadcast;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcast = new BroadcastChannel('star_realtime_sync');
        broadcast.onmessage = (event) => {
          const { domain } = event.data || {};
          if (domain === 'billing') {
            evictPersistentCache('invoices');
            evictPersistentCache('dashboard');
            qc.invalidateQueries({ queryKey: ['billing'] });
            qc.invalidateQueries({ queryKey: ['reports'] });
            qc.invalidateQueries({ queryKey: ['stores'] });
          } else if (domain === 'inventory') {
            evictPersistentCache('inv_prods');
            evictPersistentCache('all_products');
            evictPersistentCache('dashboard');
            qc.invalidateQueries({ queryKey: ['inventory'] });
            qc.invalidateQueries({ queryKey: ['reports'] });
          } else if (domain === 'staff') {
            evictPersistentCache('staff');
            qc.invalidateQueries({ queryKey: ['staff'] });
          }
        };
      }
    } catch {
      // Ignore broadcast channel errors in restricted environments
    }

    // Listen to changes across all financial, invoice, payment, inventory, and HRMS tables
    const unsubscribe = subscribeToFinancialEvents((table) => {
      if (table === 'invoices' || table === 'payments' || table === 'order_items' || table === 'sales_returns') {
        evictPersistentCache('invoices');
        evictPersistentCache('dashboard');
        qc.invalidateQueries({ queryKey: ['billing'] });
        qc.invalidateQueries({ queryKey: ['reports'] });
        qc.invalidateQueries({ queryKey: ['stores'] });
        broadcast?.postMessage({ domain: 'billing', table });
      } else if (table === 'inventory' || table === 'products' || table === 'product_units' || table === 'categories') {
        evictPersistentCache('inv_prods');
        evictPersistentCache('all_products');
        evictPersistentCache('dashboard');
        qc.invalidateQueries({ queryKey: ['inventory'] });
        qc.invalidateQueries({ queryKey: ['reports'] });
        broadcast?.postMessage({ domain: 'inventory', table });
      } else if (table === 'staff_profiles' || table === 'staff_leaves' || table === 'staff_salaries') {
        evictPersistentCache('staff');
        qc.invalidateQueries({ queryKey: ['staff'] });
        broadcast?.postMessage({ domain: 'staff', table });
      } else if (table === 'stores') {
        evictPersistentCache('dashboard');
        qc.invalidateQueries({ queryKey: ['stores'] });
        qc.invalidateQueries({ queryKey: ['reports'] });
      }
    });

    return () => {
      unsubscribe();
      broadcast?.close();
    };
  }, [qc]);

  return children;
}

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSyncManager>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </RealtimeSyncManager>
    </QueryClientProvider>
  );
}
