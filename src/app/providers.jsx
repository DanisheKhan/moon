import { useEffect } from 'react';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/shared/lib/queryClient';
import { subscribeToFinancialEvents } from '@/shared/lib/supabase';
import { AuthProvider } from '@/features/auth';
import { CartProvider } from '@/features/catalog';

function RealtimeSyncManager({ children }) {
  const qc = useQueryClient();

  useEffect(() => {
    // Listen to changes across all financial, invoice, payment, and inventory tables
    const unsubscribe = subscribeToFinancialEvents((table) => {
      if (table === 'invoices' || table === 'payments' || table === 'order_items') {
        qc.invalidateQueries({ queryKey: ['billing'] });
        qc.invalidateQueries({ queryKey: ['reports'] });
        qc.invalidateQueries({ queryKey: ['stores'] });
      } else if (table === 'inventory' || table === 'products' || table === 'product_units') {
        qc.invalidateQueries({ queryKey: ['inventory'] });
        qc.invalidateQueries({ queryKey: ['reports'] });
      }
    });

    return unsubscribe;
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
