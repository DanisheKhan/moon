import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listStores, getStoreByCode, DEFAULT_STORES, getCachedStores, getExtraStores, enrichStore } from '../api/stores.api';

export const storeKeys = {
  all: ['stores'],
  list: () => [...storeKeys.all, 'list'],
  detail: (code) => [...storeKeys.all, 'detail', code],
};

export function useStores() {
  return useQuery({
    queryKey: storeKeys.list(),
    queryFn: listStores,
    initialData: () => {
      const cached = (getCachedStores() || DEFAULT_STORES).map(enrichStore);
      const extras = getExtraStores();
      const extraCodes = new Set(extras.map((s) => s.code));
      return [...cached.filter((s) => !extraCodes.has(s.code)), ...extras];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useStore(code) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: storeKeys.detail(code),
    queryFn: () => getStoreByCode(code),
    initialData: () => {
      const stores = queryClient.getQueryData(storeKeys.list());
      if (stores) {
        const found = stores.find((s) => s.code === code);
        if (found) return found;
      }
      const cached = getCachedStores();
      if (cached) {
        const found = cached.find((s) => s.code === code);
        if (found) return found;
      }
      const extra = getExtraStores().find((s) => s.code === code);
      if (extra) return extra;
      return DEFAULT_STORES.find((s) => s.code === code) || null;
    },
    enabled: Boolean(code),
    staleTime: 1000 * 60 * 10,
  });
}
