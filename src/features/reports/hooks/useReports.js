import { useQuery } from '@tanstack/react-query';
import { getOwnerOverview, getOwnerDashboardData } from '../api/reports.api';

export const reportKeys = {
  all: ['reports'],
  owner: () => [...reportKeys.all, 'owner-overview'],
  dashboard: (dateRange, storeCode = 'all') => [...reportKeys.all, 'owner-dashboard', dateRange, storeCode],
};

export function useOwnerOverview() {
  return useQuery({
    queryKey: reportKeys.owner(),
    queryFn: getOwnerOverview,
    staleTime: 1000 * 5,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });
}

/**
 * Hook to retrieve full command center metrics for the Store Owner
 * Supports both object params ({ dateRange, storeCode }) and legacy string dateRange
 * @param {string | { dateRange?: 'today' | 'week' | 'month' | 'all', storeCode?: 'all' | 'mobiles' | 'furniture-electronics' }} [options]
 */
export function useOwnerDashboard(options = 'month') {
  const params = typeof options === 'string' ? { dateRange: options, storeCode: 'all' } : { dateRange: 'month', storeCode: 'all', ...options };
  const { dateRange, storeCode } = params;

  return useQuery({
    queryKey: reportKeys.dashboard(dateRange, storeCode),
    queryFn: () => getOwnerDashboardData({ dateRange, storeCode }),
    staleTime: 1000 * 5,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    retry: 2,
  });
}
