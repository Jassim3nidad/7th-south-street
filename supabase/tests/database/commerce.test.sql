begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(8);

insert into public.products (id, name, slug, status)
values (999999, 'Hidden test product', 'hidden-test-product', 'archived');

set local role anon;

do $$
begin
  if (select count(*) from public.products) <> 10 then
    raise exception 'Anonymous catalog count did not match the public seed';
  end if;
  if (select count(*) from public.products where id = 999999) <> 0 then
    raise exception 'Archived product leaked through RLS';
  end if;
end;
$$;
reset role;
select extensions.pass('anonymous users only see public products');

set local role anon;
do $$
declare
  v_before integer;
  v_after integer;
  v_first jsonb;
  v_second jsonb;
begin
  select stock_quantity into v_before from public.product_variants where id = 1;
  v_first := public.create_order(
    '[{"variant_id":1,"quantity":1,"unit_price":0,"order_total":0}]'::jsonb,
    '{"first_name":"Test","last_name":"Buyer","email":"test@example.com"}'::jsonb,
    '{"name":"Test Buyer","email":"test@example.com","phone":"09171234567","address":"Test Street","city":"Manila"}'::jsonb,
    'cod', null, '11111111-1111-4111-8111-111111111111'
  );
  v_second := public.create_order(
    '[{"variant_id":1,"quantity":1}]'::jsonb,
    '{"first_name":"Test","last_name":"Buyer","email":"test@example.com"}'::jsonb,
    '{"name":"Test Buyer","email":"test@example.com","phone":"09171234567","address":"Test Street","city":"Manila"}'::jsonb,
    'cod', null, '11111111-1111-4111-8111-111111111111'
  );
  select stock_quantity into v_after from public.product_variants where id = 1;

  if (v_first ->> 'total')::numeric <> 1045.00 then
    raise exception 'Client price tampering changed the trusted total';
  end if;
  if v_before - v_after <> 1 then
    raise exception 'Idempotent retry decremented stock more than once';
  end if;
  if v_first ->> 'order_id' <> v_second ->> 'order_id' then
    raise exception 'Idempotent retry created a second order';
  end if;
end;
$$;
reset role;
select extensions.pass('checkout ignores client totals and is idempotent');

set local role anon;
do $$
declare
  v_expected_error boolean := false;
begin
  begin
    perform public.create_order(
      '[{"variant_id":32,"quantity":3}]'::jsonb,
      '{}'::jsonb,
      '{"name":"Test Buyer","email":"test@example.com","phone":"09171234567","address":"Test Street","city":"Manila"}'::jsonb,
      'cod', null, '22222222-2222-4222-8222-222222222222'
    );
  exception when others then
    if sqlerrm like 'Insufficient stock%' then v_expected_error := true; else raise; end if;
  end;
  if not v_expected_error then raise exception 'Insufficient stock was accepted'; end if;
end;
$$;
reset role;
select extensions.pass('checkout rejects insufficient stock');

set local role anon;
do $$
declare
  v_expected_error boolean := false;
begin
  begin
    perform public.create_order(
      '[{"variant_id":999999,"quantity":1}]'::jsonb,
      '{}'::jsonb,
      '{"name":"Test Buyer","email":"test@example.com","phone":"09171234567","address":"Test Street","city":"Manila"}'::jsonb,
      'cod', null, '33333333-3333-4333-8333-333333333333'
    );
  exception when others then
    if sqlerrm like 'A requested product variant is unavailable%' then v_expected_error := true; else raise; end if;
  end;
  if not v_expected_error then raise exception 'Invalid variant was accepted'; end if;
end;
$$;
reset role;
select extensions.pass('checkout rejects invalid variants');

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'customer-a@example.com', '{"full_name":"Customer A"}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'customer-b@example.com', '{"full_name":"Customer B"}'::jsonb),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'admin-test@example.com', '{"full_name":"Admin Test"}'::jsonb);
insert into public.user_roles (user_id, role)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'admin');
insert into public.orders (
  order_number, idempotency_key, customer_user_id, payment_method,
  shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city,
  subtotal, shipping_fee, discount_amount, total
) values (
  '7SS-ABCDEF12', '44444444-4444-4444-8444-444444444444',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cod', 'Customer A',
  'customer-a@example.com', '09170000000', 'Test Street', 'Manila', 100, 150, 0, 250
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.orders where order_number = '7SS-ABCDEF12') <> 0 then
    raise exception 'Cross-user order access was allowed';
  end if;
end;
$$;
reset role;
select extensions.pass('customers cannot read another customer order');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);
do $$
declare
  v_rows integer;
  v_expected_error boolean := false;
begin
  update public.products set name = 'Unauthorized change' where id = 1;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'Non-admin product update was allowed'; end if;
  begin
    perform public.admin_dashboard_stats();
  exception when insufficient_privilege then
    v_expected_error := true;
  end;
  if not v_expected_error then raise exception 'Non-admin analytics call was allowed'; end if;
end;
$$;
reset role;
select extensions.pass('non-admin users cannot mutate catalog or read analytics');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}', true);
do $$
declare
  v_order_id bigint;
  v_stock_after_first_cancel integer;
  v_stock_after_second_cancel integer;
begin
  if not public.is_admin() then raise exception 'Admin role was not recognized'; end if;
  perform public.admin_dashboard_stats();

  select id into v_order_id
  from public.orders
  where idempotency_key = '11111111-1111-4111-8111-111111111111';
  perform public.admin_update_order(v_order_id, 'cancelled');
  select stock_quantity into v_stock_after_first_cancel from public.product_variants where id = 1;
  perform public.admin_update_order(v_order_id, 'cancelled');
  select stock_quantity into v_stock_after_second_cancel from public.product_variants where id = 1;
  if v_stock_after_first_cancel <> 45 or v_stock_after_second_cancel <> 45 then
    raise exception 'Order cancellation did not restore stock exactly once';
  end if;

  if public.admin_adjust_inventory(1, 46, 'Test adjustment') <> 46 then
    raise exception 'Admin stock adjustment failed';
  end if;
end;
$$;
reset role;
select extensions.pass('administrators can access analytics and maintain inventory safely');

set local role anon;
do $$
declare
  v_storage_denied boolean := false;
  v_newsletter_denied boolean := false;
begin
  begin
    insert into storage.objects (bucket_id, name)
    values ('product-images', 'products/anonymous-test.png');
  exception when insufficient_privilege then
    v_storage_denied := true;
  end;
  begin
    perform public.subscribe_newsletter('bypass@example.com', null, repeat('a', 64));
  exception when insufficient_privilege then
    v_newsletter_denied := true;
  end;
  if not v_storage_denied then raise exception 'Anonymous storage upload was allowed'; end if;
  if not v_newsletter_denied then raise exception 'Direct newsletter RPC was allowed'; end if;
end;
$$;
reset role;
select extensions.pass('storage writes and newsletter RPC are not public');

select * from extensions.finish();
rollback;
