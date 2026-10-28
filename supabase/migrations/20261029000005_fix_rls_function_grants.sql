-- Migration: 20261029000005_fix_rls_function_grants.sql
-- Description: Grant execute permissions on RLS helper functions and place_sale to anon, and allow anon access to product_units and invoices.

-- 1. Grant execute on helper functions to anon and authenticated
grant execute on function public.user_has_store_access(uuid, text[]) to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;
grant execute on function public.place_sale(uuid, text, text, text, jsonb, jsonb) to anon, authenticated;

-- 2. Allow anon to select in-stock product units
alter policy "Product units select policy" on public.product_units to anon, authenticated using (status = 'in_stock' or public.user_has_store_access(store_id));

-- 3. Allow viewing of invoices, order items, and payments for receipts
alter policy "Invoices select policy" on public.invoices to anon, authenticated using (true);
alter policy "Order items select policy" on public.order_items to anon, authenticated using (true);
alter policy "Payments select policy" on public.payments to anon, authenticated using (true);

