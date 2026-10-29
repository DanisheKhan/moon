-- Migration: 20261029000006_pending_partial_and_returns.sql
-- Description: Expand invoice status for pending & partial payments, update place_sale RPC, add sales_returns table and process_return RPC.

-- 1. Invoices status check constraint
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check 
  check (status in ('paid', 'partial', 'pending', 'void', 'refunded', 'returned', 'partially_returned'));

-- 2. Sales Returns Table
create table if not exists public.sales_returns (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  return_number text not null,
  customer_name text,
  refund_amount numeric(12, 2) not null default 0,
  refund_method text not null default 'cash',
  reason text,
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.sales_returns enable row level security;
drop policy if exists "Sales returns select policy" on public.sales_returns;
drop policy if exists "Sales returns insert policy" on public.sales_returns;
create policy "Sales returns select policy" on public.sales_returns for select to anon, authenticated using (true);
create policy "Sales returns insert policy" on public.sales_returns for insert to anon, authenticated with check (true);

-- 3. Replace place_sale to support pending & partial payments
create or replace function public.place_sale(
  p_store_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_gstin text,
  p_items jsonb,
  p_payments jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store record;
  v_prefix text;
  v_fy text := '2026-27';
  v_next_num integer;
  v_invoice_num text;
  v_invoice_id uuid;
  v_item record;
  v_prod record;
  v_unit record;
  v_subtotal numeric(12, 2) := 0;
  v_discount_total numeric(12, 2) := 0;
  v_cgst_total numeric(12, 2) := 0;
  v_sgst_total numeric(12, 2) := 0;
  v_grand_total numeric(12, 2) := 0;
  v_taxable numeric(12, 2);
  v_item_cgst numeric(12, 2);
  v_item_sgst numeric(12, 2);
  v_item_total numeric(12, 2);
  v_unit_id uuid;
  v_qty integer;
  v_price numeric(12, 2);
  v_disc numeric(12, 2);
  v_payment record;
  v_paid_total numeric(12, 2) := 0;
  v_status text := 'paid';
begin
  -- 1. Check Store Access
  if not public.user_has_store_access(p_store_id, array['owner', 'manager', 'cashier']) then
    raise exception 'Permission denied for this store' using errcode = '42501';
  end if;

  -- 2. Fetch Store Details
  select * into v_store from public.stores where id = p_store_id and is_active = true;
  if not found then
    raise exception 'Store not found or inactive';
  end if;
  v_prefix := v_store.invoice_prefix;

  -- 3. Lock & Increment Invoice Counter
  insert into public.invoice_counters (store_id, financial_year, current_number)
  values (p_store_id, v_fy, 1)
  on conflict (store_id, financial_year)
  do update set current_number = public.invoice_counters.current_number + 1
  returning current_number into v_next_num;

  v_invoice_num := v_prefix || '-' || '2026' || '-' || lpad(v_next_num::text, 4, '0');

  -- 4. Calculate Totals from Items
  for v_item in select * from jsonb_to_recordset(p_items) as (
    product_id uuid,
    unit_id uuid,
    quantity integer,
    unit_price numeric,
    discount numeric
  )
  loop
    select * into v_prod from public.products where id = v_item.product_id and store_id = p_store_id;
    if not found then
      raise exception 'Product % not found in store', v_item.product_id;
    end if;

    v_qty := coalesce(v_item.quantity, 1);
    v_price := coalesce(v_item.unit_price, v_prod.selling_price);
    v_disc := coalesce(v_item.discount, 0);

    -- Margin Guard check
    if (v_price - v_disc) < v_prod.min_selling_price then
      raise exception 'Price for % is below minimum permitted selling price of %', v_prod.name, v_prod.min_selling_price;
    end if;

    v_taxable := (v_price - v_disc) * v_qty;
    v_item_cgst := round((v_taxable * (v_prod.gst_rate / 2.0) / 100.0), 2);
    v_item_sgst := round((v_taxable * (v_prod.gst_rate / 2.0) / 100.0), 2);
    v_item_total := v_taxable + v_item_cgst + v_item_sgst;

    v_subtotal := v_subtotal + (v_price * v_qty);
    v_discount_total := v_discount_total + (v_disc * v_qty);
    v_cgst_total := v_cgst_total + v_item_cgst;
    v_sgst_total := v_sgst_total + v_item_sgst;
    v_grand_total := v_grand_total + v_item_total;
  end loop;

  -- 4b. Calculate payment status
  if p_payments is not null and jsonb_array_length(p_payments) > 0 then
    select coalesce(sum((p->>'amount')::numeric), 0) into v_paid_total
    from jsonb_array_elements(p_payments) p;
  else
    v_paid_total := 0;
  end if;

  if v_paid_total <= 0 then
    v_status := 'pending';
  elsif v_paid_total < v_grand_total then
    v_status := 'partial';
  else
    v_status := 'paid';
  end if;

  -- 5. Insert Invoice
  insert into public.invoices (
    store_id,
    invoice_number,
    financial_year,
    customer_name,
    customer_phone,
    customer_gstin,
    subtotal,
    discount_amount,
    cgst_amount,
    sgst_amount,
    igst_amount,
    grand_total,
    status,
    cashier_id
  ) values (
    p_store_id,
    v_invoice_num,
    v_fy,
    coalesce(nullif(trim(p_customer_name), ''), 'Walk-in Customer'),
    p_customer_phone,
    p_customer_gstin,
    v_subtotal,
    v_discount_total,
    v_cgst_total,
    v_sgst_total,
    0,
    v_grand_total,
    v_status,
    (select auth.uid())
  ) returning id into v_invoice_id;

  -- 6. Insert Order Items & Process Stock Locking
  for v_item in select * from jsonb_to_recordset(p_items) as (
    product_id uuid,
    unit_id uuid,
    quantity integer,
    unit_price numeric,
    discount numeric
  )
  loop
    select * into v_prod from public.products where id = v_item.product_id;
    v_qty := coalesce(v_item.quantity, 1);
    v_price := coalesce(v_item.unit_price, v_prod.selling_price);
    v_disc := coalesce(v_item.discount, 0);

    v_taxable := (v_price - v_disc) * v_qty;
    v_item_cgst := round((v_taxable * (v_prod.gst_rate / 2.0) / 100.0), 2);
    v_item_sgst := round((v_taxable * (v_prod.gst_rate / 2.0) / 100.0), 2);
    v_item_total := v_taxable + v_item_cgst + v_item_sgst;

    -- If serialized unit is provided, lock & update it
    if v_item.unit_id is not null then
      select * into v_unit from public.product_units
      where id = v_item.unit_id and store_id = p_store_id and status = 'in_stock'
      for update;

      if not found then
        raise exception 'Serialized unit % is not available in stock', v_item.unit_id;
      end if;

      update public.product_units
      set status = 'sold', updated_at = now()
      where id = v_item.unit_id;
    end if;

    -- Insert Order Item
    insert into public.order_items (
      invoice_id,
      product_id,
      unit_id,
      item_name,
      serial_number,
      hsn_code,
      quantity,
      unit_price,
      discount,
      taxable_value,
      gst_rate,
      cgst_amount,
      sgst_amount,
      total_amount
    ) values (
      v_invoice_id,
      v_item.product_id,
      v_item.unit_id,
      v_prod.name,
      v_unit.serial_number,
      v_prod.hsn_code,
      v_qty,
      v_price,
      v_disc,
      v_taxable,
      v_prod.gst_rate,
      v_item_cgst,
      v_item_sgst,
      v_item_total
    );

    -- Insert Stock Movement Ledger
    insert into public.stock_movements (
      store_id,
      product_id,
      unit_id,
      movement_type,
      quantity,
      cost_price,
      reference_id,
      created_by
    ) values (
      p_store_id,
      v_item.product_id,
      v_item.unit_id,
      'sale',
      -v_qty,
      v_prod.cost_price,
      v_invoice_num,
      (select auth.uid())
    );

    -- Decrement Aggregate Inventory
    update public.inventory
    set quantity_on_hand = greatest(0, quantity_on_hand - v_qty),
        updated_at = now()
    where store_id = p_store_id and product_id = v_item.product_id;
  end loop;

  -- 7. Insert Payments
  if p_payments is not null and jsonb_array_length(p_payments) > 0 then
    for v_payment in select * from jsonb_to_recordset(p_payments) as (
      payment_method text,
      amount numeric,
      reference_number text
    )
    loop
      if coalesce(v_payment.amount, 0) > 0 then
        insert into public.payments (
          invoice_id,
          payment_method,
          amount,
          reference_number
        ) values (
          v_invoice_id,
          v_payment.payment_method,
          v_payment.amount,
          v_payment.reference_number
        );
      end if;
    end loop;
  end if;

  -- 8. Write Audit Log
  insert into public.audit_log (
    store_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    p_store_id,
    (select auth.uid()),
    'create',
    'invoice',
    v_invoice_id::text,
    jsonb_build_object(
      'invoice_number', v_invoice_num,
      'grand_total', v_grand_total,
      'paid_amount', v_paid_total,
      'status', v_status
    )
  );

  return jsonb_build_object(
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_num,
    'grand_total', v_grand_total,
    'paid_total', v_paid_total,
    'status', v_status
  );
end;
$$;

-- 4. Process Return atomic function
create or replace function public.process_return(
  p_invoice_id uuid,
  p_items jsonb,
  p_refund_amount numeric,
  p_refund_method text,
  p_reason text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv record;
  v_store_id uuid;
  v_item record;
  v_ret_num text;
  v_ret_id uuid;
  v_total_items integer := 0;
  v_returned_count integer := 0;
begin
  select * into v_inv from public.invoices where id = p_invoice_id;
  if not found then
    raise exception 'Invoice not found';
  end if;
  v_store_id := v_inv.store_id;

  v_ret_num := 'RET-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4);

  -- 1. Insert Sales Return record
  insert into public.sales_returns (
    store_id,
    invoice_id,
    return_number,
    customer_name,
    refund_amount,
    refund_method,
    reason,
    notes,
    items
  ) values (
    v_store_id,
    p_invoice_id,
    v_ret_num,
    v_inv.customer_name,
    p_refund_amount,
    p_refund_method,
    p_reason,
    p_notes,
    p_items
  ) returning id into v_ret_id;

  -- 2. Process Restock for items
  for v_item in select * from jsonb_to_recordset(p_items) as (
    product_id uuid,
    unit_id uuid,
    quantity integer,
    restock boolean,
    condition text
  )
  loop
    if v_item.unit_id is not null then
      if coalesce(v_item.restock, true) = true then
        update public.product_units
        set status = 'in_stock', updated_at = now()
        where id = v_item.unit_id;

        update public.inventory
        set quantity_on_hand = quantity_on_hand + coalesce(v_item.quantity, 1),
            updated_at = now()
        where store_id = v_store_id and product_id = v_item.product_id;
      else
        update public.product_units
        set status = 'defective', updated_at = now()
        where id = v_item.unit_id;
      end if;

      insert into public.stock_movements (
        store_id,
        product_id,
        unit_id,
        movement_type,
        quantity,
        reference_id,
        created_by
      ) values (
        v_store_id,
        v_item.product_id,
        v_item.unit_id,
        'return',
        coalesce(v_item.quantity, 1),
        v_ret_num,
        (select auth.uid())
      );
    else
      if coalesce(v_item.restock, true) = true then
        update public.inventory
        set quantity_on_hand = quantity_on_hand + coalesce(v_item.quantity, 1),
            updated_at = now()
        where store_id = v_store_id and product_id = v_item.product_id;
      end if;

      insert into public.stock_movements (
        store_id,
        product_id,
        unit_id,
        movement_type,
        quantity,
        reference_id,
        created_by
      ) values (
        v_store_id,
        v_item.product_id,
        null,
        'return',
        coalesce(v_item.quantity, 1),
        v_ret_num,
        (select auth.uid())
      );
    end if;
  end loop;

  -- 3. Check items count to update invoice status
  select count(*) into v_total_items from public.order_items where invoice_id = p_invoice_id;
  select count(*) into v_returned_count from jsonb_array_elements(p_items);

  if v_returned_count >= v_total_items then
    update public.invoices set status = 'returned' where id = p_invoice_id;
  else
    update public.invoices set status = 'partially_returned' where id = p_invoice_id;
  end if;

  -- 4. Audit Log
  insert into public.audit_log (
    store_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    v_store_id,
    (select auth.uid()),
    'return',
    'invoice',
    p_invoice_id::text,
    jsonb_build_object(
      'return_number', v_ret_num,
      'refund_amount', p_refund_amount,
      'reason', p_reason
    )
  );

  return jsonb_build_object(
    'return_id', v_ret_id,
    'return_number', v_ret_num,
    'invoice_id', p_invoice_id,
    'refund_amount', p_refund_amount
  );
end;
$$;

grant execute on function public.process_return(uuid, jsonb, numeric, text, text, text) to anon, authenticated;
grant execute on function public.place_sale(uuid, text, text, text, jsonb, jsonb) to anon, authenticated;

