begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(5);

insert into auth.users (id, email, raw_user_meta_data)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'admin-test@example.com', '{"full_name":"Admin Test"}'::jsonb);
insert into public.user_roles (user_id, role)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'admin');

insert into public.products (id, name, slug, status)
values (999999, 'Concurrency Test Hat', 'concurrency-test-hat', 'available');

-- 1. Test negative stock constraint
do $$
declare
  v_expected_error boolean := false;
  v_variant_id bigint;
begin
  select id into v_variant_id from public.product_variants limit 1;
  begin
    update public.product_variants set stock_quantity = -1 where id = v_variant_id;
  exception when others then
    if sqlerrm like '%variants_stock_nonnegative%' then v_expected_error := true; else raise; end if;
  end;
  if not v_expected_error then raise exception 'Negative stock constraint was violated'; end if;
end;
$$;
select extensions.pass('database constraint strictly prevents negative stock');

-- 2. Test admin_adjust_inventory bounds and logging
do $$
declare
  v_variant_id bigint;
  v_stock_before integer;
  v_stock_after integer;
  v_movements integer;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}', true);

  select id, stock_quantity into v_variant_id, v_stock_before from public.product_variants limit 1;
  
  -- Attempt negative
  begin
    perform public.admin_adjust_inventory(v_variant_id, -5, 'Testing negative');
    raise exception 'Negative admin adjustment allowed';
  exception when others then
    if sqlerrm not like 'Stock cannot be negative' then raise; end if;
  end;

  -- Attempt valid restock
  perform public.admin_adjust_inventory(v_variant_id, v_stock_before + 10, 'Testing restock');
  select stock_quantity into v_stock_after from public.product_variants where id = v_variant_id;
  if v_stock_after <> v_stock_before + 10 then
    raise exception 'Stock was not properly adjusted';
  end if;

  select count(*) into v_movements from public.inventory_movements where variant_id = v_variant_id and reason = 'Testing restock';
  if v_movements = 0 then
    raise exception 'Inventory movement was not logged for admin adjustment';
  end if;
end;
$$;
select extensions.pass('admin_adjust_inventory respects bounds and correctly logs movements');

-- 3. Test order cancellation idempotency (double restocking prevention)
set local role anon;
select set_config('request.jwt.claims', '', true);
do $$
declare
  v_order_id bigint;
  v_variant_id bigint;
  v_stock_before integer;
  v_stock_after_sale integer;
  v_stock_after_cancel integer;
  v_order jsonb;
begin
  select id, stock_quantity into v_variant_id, v_stock_before from public.product_variants limit 1;

  -- Create order
  v_order := public.create_order(
    jsonb_build_array(jsonb_build_object('variant_id', v_variant_id, 'quantity', 1)),
    '{"first_name":"Cancel","last_name":"Test","email":"cancel@example.com"}'::jsonb,
    '{"name":"Cancel Test","email":"cancel@example.com","phone":"09171234567","address":"Test Street","city":"Manila"}'::jsonb,
    'cod', null, '55555555-5555-4555-8555-555555555555'
  );
  
  v_order_id := (v_order ->> 'order_id')::bigint;

  select stock_quantity into v_stock_after_sale from public.product_variants where id = v_variant_id;
  if v_stock_after_sale <> v_stock_before - 1 then
    raise exception 'Stock was not deducted on sale';
  end if;

  -- Switch to admin to cancel the order
  set local role authenticated;
  perform set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}', true);
  
  perform public.admin_update_order(v_order_id, 'cancelled');
  
  select stock_quantity into v_stock_after_cancel from public.product_variants where id = v_variant_id;
  if v_stock_after_cancel <> v_stock_before then
    raise exception 'Stock was not restocked on cancellation';
  end if;

  -- Cancel again (idempotency check)
  perform public.admin_update_order(v_order_id, 'cancelled');
  select stock_quantity into v_stock_after_cancel from public.product_variants where id = v_variant_id;
  if v_stock_after_cancel <> v_stock_before then
    raise exception 'Double restocking occurred on duplicate cancellation';
  end if;

  -- Try to reopen (should fail)
  begin
    perform public.admin_update_order(v_order_id, 'processing');
    raise exception 'Cancelled order was reopened';
  exception when others then
    if sqlerrm not like '%Cancelled orders cannot be modified%' then raise; end if;
  end;
end;
$$;
reset role;
select extensions.pass('order cancellation correctly restocks and respects idempotency');

select * from extensions.finish();

rollback;
