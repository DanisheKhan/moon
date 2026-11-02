import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProductsByStore,
  listProductUnits,
  createProductUnit,
  createProduct,
  adjustInventoryStock,
  addSerializedUnit,
  removeSerializedUnit,
  updateProductPricing,
  getCachedStoreProducts,
  listAllProducts,
  updateProduct,
  deleteProduct,
  listCategoriesByStore,
  createCategory,
} from '../api/inventory.api';
import { getPersistentCache, evictPersistentCache } from '@/shared/lib/cachePersistence';

export const inventoryKeys = {
  all: ['inventory'],
  products: (storeId, filters) => [...inventoryKeys.all, 'products', storeId, filters],
  units: (storeId, productId, status) => [...inventoryKeys.all, 'units', storeId, productId, status],
  categories: (storeId) => [...inventoryKeys.all, 'categories', storeId],
};

export function useProducts(storeId, filters = {}) {
  const hasFilters = Boolean(filters?.search || filters?.categoryId);
  return useQuery({
    queryKey: inventoryKeys.products(storeId, filters),
    queryFn: () => listProductsByStore({ storeId, ...filters }),
    placeholderData: () => (!hasFilters ? getCachedStoreProducts(storeId) || undefined : undefined),
    enabled: Boolean(storeId),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
}

export function useProductUnits(storeId, productId = null, status = null, options = {}) {
  const isEnabled = options.enabled !== undefined ? Boolean(storeId && options.enabled) : Boolean(storeId);
  return useQuery({
    queryKey: inventoryKeys.units(storeId, productId, status),
    queryFn: () => listProductUnits({ storeId, productId, status }),
    enabled: isEnabled,
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useCreateProductUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductUnit,
    onSuccess: () => {
      evictPersistentCache('inv_prods');
      evictPersistentCache('all_products');
      evictPersistentCache('dashboard');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adjustInventoryStock,
    onSuccess: () => {
      evictPersistentCache('inv_prods');
      evictPersistentCache('all_products');
      evictPersistentCache('dashboard');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useAddSerializedUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addSerializedUnit,
    onSuccess: () => {
      evictPersistentCache('inv_prods');
      evictPersistentCache('all_products');
      evictPersistentCache('dashboard');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useRemoveSerializedUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeSerializedUnit,
    onSuccess: () => {
      evictPersistentCache('inv_prods');
      evictPersistentCache('all_products');
      evictPersistentCache('dashboard');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdatePricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductPricing,
    onSuccess: () => {
      evictPersistentCache('inv_prods');
      evictPersistentCache('all_products');
      evictPersistentCache('dashboard');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      evictPersistentCache('inv_prods');
      evictPersistentCache('all_products');
      evictPersistentCache('dashboard');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useAllProducts(filters = {}) {
  const isDefault = !filters || Object.keys(filters).length === 0;
  return useQuery({
    queryKey: [...inventoryKeys.all, 'all-products', filters],
    queryFn: () => listAllProducts(filters),
    placeholderData: () => (isDefault ? getPersistentCache('all_products') || undefined : undefined),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, updates }) => updateProduct(productId, updates),
    onSuccess: () => {
      evictPersistentCache('inv_prods');
      evictPersistentCache('all_products');
      evictPersistentCache('dashboard');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      evictPersistentCache('inv_prods');
      evictPersistentCache('all_products');
      evictPersistentCache('dashboard');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useCategories(storeId) {
  return useQuery({
    queryKey: inventoryKeys.categories(storeId),
    queryFn: () => listCategoriesByStore(storeId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
