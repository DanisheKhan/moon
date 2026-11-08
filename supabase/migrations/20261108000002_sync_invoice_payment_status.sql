-- Migration: Automatically synchronize invoices.status with payments table
-- Ensures invoices with complete payment records are never marked as pending or partial

CREATE OR REPLACE FUNCTION public.fn_sync_invoice_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inv_id UUID;
  v_grand_total NUMERIC;
  v_current_status TEXT;
  v_total_paid NUMERIC;
  v_new_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_inv_id := OLD.invoice_id;
  ELSE
    v_inv_id := NEW.invoice_id;
  END IF;

  SELECT grand_total, status INTO v_grand_total, v_current_status
  FROM public.invoices
  WHERE id = v_inv_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Do not override returned or void invoices
  IF v_current_status IN ('returned', 'partially_returned', 'void') THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payments
  WHERE invoice_id = v_inv_id;

  IF v_total_paid >= (v_grand_total - 0.5) THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;

  IF v_new_status IS DISTINCT FROM v_current_status THEN
    UPDATE public.invoices
    SET status = v_new_status
    WHERE id = v_inv_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_invoice_payment_status
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_invoice_payment_status();
