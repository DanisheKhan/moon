import { useQuery } from '@tanstack/react-query';
import { getOwnerOverview, getOwnerDashboardData } from '../api/reports.api';
import { getCachedDashboardData } from '@/shared/lib/cachePersistence';

export const reportKeys = {
  all: ['reports'],
  owner: () => [...reportKeys.all, 'owner-overview'],
  dashboard: (dateRange, storeCode = 'all') => [...reportKeys.all, 'owner-dashboard', dateRange, storeCode],
};

export function useOwnerOverview() {
  return useQuery({
    queryKey: reportKeys.owner(),
    queryFn: getOwnerOverview,
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to retrieve full command center metrics for the Store Owner
 * Employs Stale-While-Revalidate (SWR) with verified persistent cache
 * Hydrates at 0ms latency, revalidating accurately in the background.
 *
 * @param {string | { dateRange?: 'today' | 'week' | 'month' | 'all', storeCode?: 'all' | 'mobiles' | 'furniture-electronics' }} [options]
 */
export function useOwnerDashboard(options = 'month') {
  const params = typeof options === 'string' ? { dateRange: options, storeCode: 'all' } : { dateRange: 'month', storeCode: 'all', ...options };
  const { dateRange, storeCode } = params;

  return useQuery({
    queryKey: reportKeys.dashboard(dateRange, storeCode),
    queryFn: () => getOwnerDashboardData({ dateRange, storeCode }),
    initialData: () => getCachedDashboardData(dateRange, storeCode) || undefined,
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
