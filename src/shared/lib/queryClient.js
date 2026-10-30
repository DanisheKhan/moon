import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 3 minutes stale time prevents thrashing and redundant network roundtrips
      // Live updates are seamlessly handled via Supabase Realtime WebSockets
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 60, // 1 hour memory retention
      refetchOnWindowFocus: false, // Prevents sudden refetch lag when switching tabs
      refetchOnMount: false, // Reuses fresh cache immediately on page navigation
      retry: (failureCount, error) => {
        // Do not retry 4xx client errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});
