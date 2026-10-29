import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds fresh data
      gcTime: 1000 * 60 * 30, // 30 minutes in memory cache
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: (failureCount, error) => {
        // Do not retry 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});
