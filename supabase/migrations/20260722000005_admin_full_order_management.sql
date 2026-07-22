create or replace function public.admin_update_order(
  p_order_id bigint,
  p_status public.order_status default null,
  p_payment_status public.payment_status default null,
  p_payment_reference text default null,
  p_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_current_status public.order_status;
  v_order_number text;
  v_item record;
  v_stock_after integer;
  v_uid uuid;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  v_uid := auth.uid();

  select status, order_number
  into v_current_status, v_order_number
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  -- ENFORCE STATE TRANSITIONS
  if p_status is not null and p_status <> v_current_status then
    -- Cannot transition out of cancelled or delivered
    if v_current_status = 'cancelled' then
      raise exception 'Cancelled orders cannot be modified' using errcode = '22023';
    end if;
    if v_current_status = 'delivered' and p_status <> 'refunded' then
      -- Delivered is terminal for fulfillment, only payment tweaks might happen (though we handle payment separately).
      -- If they try to change order status to shipped/pending from delivered, reject.
      raise exception 'Delivered orders cannot be rolled back' using errcode = '22023';
    end if;

    -- Valid progressions
    if p_status = 'confirmed' and v_current_status <> 'pending' then
      raise exception 'Can only confirm a pending order' using errcode = '22023';
    elsif p_status = 'processing' and v_current_status <> 'confirmed' then
      raise exception 'Can only process a confirmed order' using errcode = '22023';
    elsif p_status = 'shipped' and v_current_status <> 'processing' then
      raise exception 'Can only ship a processing order' using errcode = '22023';
    elsif p_status = 'delivered' and v_current_status <> 'shipped' then
      raise exception 'Can only deliver a shipped order' using errcode = '22023';
    end if;
    
    -- If status is cancelled, restore inventory
    if p_status = 'cancelled' then
      for v_item in
        select variant_id, quantity
        from public.order_items
        where order_id = p_order_id and variant_id is not null
        order by variant_id
      loop
        update public.product_variants
        set stock_quantity = stock_quantity + v_item.quantity
        where id = v_item.variant_id
        returning stock_quantity into v_stock_after;

        if found then
          insert into public.inventory_movements (
            variant_id, order_id, movement_type, quantity_delta,
            stock_after, reason, actor_user_id
          ) values (
            v_item.variant_id,
            p_order_id,
            'cancellation',
            v_item.quantity,
            v_stock_after,
            format('Order %s cancelled', v_order_number),
            v_uid
          );
        end if;
      end loop;
    end if;

    -- Log status history
    insert into public.order_status_history (order_id, status, notes, created_by)
    values (p_order_id, p_status, p_notes, v_uid);
  end if;

  update public.orders
  set status = coalesce(p_status, status),
      payment_status = coalesce(p_payment_status, payment_status),
      payment_reference = coalesce(p_payment_reference, payment_reference),
      notes = coalesce(p_notes, notes),
      shipped_at = case when p_status = 'shipped' and shipped_at is null then now() else shipped_at end,
      delivered_at = case when p_status = 'delivered' and delivered_at is null then now() else delivered_at end
  where id = p_order_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, details)
  values (
    v_uid,
    'order.updated',
    'order',
    p_order_id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'previous_status', v_current_status,
      'status', p_status,
      'payment_status', p_payment_status,
      'payment_reference', p_payment_reference
    ))
  );
end;
$$;
