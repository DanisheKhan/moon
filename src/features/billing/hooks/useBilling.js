import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  placeSale,
  listInvoices,
  listAllInvoices,
  getInvoiceDetail,
  updateInvoice,
  voidInvoice,
  recordPayment,
  processReturn,
  listReturns,
} from '../api/billing.api';
import { inventoryKeys } from '@/features/inventory';
import { getPersistentCache } from '@/shared/lib/cachePersistence';

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
    placeholderData: () => getPersistentCache(`invoices_${storeId}`) || undefined,
    enabled: Boolean(storeId),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useAllInvoices(filters = {}) {
  const isDefault = !filters || Object.keys(filters).length === 0;
  return useQuery({
    queryKey: billingKeys.allInvoices(filters),
    queryFn: () => listAllInvoices(filters),
    placeholderData: () => (isDefault ? getPersistentCache('all_invoices') || undefined : undefined),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
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

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useProcessReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: processReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useInvoiceReturns(invoiceId) {
  return useQuery({
    queryKey: [...billingKeys.all, 'returns', invoiceId],
    queryFn: () => listReturns({ invoiceId }),
    enabled: Boolean(invoiceId),
  });
}
