-- Migration: 20261102000001_enable_realtime_publication.sql
-- Description: Enable Realtime replication for all operational tables and add missing indexes

ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.invoices,
  public.payments,
  public.order_items,
  public.inventory,
  public.products,
  public.product_units,
  public.categories,
  public.staff_profiles,
  public.staff_leaves,
  public.staff_salaries,
  public.stores;

-- Performance: covering indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_sales_returns_invoice_id ON public.sales_returns(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_store_id ON public.sales_returns(store_id);
