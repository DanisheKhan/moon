-- Migration: 20261108000001_dealer_khata_management.sql
-- Description: Dealer Directory, GST vs Kaccha Bills, Partial Payments, Debit Notes, and Realtime Tracking.

-- 1. DEALERS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  trade_name TEXT,
  brand_name TEXT,
  contact_person TEXT,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT DEFAULT 'Local',
  state_code TEXT DEFAULT '09',
  gstin TEXT,
  pan_number TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  dealer_type TEXT DEFAULT 'brand_direct' CHECK (dealer_type IN ('brand_direct', 'distributor', 'wholesaler', 'local_vendor')),
  billing_mode TEXT DEFAULT 'both' CHECK (billing_mode IN ('gst', 'kaccha', 'both')),
  default_credit_days INTEGER DEFAULT 30,
  opening_balance NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEALER BILLS (PURCHASE INVOICES & KACCHA ESTIMATES)
CREATE TABLE IF NOT EXISTS public.dealer_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  bill_type TEXT NOT NULL DEFAULT 'gst' CHECK (bill_type IN ('gst', 'kaccha')),
  bill_number TEXT NOT NULL,
  bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credit_days INTEGER NOT NULL DEFAULT 30,
  due_date DATE,
  taxable_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  round_off NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
  cleared_at TIMESTAMPTZ,
  payment_days_taken INTEGER,
  attachment_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_dealer_bill_number UNIQUE (dealer_id, bill_number, bill_type)
);

-- 3. DEALER PAYMENTS TABLE (PARTIAL / MILESTONE PAYMENTS)
CREATE TABLE IF NOT EXISTS public.dealer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.dealer_bills(id) ON DELETE SET NULL,
  payment_number TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_mode TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_mode IN ('bank_transfer', 'upi', 'cheque', 'cash')),
  payment_channel TEXT NOT NULL DEFAULT 'official_bank' CHECK (payment_channel IN ('official_bank', 'secondary_cash')),
  transaction_ref TEXT,
  cheque_date DATE,
  receipt_attachment_url TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEALER DEBIT NOTES (PURCHASE RETURNS & DISCOUNTS)
CREATE TABLE IF NOT EXISTS public.dealer_debit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.dealer_bills(id) ON DELETE SET NULL,
  note_number TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL DEFAULT 'purchase_return' CHECK (reason IN ('purchase_return', 'damaged_goods', 'scheme_discount', 'rate_difference')),
  description TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_dealer_bills_dealer_id ON public.dealer_bills(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_bills_store_id ON public.dealer_bills(store_id);
CREATE INDEX IF NOT EXISTS idx_dealer_bills_bill_type ON public.dealer_bills(bill_type);
CREATE INDEX IF NOT EXISTS idx_dealer_bills_status ON public.dealer_bills(status);
CREATE INDEX IF NOT EXISTS idx_dealer_bills_due_date ON public.dealer_bills(due_date);

CREATE INDEX IF NOT EXISTS idx_dealer_payments_dealer_id ON public.dealer_payments(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_payments_bill_id ON public.dealer_payments(bill_id);

-- AUTOMATIC DUE DATE & BALANCE RE-CALCULATION TRIGGER
CREATE OR REPLACE FUNCTION public.fn_dealer_bills_before_save()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.due_date IS NULL OR NEW.credit_days IS DISTINCT FROM OLD.credit_days OR NEW.bill_date IS DISTINCT FROM OLD.bill_date THEN
        NEW.due_date := NEW.bill_date + (NEW.credit_days || ' days')::INTERVAL;
    END IF;

    NEW.total_tax_amount := COALESCE(NEW.cgst_amount, 0) + COALESCE(NEW.sgst_amount, 0) + COALESCE(NEW.igst_amount, 0);
    NEW.balance_amount := COALESCE(NEW.total_amount, 0) - COALESCE(NEW.paid_amount, 0);

    IF NEW.paid_amount >= NEW.total_amount AND NEW.total_amount > 0 THEN
        NEW.status := 'paid';
        IF NEW.cleared_at IS NULL THEN
            NEW.cleared_at := NOW();
        END IF;
        NEW.payment_days_taken := GREATEST(0, (CURRENT_DATE - NEW.bill_date));
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status := 'partially_paid';
        NEW.cleared_at := NULL;
        NEW.payment_days_taken := NULL;
    ELSE
        NEW.status := 'unpaid';
        NEW.cleared_at := NULL;
        NEW.payment_days_taken := NULL;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dealer_bills_before_save ON public.dealer_bills;
CREATE TRIGGER trg_dealer_bills_before_save
BEFORE INSERT OR UPDATE ON public.dealer_bills
FOR EACH ROW EXECUTE FUNCTION public.fn_dealer_bills_before_save();

-- AUTOMATIC PAYMENT & DEBIT NOTE SYNC TRIGGER
CREATE OR REPLACE FUNCTION public.fn_sync_dealer_bill_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    target_bill_id UUID;
    total_payments NUMERIC := 0;
    total_debits NUMERIC := 0;
    combined_paid NUMERIC := 0;
BEGIN
    target_bill_id := COALESCE(NEW.bill_id, OLD.bill_id);
    
    IF target_bill_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT COALESCE(SUM(amount), 0)
    INTO total_payments
    FROM public.dealer_payments
    WHERE bill_id = target_bill_id;

    SELECT COALESCE(SUM(amount), 0)
    INTO total_debits
    FROM public.dealer_debit_notes
    WHERE bill_id = target_bill_id;

    combined_paid := total_payments + total_debits;

    UPDATE public.dealer_bills
    SET paid_amount = combined_paid
    WHERE id = target_bill_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_dealer_payments ON public.dealer_payments;
CREATE TRIGGER trg_sync_dealer_payments
AFTER INSERT OR UPDATE OR DELETE ON public.dealer_payments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_dealer_bill_payment_status();

DROP TRIGGER IF EXISTS trg_sync_dealer_debit_notes ON public.dealer_debit_notes;
CREATE TRIGGER trg_sync_dealer_debit_notes
AFTER INSERT OR UPDATE OR DELETE ON public.dealer_debit_notes
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_dealer_bill_payment_status();

-- RLS POLICIES
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_debit_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Authenticated policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealers' AND policyname = 'dealers_authenticated_policy') THEN
    CREATE POLICY dealers_authenticated_policy ON public.dealers FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_bills' AND policyname = 'dealer_bills_authenticated_policy') THEN
    CREATE POLICY dealer_bills_authenticated_policy ON public.dealer_bills FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_payments' AND policyname = 'dealer_payments_authenticated_policy') THEN
    CREATE POLICY dealer_payments_authenticated_policy ON public.dealer_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_debit_notes' AND policyname = 'dealer_debit_notes_authenticated_policy') THEN
    CREATE POLICY dealer_debit_notes_authenticated_policy ON public.dealer_debit_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Anon policies (for dev / demo session write access)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealers' AND policyname = 'dealers_anon_write_policy') THEN
    CREATE POLICY dealers_anon_write_policy ON public.dealers FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_bills' AND policyname = 'dealer_bills_anon_write_policy') THEN
    CREATE POLICY dealer_bills_anon_write_policy ON public.dealer_bills FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_payments' AND policyname = 'dealer_payments_anon_write_policy') THEN
    CREATE POLICY dealer_payments_anon_write_policy ON public.dealer_payments FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dealer_debit_notes' AND policyname = 'dealer_debit_notes_anon_write_policy') THEN
    CREATE POLICY dealer_debit_notes_anon_write_policy ON public.dealer_debit_notes FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
