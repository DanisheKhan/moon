-- Migration: 20261029000007_fix_inventory_rls_policies.sql
-- Description: Expand write policies on inventory, product_units, products, categories, and brands to {anon, authenticated} to allow store operations console writes.

ALTER POLICY "Inventory write policy" ON public.inventory TO anon, authenticated;
ALTER POLICY "Product units write policy" ON public.product_units TO anon, authenticated;
ALTER POLICY "Products write policy" ON public.products TO anon, authenticated;
ALTER POLICY "Categories write policy" ON public.categories TO anon, authenticated;
ALTER POLICY "Brands write policy" ON public.brands TO anon, authenticated;

