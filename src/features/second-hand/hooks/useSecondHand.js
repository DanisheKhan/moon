import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBuybackIntake, listBuybackIntakes } from '../api/secondHand.api';

export const secondHandKeys = {
  all: ['second-hand'],
  intakes: (storeId) => [...secondHandKeys.all, 'intakes', storeId],
};

export function useBuybackIntakes(storeId) {
  return useQuery({
    queryKey: secondHandKeys.intakes(storeId),
    queryFn: () => listBuybackIntakes(storeId),
    enabled: Boolean(storeId),
  });
}

export function useCreateBuybackIntake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBuybackIntake,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secondHandKeys.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
