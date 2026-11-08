import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listDealers,
  getDealerById,
  createDealer,
  updateDealer,
  listDealerBills,
  getDealerBillDetail,
  createDealerBill,
  recordDealerPayment,
  createDealerDebitNote,
  listDealerPayments,
  getDealerStatement,
  getDealerAnalyticsSummary,
} from '../api/dealers.api';

export const dealerKeys = {
  all: ['dealers'],
  lists: () => [...dealerKeys.all, 'list'],
  list: (storeId) => [...dealerKeys.lists(), storeId || 'all'],
  details: () => [...dealerKeys.all, 'detail'],
  detail: (dealerId) => [...dealerKeys.details(), dealerId],
  bills: (filters) => [...dealerKeys.all, 'bills', filters],
  billDetail: (billId) => [...dealerKeys.all, 'bill-detail', billId],
  payments: (filters) => [...dealerKeys.all, 'payments', filters],
  statement: (dealerId, billType) => [...dealerKeys.all, 'statement', dealerId, billType || 'all'],
  analytics: (storeId) => [...dealerKeys.all, 'analytics', storeId || 'all'],
};

export function useDealers({ storeId, includeInactive = false } = {}) {
  return useQuery({
    queryKey: [...dealerKeys.list(storeId), includeInactive],
    queryFn: () => listDealers({ storeId, includeInactive }),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export function useDealer(dealerId) {
  return useQuery({
    queryKey: dealerKeys.detail(dealerId),
    queryFn: () => getDealerById(dealerId),
    enabled: Boolean(dealerId),
  });
}

export function useDealerBills(filters = {}) {
  return useQuery({
    queryKey: dealerKeys.bills(filters),
    queryFn: () => listDealerBills(filters),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export function useDealerBillDetail(billId) {
  return useQuery({
    queryKey: dealerKeys.billDetail(billId),
    queryFn: () => getDealerBillDetail(billId),
    enabled: Boolean(billId),
  });
}

export function useDealerPayments(filters = {}) {
  return useQuery({
    queryKey: dealerKeys.payments(filters),
    queryFn: () => listDealerPayments(filters),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export function useDealerStatement(dealerId, { billType = 'all' } = {}) {
  return useQuery({
    queryKey: dealerKeys.statement(dealerId, billType),
    queryFn: () => getDealerStatement(dealerId, { billType }),
    enabled: Boolean(dealerId),
  });
}

export function useDealerAnalytics(storeId) {
  return useQuery({
    queryKey: dealerKeys.analytics(storeId),
    queryFn: () => getDealerAnalyticsSummary({ storeId }),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export function useCreateDealer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDealer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.all });
    },
  });
}

export function useUpdateDealer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateDealer(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.all });
      queryClient.invalidateQueries({ queryKey: dealerKeys.detail(variables.id) });
    },
  });
}

export function useCreateDealerBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDealerBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.all });
    },
  });
}

export function useRecordDealerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordDealerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.all });
    },
  });
}

export function useCreateDealerDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDealerDebitNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.all });
    },
  });
}
