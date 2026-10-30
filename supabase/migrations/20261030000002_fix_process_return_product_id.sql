-- Fix process_return to auto-resolve product_id and unit_id from order_items if omitted from payload
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
    order_item_id uuid,
    product_id uuid,
    unit_id uuid,
    quantity integer,
    restock boolean,
    condition text
  )
  loop
    -- Auto-resolve product_id and unit_id from order_items if omitted
    if v_item.product_id is null and v_item.order_item_id is not null then
      select oi.product_id, coalesce(v_item.unit_id, oi.unit_id)
      into v_item.product_id, v_item.unit_id
      from public.order_items oi
      where oi.id = v_item.order_item_id;
    end if;

    if v_item.product_id is null then
      raise exception 'Product ID could not be identified for returned order item %', v_item.order_item_id;
    end if;

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

