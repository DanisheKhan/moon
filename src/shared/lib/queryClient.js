import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 15 seconds stale time keeps views snappy while preventing redundant roundtrips
      // Live updates are seamlessly handled via Supabase Realtime WebSockets
      staleTime: 1000 * 15,
      gcTime: 1000 * 60 * 30, // 30 minutes memory retention
      refetchOnWindowFocus: true, // Syncs live when returning to tab
      refetchOnMount: true, // Verifies fresh data on screen navigation
      retry: (failureCount, error) => {
        // Do not retry 4xx client errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});
