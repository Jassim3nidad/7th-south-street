-- Newsletter Enhancements and Identity Reconciliation

-- 1. Add missing columns to newsletter_subscribers
alter table public.newsletter_subscribers
add column source text not null default 'unknown',
add column consent_recorded_at timestamptz not null default now(),
add column unsubscribe_token uuid not null default gen_random_uuid();

-- Create an index on unsubscribe_token for fast lookups
create unique index newsletter_token_unique_idx on public.newsletter_subscribers(unsubscribe_token);

-- 2. Create the Identity Reconciliation function
create or replace function public.resolve_customer(
  p_email text,
  p_first_name text default null,
  p_last_name text default null,
  p_phone text default null,
  p_user_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_customer_id bigint;
begin
  if p_email is null or btrim(p_email) = '' then
    return null;
  end if;

  insert into public.customers (email, first_name, last_name, phone, user_id)
  values (
    lower(btrim(p_email)),
    coalesce(nullif(btrim(p_first_name), ''), split_part(btrim(p_email), '@', 1)),
    coalesce(nullif(btrim(p_last_name), ''), ''),
    nullif(btrim(p_phone), ''),
    p_user_id
  )
  on conflict (lower(email)) do update
  set first_name = coalesce(nullif(public.customers.first_name, ''), excluded.first_name),
      last_name = coalesce(nullif(public.customers.last_name, ''), excluded.last_name),
      phone = coalesce(nullif(public.customers.phone, ''), excluded.phone),
      user_id = coalesce(public.customers.user_id, excluded.user_id),
      updated_at = now()
  returning id into v_customer_id;

  return v_customer_id;
end;
$$;

revoke all on function public.resolve_customer(text, text, text, text, uuid) from public;
grant execute on function public.resolve_customer(text, text, text, text, uuid) to service_role;

-- 3. Update subscribe_newsletter to support source and consent
create or replace function public.subscribe_newsletter(
  p_email text,
  p_name text,
  p_source text,
  p_request_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_attempts integer;
begin
  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;

  if p_request_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'A valid request fingerprint is required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request_hash, 0));

  insert into private.newsletter_rate_limits (request_hash, window_started_at, attempts)
  values (p_request_hash, now(), 1)
  on conflict (request_hash) do update
  set attempts = case
        when private.newsletter_rate_limits.window_started_at < now() - interval '1 minute' then 1
        else private.newsletter_rate_limits.attempts + 1
      end,
      window_started_at = case
        when private.newsletter_rate_limits.window_started_at < now() - interval '1 minute' then now()
        else private.newsletter_rate_limits.window_started_at
      end
  returning attempts into v_attempts;

  delete from private.newsletter_rate_limits
  where window_started_at < now() - interval '1 day';

  if v_attempts > 5 then
    return jsonb_build_object('accepted', false);
  end if;

  insert into public.newsletter_subscribers (
    email, name, source, is_active, subscribed_at, unsubscribed_at, consent_recorded_at
  ) values (
    v_email, 
    nullif(btrim(coalesce(p_name, '')), ''), 
    coalesce(nullif(btrim(p_source), ''), 'unknown'),
    true, now(), null, now()
  )
  on conflict (lower(email)) do update
  set name = coalesce(excluded.name, public.newsletter_subscribers.name),
      is_active = true,
      subscribed_at = now(),
      unsubscribed_at = null,
      source = coalesce(public.newsletter_subscribers.source, excluded.source),
      consent_recorded_at = coalesce(public.newsletter_subscribers.consent_recorded_at, excluded.consent_recorded_at);

  return jsonb_build_object('accepted', true);
end;
$$;

revoke all on function public.subscribe_newsletter(text, text, text, text) from public;
grant execute on function public.subscribe_newsletter(text, text, text, text) to service_role;

-- 4. Create Unsubscribe RPC
create or replace function public.unsubscribe_newsletter(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_found boolean;
begin
  update public.newsletter_subscribers
  set is_active = false,
      unsubscribed_at = now()
  where unsubscribe_token = p_token
  returning true into v_found;

  if v_found is null then
    return jsonb_build_object('success', false, 'message', 'Invalid unsubscribe token');
  end if;

  return jsonb_build_object('success', true, 'message', 'Unsubscribed successfully');
end;
$$;

revoke all on function public.unsubscribe_newsletter(uuid) from public;
-- allow anyone with the token to execute this (or call it via route handler)
grant execute on function public.unsubscribe_newsletter(uuid) to anon, authenticated, service_role;

-- 5. Update RSVP Event to resolve customer identity
create or replace function public.rsvp_event(
  p_event_id bigint,
  p_name text,
  p_email text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_event public.events%rowtype;
  v_rsvp_id bigint;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_customer_id bigint;
begin
  if btrim(coalesce(p_name, '')) = ''
     or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'A valid name and email address are required' using errcode = '22023';
  end if;

  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found or v_event.status not in ('upcoming', 'ongoing') then
    raise exception 'This event is not accepting reservations' using errcode = 'P0001';
  end if;

  if v_event.max_rsvp > 0 and v_event.rsvp_count >= v_event.max_rsvp then
    raise exception 'This event is fully booked' using errcode = 'P0001';
  end if;

  -- Reconcile Identity
  v_customer_id := public.resolve_customer(
    v_email,
    split_part(btrim(p_name), ' ', 1),
    substring(btrim(p_name) from position(' ' in btrim(p_name)) + 1),
    p_phone
  );

  insert into public.event_rsvps (event_id, name, email, phone)
  values (
    p_event_id,
    btrim(p_name),
    v_email,
    nullif(btrim(coalesce(p_phone, '')), '')
  )
  on conflict (event_id, email) do nothing
  returning id into v_rsvp_id;

  if v_rsvp_id is null then
    return jsonb_build_object('created', false);
  end if;

  update public.events
  set rsvp_count = rsvp_count + 1
  where id = p_event_id;

  return jsonb_build_object('created', true);
end;
$$;

revoke all on function public.rsvp_event(bigint, text, text, text) from public;
grant execute on function public.rsvp_event(bigint, text, text, text) to anon, authenticated, service_role;

-- 6. Update Create Order to resolve customer safely
create or replace function public.create_order(
  p_items jsonb,
  p_customer_information jsonb,
  p_shipping_information jsonb,
  p_payment_method text,
  p_notes text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_existing public.orders%rowtype;
  v_variant record;
  v_item record;
  v_order_id bigint;
  v_order_number text;
  v_customer_id bigint;
  v_user_id uuid := auth.uid();
  v_subtotal numeric(12, 2) := 0;
  v_shipping_fee constant numeric(12, 2) := 150.00;
  v_total numeric(12, 2);
  v_stock_after integer;
  v_email text;
  v_shipping_name text;
  v_shipping_phone text;
  v_shipping_address text;
  v_shipping_city text;
begin
  if p_idempotency_key is null then
    raise exception 'An idempotency key is required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select * into v_existing
  from public.orders
  where idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'order_id', v_existing.id,
      'order_number', v_existing.order_number,
      'total', v_existing.total
    );
  end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 50 then
    raise exception 'Order must contain between 1 and 50 items' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as items(item)
    where jsonb_typeof(item) <> 'object'
       or coalesce(item ->> 'variant_id', '') !~ '^[0-9]+$'
       or coalesce(item ->> 'quantity', '') !~ '^[1-9][0-9]*$'
       or (item ->> 'quantity')::integer > 25
  ) then
    raise exception 'Every item requires a valid variant and quantity from 1 to 25' using errcode = '22023';
  end if;

  v_email := lower(btrim(coalesce(
    p_shipping_information ->> 'email',
    p_customer_information ->> 'email',
    ''
  )));
  v_shipping_name := btrim(coalesce(p_shipping_information ->> 'name', ''));
  v_shipping_phone := btrim(coalesce(p_shipping_information ->> 'phone', ''));
  v_shipping_address := btrim(coalesce(p_shipping_information ->> 'address', ''));
  v_shipping_city := btrim(coalesce(p_shipping_information ->> 'city', ''));

  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
     or v_shipping_name = ''
     or v_shipping_phone = ''
     or v_shipping_address = ''
     or v_shipping_city = '' then
    raise exception 'Complete and valid shipping details are required' using errcode = '22023';
  end if;

  if p_payment_method not in ('cod', 'gcash', 'bank') then
    raise exception 'Unsupported payment method' using errcode = '22023';
  end if;

  if length(coalesce(p_notes, '')) > 1000 then
    raise exception 'Order notes are too long' using errcode = '22023';
  end if;

  for v_item in
    select
      (item ->> 'variant_id')::bigint as variant_id,
      sum((item ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as items(item)
    group by (item ->> 'variant_id')::bigint
    order by (item ->> 'variant_id')::bigint
  loop
    select
      variants.id,
      variants.product_id,
      variants.sku,
      variants.size,
      variants.color,
      variants.price,
      variants.stock_quantity,
      products.name as product_name
    into v_variant
    from public.product_variants as variants
    join public.products as products on products.id = variants.product_id
    where variants.id = v_item.variant_id
      and variants.is_active
      and products.status = 'available'
    for update of variants;

    if not found then
      raise exception 'A requested product variant is unavailable' using errcode = 'P0001';
    end if;

    if v_variant.stock_quantity < v_item.quantity then
      raise exception 'Insufficient stock for % (%)', v_variant.product_name, v_variant.size using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + (v_variant.price * v_item.quantity);
  end loop;

  v_total := v_subtotal + v_shipping_fee;

  -- Reconcile Customer Identity
  v_customer_id := public.resolve_customer(
    v_email,
    coalesce(nullif(btrim(p_customer_information ->> 'first_name'), ''), split_part(v_shipping_name, ' ', 1)),
    coalesce(nullif(btrim(p_customer_information ->> 'last_name'), ''), substring(v_shipping_name from position(' ' in v_shipping_name) + 1)),
    v_shipping_phone,
    v_user_id
  );

  loop
    v_order_number := '7SS-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    exit when not exists (
      select 1 from public.orders where order_number = v_order_number
    );
  end loop;

  insert into public.orders (
    order_number,
    idempotency_key,
    customer_id,
    customer_user_id,
    guest_email,
    payment_method,
    shipping_name,
    shipping_email,
    shipping_phone,
    shipping_address,
    shipping_city,
    shipping_province,
    shipping_postal,
    shipping_country,
    subtotal,
    shipping_fee,
    discount_amount,
    total,
    notes
  ) values (
    v_order_number,
    p_idempotency_key,
    v_customer_id,
    v_user_id,
    v_email,
    p_payment_method,
    v_shipping_name,
    v_email,
    v_shipping_phone,
    v_shipping_address,
    v_shipping_city,
    coalesce(p_shipping_information ->> 'province', ''),
    coalesce(p_shipping_information ->> 'postal', ''),
    coalesce(p_shipping_information ->> 'country', 'PH'),
    v_subtotal,
    v_shipping_fee,
    0,
    v_total,
    coalesce(p_notes, '')
  )
  returning id into v_order_id;

  for v_item in
    select
      (item ->> 'variant_id')::bigint as variant_id,
      sum((item ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as items(item)
    group by (item ->> 'variant_id')::bigint
  loop
    select
      variants.price,
      products.name as product_name
    into v_variant
    from public.product_variants as variants
    join public.products as products on products.id = variants.product_id
    where variants.id = v_item.variant_id;

    insert into public.order_items (
      order_id,
      variant_id,
      product_name,
      quantity,
      price,
      total
    ) values (
      v_order_id,
      v_item.variant_id,
      v_variant.product_name,
      v_item.quantity,
      v_variant.price,
      v_variant.price * v_item.quantity
    );

    update public.product_variants
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_item.variant_id
    returning stock_quantity into v_stock_after;

    if v_stock_after = 0 then
      update public.product_variants
      set is_active = false
      where id = v_item.variant_id;
    end if;
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, jsonb, text, text, uuid) from public;
grant execute on function public.create_order(jsonb, jsonb, jsonb, text, text, uuid) to anon, authenticated, service_role;
