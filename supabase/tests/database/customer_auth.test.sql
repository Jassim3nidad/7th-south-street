begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(14);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  (
    '11111111-1111-4111-8111-111111111111',
    'CUSTOMER-A@example.com',
    '2026-07-18 01:00:00+00',
    '{"first_name":"  Customer  ","last_name":" A  ","phone":" 09170000001 ","role":"admin"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'customer-b@example.com',
    '2026-07-18 01:00:00+00',
    '{"full_name":"Customer B"}'::jsonb
  );

do $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
      and full_name = 'Customer A'
      and email = 'customer-a@example.com'
      and phone = '09170000001'
  ) then
    raise exception 'Auth signup did not provision the normalized profile';
  end if;

  if not exists (
    select 1
    from public.customers
    where user_id = '11111111-1111-4111-8111-111111111111'
      and first_name = 'Customer'
      and last_name = 'A'
      and email = 'customer-a@example.com'
      and email_verified_at = '2026-07-18 01:00:00+00'
  ) then
    raise exception 'Auth signup did not provision the normalized customer';
  end if;
end;
$$;
select extensions.pass('Auth signup provisions normalized profile and customer records');

do $$
begin
  if (select count(*) from public.user_roles where user_id = '11111111-1111-4111-8111-111111111111' and role = 'customer') <> 1
     or exists (select 1 from public.user_roles where user_id = '11111111-1111-4111-8111-111111111111' and role = 'admin') then
    raise exception 'User metadata influenced the database authorization role';
  end if;
end;
$$;
select extensions.pass('signup metadata cannot assign an administrator role');

update auth.users
set email = 'customer-a-renamed@example.com',
    email_confirmed_at = '2026-07-18 02:00:00+00',
    raw_user_meta_data = '{"first_name":"Updated","last_name":"Customer"}'::jsonb
where id = '11111111-1111-4111-8111-111111111111';

do $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
      and full_name = 'Updated Customer'
      and email = 'customer-a-renamed@example.com'
  ) or not exists (
    select 1
    from public.customers
    where user_id = '11111111-1111-4111-8111-111111111111'
      and first_name = 'Updated'
      and last_name = 'Customer'
      and email = 'customer-a-renamed@example.com'
      and email_verified_at = '2026-07-18 02:00:00+00'
  ) then
    raise exception 'Auth identity changes were not synchronized';
  end if;
end;
$$;
select extensions.pass('confirmed Auth identity changes synchronize to customer records');

insert into public.customers (first_name, last_name, email)
values ('Imported', 'Buyer', 'imported-buyer@example.com');

insert into auth.users (id, email, raw_user_meta_data)
values (
  '33333333-3333-4333-8333-333333333333',
  'imported-buyer@example.com',
  '{"first_name":"Imported","last_name":"Buyer"}'::jsonb
);

do $$
begin
  if exists (
    select 1 from public.customers
    where email = 'imported-buyer@example.com'
      and user_id is not null
  ) then
    raise exception 'An unverified signup claimed an imported customer';
  end if;

  update auth.users
  set email_confirmed_at = '2026-07-18 03:00:00+00'
  where id = '33333333-3333-4333-8333-333333333333';

  if not exists (
    select 1 from public.customers
    where email = 'imported-buyer@example.com'
      and user_id = '33333333-3333-4333-8333-333333333333'
      and email_verified_at = '2026-07-18 03:00:00+00'
  ) then
    raise exception 'A verified matching signup did not claim the imported customer';
  end if;
end;
$$;
select extensions.pass('only a verified matching Auth email can claim an unowned customer');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '44444444-4444-4444-8444-444444444444',
  'checkout-link@example.com',
  '2026-07-18 04:00:00+00',
  '{"first_name":"Checkout","last_name":"Buyer"}'::jsonb
);

delete from public.customers
where user_id = '44444444-4444-4444-8444-444444444444';

insert into public.customers (first_name, last_name, email)
values ('Checkout', 'Buyer', 'checkout-link@example.com');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","email":"checkout-link@example.com"}',
  true
);
do $$
declare
  v_result jsonb;
begin
  v_result := public.create_order(
    '[{"variant_id":1,"quantity":1}]'::jsonb,
    '{"first_name":"Checkout","last_name":"Buyer","email":"checkout-link@example.com"}'::jsonb,
    '{"name":"Checkout Buyer","email":"checkout-link@example.com","phone":"09170000004","address":"Checkout Street","city":"Manila"}'::jsonb,
    'cod',
    null,
    '55555555-5555-4555-8555-555555555555'
  );

  if v_result ->> 'order_id' is null
     or not exists (
       select 1 from public.customers
       where user_id = '44444444-4444-4444-8444-444444444444'
         and email = 'checkout-link@example.com'
     ) then
    raise exception 'Verified checkout did not retain guest-customer linking';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);
select extensions.pass('verified authenticated checkout retains safe guest-customer linking');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '66666666-6666-4666-8666-666666666666',
  'checkout-attacker@example.com',
  '2026-07-18 04:30:00+00',
  '{"first_name":"Checkout","last_name":"Attacker"}'::jsonb
);

delete from public.customers
where user_id = '66666666-6666-4666-8666-666666666666';

insert into public.customers (first_name, last_name, email)
values ('Imported', 'Victim', 'checkout-victim@example.com');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","email":"checkout-attacker@example.com"}',
  true
);
do $$
declare
  v_expected_error boolean := false;
begin
  begin
    perform public.create_order(
      '[{"variant_id":1,"quantity":1}]'::jsonb,
      '{"first_name":"Imported","last_name":"Victim","email":"checkout-victim@example.com"}'::jsonb,
      '{"name":"Imported Victim","email":"checkout-victim@example.com","phone":"09170000006","address":"Victim Street","city":"Manila"}'::jsonb,
      'cod',
      null,
      '66666666-6666-4666-8666-666666666666'
    );
  exception when insufficient_privilege then
    v_expected_error := true;
  end;

  if not v_expected_error then
    raise exception 'A mismatched Auth email claimed an imported checkout customer';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);

do $$
begin
  if not exists (
    select 1 from public.customers
    where email = 'checkout-victim@example.com'
      and user_id is null
  ) then
    raise exception 'Failed checkout changed imported customer ownership';
  end if;
end;
$$;
select extensions.pass('authenticated checkout cannot claim a customer with a different Auth email');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '77777777-7777-4777-8777-777777777777',
  'checkout-no-row@example.com',
  '2026-07-18 04:45:00+00',
  '{"first_name":"Checkout","last_name":"No Row"}'::jsonb
);

delete from public.customers
where user_id = '77777777-7777-4777-8777-777777777777';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated","email":"checkout-no-row@example.com"}',
  true
);
do $$
declare
  v_expected_error boolean := false;
begin
  begin
    perform public.create_order(
      '[{"variant_id":1,"quantity":1}]'::jsonb,
      '{"first_name":"Checkout","last_name":"No Row","email":"unused-victim@example.com"}'::jsonb,
      '{"name":"Checkout No Row","email":"unused-victim@example.com","phone":"09170000007","address":"No Row Street","city":"Manila"}'::jsonb,
      'cod',
      null,
      '77777777-7777-4777-8777-777777777777'
    );
  exception when insufficient_privilege then
    v_expected_error := true;
  end;

  if not v_expected_error then
    raise exception 'An Auth user without a customer row bound an arbitrary email';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);

do $$
begin
  if exists (
    select 1 from public.customers
    where user_id = '77777777-7777-4777-8777-777777777777'
       or email = 'unused-victim@example.com'
  ) then
    raise exception 'Failed checkout left a mismatched customer identity behind';
  end if;
end;
$$;
select extensions.pass('authenticated checkout cannot insert a customer with a different Auth email');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated","email":"checkout-no-row@example.com"}',
  true
);
do $$
declare
  v_result jsonb;
begin
  v_result := public.create_order(
    '[{"variant_id":1,"quantity":1}]'::jsonb,
    '{"first_name":"Checkout","last_name":"No Row","email":"checkout-no-row@example.com"}'::jsonb,
    '{"name":"Checkout No Row","email":"checkout-no-row@example.com","phone":"09170000007","address":"No Row Street","city":"Manila"}'::jsonb,
    'cod',
    null,
    '88888888-8888-4888-8888-888888888888'
  );

  if v_result ->> 'order_id' is null then
    raise exception 'Matching authenticated checkout did not create an order';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);

do $$
begin
  if not exists (
    select 1 from public.customers
    where user_id = '77777777-7777-4777-8777-777777777777'
      and email = 'checkout-no-row@example.com'
      and email_verified_at = '2026-07-18 04:45:00+00'
  ) then
    raise exception 'Matching checkout did not copy the confirmed Auth identity';
  end if;
end;
$$;
select extensions.pass('authenticated checkout inserts only its confirmed matching Auth identity');

insert into public.customer_addresses (
  customer_id, label, address_line1, city
)
select id, 'Private', 'Customer A Street', 'Manila'
from public.customers
where user_id = '11111111-1111-4111-8111-111111111111';

insert into public.wishlists (customer_id, product_id)
select id, 1
from public.customers
where user_id = '11111111-1111-4111-8111-111111111111';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"customer-b@example.com"}',
  true
);

do $$
declare
  v_rows integer;
begin
  if (select count(*) from public.profiles where id = '22222222-2222-4222-8222-222222222222') <> 1
     or (select count(*) from public.customers where user_id = '22222222-2222-4222-8222-222222222222') <> 1 then
    raise exception 'Customer could not read their own identity records';
  end if;

  update public.customers
  set phone = '09179999999'
  where user_id = '22222222-2222-4222-8222-222222222222';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'Customer could not update a safe field on their own record';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);
select extensions.pass('customers can read and safely update their own records');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"customer-b@example.com"}',
  true
);
do $$
declare
  v_rows integer;
begin
  if exists (select 1 from public.profiles where id = '11111111-1111-4111-8111-111111111111')
     or exists (select 1 from public.customers where user_id = '11111111-1111-4111-8111-111111111111') then
    raise exception 'Cross-user profile or customer read was allowed';
  end if;

  update public.customers
  set phone = '09178888888'
  where user_id = '11111111-1111-4111-8111-111111111111';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Cross-user customer update was allowed';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);
select extensions.pass('customers cannot read or update another customer identity');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"customer-b@example.com"}',
  true
);
do $$
declare
  v_rows integer;
begin
  if exists (select 1 from public.customer_addresses where address_line1 = 'Customer A Street')
     or (select count(*) from public.wishlists) <> 0 then
    raise exception 'Cross-user address or wishlist read was allowed';
  end if;

  update public.customer_addresses
  set city = 'Cebu'
  where address_line1 = 'Customer A Street';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Cross-user address update was allowed';
  end if;

  delete from public.wishlists
  where product_id = 1;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Cross-user wishlist delete was allowed';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);
select extensions.pass('address and wishlist RLS isolates customer-owned rows');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"customer-b@example.com"}',
  true
);
do $$
declare
  v_expected_error boolean := false;
begin
  begin
    update public.customers
    set user_id = '11111111-1111-4111-8111-111111111111',
        email = 'forged@example.com',
        email_verified_at = now()
    where user_id = '22222222-2222-4222-8222-222222222222';
  exception when insufficient_privilege then
    v_expected_error := true;
  end;

  if not v_expected_error then
    raise exception 'Customer forged an Auth-backed identity field';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);
select extensions.pass('customers cannot forge Auth-backed identity or verification fields');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"customer-b@example.com"}',
  true
);
do $$
declare
  v_expected_error boolean := false;
begin
  begin
    update public.profiles
    set email = 'forged-profile@example.com'
    where id = '22222222-2222-4222-8222-222222222222';
  exception when insufficient_privilege then
    v_expected_error := true;
  end;

  if not v_expected_error
     or exists (
       select 1 from public.profiles
       where id = '22222222-2222-4222-8222-222222222222'
         and email = 'forged-profile@example.com'
     ) then
    raise exception 'Customer forged the Auth-backed profile email';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);
select extensions.pass('customers cannot override the Auth-backed profile email');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"customer-b@example.com"}',
  true
);
do $$
declare
  v_rows integer;
  v_insert_denied boolean := false;
begin
  update public.user_roles
  set role = 'admin'
  where user_id = '22222222-2222-4222-8222-222222222222'
    and role = 'customer';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Customer changed their own role to administrator';
  end if;

  begin
    insert into public.user_roles (user_id, role)
    values ('22222222-2222-4222-8222-222222222222', 'admin');
  exception when insufficient_privilege then
    v_insert_denied := true;
  end;

  if not v_insert_denied
     or exists (
       select 1 from public.user_roles
       where user_id = '22222222-2222-4222-8222-222222222222'
         and role = 'admin'
     ) then
    raise exception 'Customer inserted an administrator role';
  end if;
end;
$$;
reset role;
select set_config('request.jwt.claims', '{}', true);
select extensions.pass('customers cannot create or mutate privileged roles');

select * from extensions.finish();
rollback;
