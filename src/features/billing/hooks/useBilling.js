import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  placeSale,
  listInvoices,
  listAllInvoices,
  getInvoiceDetail,
  updateInvoice,
  voidInvoice,
} from '../api/billing.api';
import { inventoryKeys } from '@/features/inventory';

export const billingKeys = {
  all: ['billing'],
  invoices: (storeId) => [...billingKeys.all, 'invoices', storeId],
  allInvoices: (filters) => [...billingKeys.all, 'all-invoices', filters],
  detail: (invoiceId) => [...billingKeys.all, 'detail', invoiceId],
};

export function useInvoices(storeId) {
  return useQuery({
    queryKey: billingKeys.invoices(storeId),
    queryFn: () => listInvoices({ storeId }),
    enabled: Boolean(storeId),
    staleTime: 1000 * 5,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });
}

export function useAllInvoices(filters = {}) {
  return useQuery({
    queryKey: billingKeys.allInvoices(filters),
    queryFn: () => listAllInvoices(filters),
    staleTime: 1000 * 5,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });
}

export function useInvoiceDetail(invoiceId) {
  return useQuery({
    queryKey: billingKeys.detail(invoiceId),
    queryFn: () => getInvoiceDetail(invoiceId),
    enabled: Boolean(invoiceId),
  });
}

export function usePlaceSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useVoidInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: voidInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}
