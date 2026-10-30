-- Migration: 20261030000001_fix_place_sale_unassigned_v_unit.sql
-- Description: Fix "record 'v_unit' is not assigned yet" in place_sale for non-serialized items (furniture),
-- round all financial monetary figures to whole integer rupees,
-- and add RLS update/insert policies for invoices, order items, and payments.

-- 1. Replace place_sale function to fix unassigned v_unit and round money
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
  v_serial_number text;
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
  if not public.user_has_store_access(p_store_id, array['owner', 'manager', 'cashier']) then
    raise exception 'Permission denied for this store' using errcode = '42501';
  end if;

  select * into v_store from public.stores where id = p_store_id and is_active = true;
  if not found then
    raise exception 'Store not found or inactive';
  end if;
  v_prefix := v_store.invoice_prefix;

  insert into public.invoice_counters (store_id, financial_year, current_number)
  values (p_store_id, v_fy, 1)
  on conflict (store_id, financial_year)
  do update set current_number = public.invoice_counters.current_number + 1
  returning current_number into v_next_num;

  v_invoice_num := v_prefix || '-' || '2026' || '-' || lpad(v_next_num::text, 4, '0');

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

    if (v_price - v_disc) < v_prod.min_selling_price then
      raise exception 'Price for % is below minimum permitted selling price of %', v_prod.name, v_prod.min_selling_price;
    end if;

    v_taxable := round((v_price - v_disc) * v_qty);
    v_item_cgst := round((v_taxable * (v_prod.gst_rate / 2.0) / 100.0));
    v_item_sgst := round((v_taxable * (v_prod.gst_rate / 2.0) / 100.0));
    v_item_total := v_taxable + v_item_cgst + v_item_sgst;

    v_subtotal := v_subtotal + round(v_price * v_qty);
    v_discount_total := v_discount_total + round(v_disc * v_qty);
    v_cgst_total := v_cgst_total + v_item_cgst;
    v_sgst_total := v_sgst_total + v_item_sgst;
    v_grand_total := v_grand_total + v_item_total;
  end loop;

  v_grand_total := round(v_grand_total);

  if p_payments is not null and jsonb_array_length(p_payments) > 0 then
    select coalesce(sum(round((p->>'amount')::numeric)), 0) into v_paid_total
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

    v_taxable := round((v_price - v_disc) * v_qty);
    v_item_cgst := round((v_taxable * (v_prod.gst_rate / 2.0) / 100.0));
    v_item_sgst := round((v_taxable * (v_prod.gst_rate / 2.0) / 100.0));
    v_item_total := v_taxable + v_item_cgst + v_item_sgst;

    v_serial_number := null;
    if v_item.unit_id is not null then
      select * into v_unit from public.product_units
      where id = v_item.unit_id and store_id = p_store_id and status = 'in_stock'
      for update;

      if not found then
        raise exception 'Serialized unit % is not available in stock', v_item.unit_id;
      end if;

      v_serial_number := v_unit.serial_number;

      update public.product_units
      set status = 'sold', updated_at = now()
      where id = v_item.unit_id;
    end if;

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
      v_serial_number,
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

    update public.inventory
    set quantity_on_hand = greatest(0, quantity_on_hand - v_qty),
        updated_at = now()
    where store_id = p_store_id and product_id = v_item.product_id;
  end loop;

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
          round(v_payment.amount),
          v_payment.reference_number
        );
      end if;
    end loop;
  end if;

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

grant execute on function public.place_sale(uuid, text, text, text, jsonb, jsonb) to anon, authenticated;

-- 2. Add RLS update & insert policies on invoices, order_items, and payments so editing, voiding, and collecting payments work seamlessly
create policy "Invoices update policy"
  on public.invoices for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Payments update policy"
  on public.payments for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Payments insert policy"
  on public.payments for insert
  to anon, authenticated
  with check (true);

create policy "Order items update policy"
  on public.order_items for update
  to anon, authenticated
  using (true)
  with check (true);
