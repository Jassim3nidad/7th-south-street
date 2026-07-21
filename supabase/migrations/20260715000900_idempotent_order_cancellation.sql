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
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select status, order_number
  into v_current_status, v_order_number
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  if v_current_status = 'cancelled'
     and p_status is not null
     and p_status <> 'cancelled' then
    raise exception 'Cancelled orders cannot be reopened' using errcode = '22023';
  end if;

  if p_status = 'cancelled' and v_current_status <> 'cancelled' then
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
          auth.uid()
        );
      end if;
    end loop;
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
    auth.uid(),
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

revoke all on function public.admin_update_order(bigint, public.order_status, public.payment_status, text, text) from public, anon;
grant execute on function public.admin_update_order(bigint, public.order_status, public.payment_status, text, text) to authenticated, service_role;
