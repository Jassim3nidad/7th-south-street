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

  if v_user_id is not null then
    select id into v_customer_id
    from public.customers
    where user_id = v_user_id;

    if v_customer_id is null then
      update public.customers
      set user_id = v_user_id,
          first_name = coalesce(nullif(btrim(p_customer_information ->> 'first_name'), ''), first_name),
          last_name = coalesce(nullif(btrim(p_customer_information ->> 'last_name'), ''), last_name),
          phone = coalesce(nullif(v_shipping_phone, ''), phone)
      where email = v_email
        and user_id is null
      returning id into v_customer_id;
    end if;

    if v_customer_id is null then
      insert into public.customers (user_id, first_name, last_name, email, phone)
      values (
        v_user_id,
        coalesce(nullif(btrim(p_customer_information ->> 'first_name'), ''), split_part(v_shipping_name, ' ', 1)),
        coalesce(nullif(btrim(p_customer_information ->> 'last_name'), ''), ''),
        v_email,
        v_shipping_phone
      )
      returning id into v_customer_id;
    end if;
  end if;

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
    case when v_user_id is null then v_email else null end,
    p_payment_method,
    v_shipping_name,
    v_email,
    v_shipping_phone,
    v_shipping_address,
    v_shipping_city,
    nullif(btrim(coalesce(p_shipping_information ->> 'province', '')), ''),
    nullif(btrim(coalesce(p_shipping_information ->> 'postal', '')), ''),
    coalesce(nullif(btrim(p_shipping_information ->> 'country'), ''), 'Philippines'),
    v_subtotal,
    v_shipping_fee,
    0,
    v_total,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_order_id;

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
      products.name as product_name
    into strict v_variant
    from public.product_variants as variants
    join public.products as products on products.id = variants.product_id
    where variants.id = v_item.variant_id;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name_snapshot,
      sku_snapshot,
      size_snapshot,
      color_snapshot,
      unit_price_snapshot,
      quantity,
      line_total
    ) values (
      v_order_id,
      v_variant.product_id,
      v_variant.id,
      v_variant.product_name,
      v_variant.sku,
      v_variant.size,
      v_variant.color,
      v_variant.price,
      v_item.quantity,
      v_variant.price * v_item.quantity
    );

    update public.product_variants
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_variant.id
    returning stock_quantity into v_stock_after;

    insert into public.inventory_movements (
      variant_id,
      order_id,
      movement_type,
      quantity_delta,
      stock_after,
      reason,
      actor_user_id
    ) values (
      v_variant.id,
      v_order_id,
      'sale',
      -v_item.quantity,
      v_stock_after,
      'Order ' || v_order_number,
      v_user_id
    );
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

create or replace function public.admin_save_product(
  p_product_id bigint,
  p_product jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_product_id bigint;
  v_first_variant_id bigint;
  v_name text := btrim(coalesce(p_product ->> 'name', ''));
  v_slug text;
  v_sku text := upper(btrim(coalesce(p_product ->> 'sku', '')));
  v_price numeric(12, 2);
  v_compare_at_price numeric(12, 2);
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if v_name = '' or v_sku = '' then
    raise exception 'Product name and SKU are required' using errcode = '22023';
  end if;

  v_slug := coalesce(
    nullif(btrim(p_product ->> 'slug'), ''),
    trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'))
  );
  v_price := (p_product ->> 'price')::numeric(12, 2);
  v_compare_at_price := nullif(p_product ->> 'compare_price', '')::numeric(12, 2);

  if p_product_id is null then
    insert into public.products (
      category_id, name, slug, description, status, is_featured, has_sizes,
      meta_title, meta_description
    ) values (
      nullif(p_product ->> 'category_id', '')::bigint,
      v_name,
      v_slug,
      nullif(p_product ->> 'description', ''),
      coalesce(nullif(p_product ->> 'status', ''), 'available')::public.product_status,
      coalesce((p_product ->> 'is_featured')::boolean, false),
      coalesce((p_product ->> 'has_sizes')::boolean, true),
      nullif(p_product ->> 'meta_title', ''),
      nullif(p_product ->> 'meta_description', '')
    ) returning id into v_product_id;

    insert into public.product_variants (
      product_id, sku, size, price, compare_at_price, stock_quantity
    ) values (
      v_product_id, v_sku, 'OS', v_price, v_compare_at_price, 0
    );
  else
    update public.products
    set category_id = nullif(p_product ->> 'category_id', '')::bigint,
        name = v_name,
        slug = v_slug,
        description = nullif(p_product ->> 'description', ''),
        status = coalesce(nullif(p_product ->> 'status', ''), 'available')::public.product_status,
        is_featured = coalesce((p_product ->> 'is_featured')::boolean, false),
        has_sizes = coalesce((p_product ->> 'has_sizes')::boolean, true),
        meta_title = nullif(p_product ->> 'meta_title', ''),
        meta_description = nullif(p_product ->> 'meta_description', '')
    where id = p_product_id
    returning id into v_product_id;

    if v_product_id is null then
      raise exception 'Product not found' using errcode = 'P0002';
    end if;

    update public.product_variants
    set price = v_price,
        compare_at_price = v_compare_at_price
    where product_id = v_product_id;

    select id into v_first_variant_id
    from public.product_variants
    where product_id = v_product_id
    order by id
    limit 1;

    if v_first_variant_id is null then
      insert into public.product_variants (
        product_id, sku, size, price, compare_at_price, stock_quantity
      ) values (
        v_product_id, v_sku, 'OS', v_price, v_compare_at_price, 0
      );
    else
      update public.product_variants set sku = v_sku where id = v_first_variant_id;
    end if;
  end if;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    case when p_product_id is null then 'product.created' else 'product.updated' end,
    'product',
    v_product_id::text,
    jsonb_build_object('name', v_name, 'sku', v_sku)
  );

  return jsonb_build_object('id', v_product_id);
end;
$$;

revoke all on function public.admin_save_product(bigint, jsonb) from public, anon;
grant execute on function public.admin_save_product(bigint, jsonb) to authenticated, service_role;

create or replace function public.admin_delete_product(p_product_id bigint)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_name text;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select name into v_name from public.products where id = p_product_id;
  if v_name is null then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  delete from public.products where id = p_product_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), 'product.deleted', 'product', p_product_id::text, jsonb_build_object('name', v_name));
end;
$$;

revoke all on function public.admin_delete_product(bigint) from public, anon;
grant execute on function public.admin_delete_product(bigint) to authenticated, service_role;

create or replace function public.admin_adjust_inventory(
  p_variant_id bigint,
  p_stock_quantity integer,
  p_reason text default 'Manual adjustment'
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_previous integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_stock_quantity < 0 then
    raise exception 'Stock cannot be negative' using errcode = '22023';
  end if;

  select stock_quantity into v_previous
  from public.product_variants
  where id = p_variant_id
  for update;

  if v_previous is null then
    raise exception 'Product variant not found' using errcode = 'P0002';
  end if;

  if v_previous = p_stock_quantity then
    return p_stock_quantity;
  end if;

  update public.product_variants
  set stock_quantity = p_stock_quantity
  where id = p_variant_id;

  insert into public.inventory_movements (
    variant_id, movement_type, quantity_delta, stock_after, reason, actor_user_id
  ) values (
    p_variant_id,
    case when p_stock_quantity > v_previous then 'restock' else 'adjustment' end,
    p_stock_quantity - v_previous,
    p_stock_quantity,
    nullif(btrim(coalesce(p_reason, '')), ''),
    auth.uid()
  );

  return p_stock_quantity;
end;
$$;

revoke all on function public.admin_adjust_inventory(bigint, integer, text) from public, anon;
grant execute on function public.admin_adjust_inventory(bigint, integer, text) to authenticated, service_role;

create or replace function public.admin_update_order(
  p_order_id bigint,
  p_status public.order_status default null,
  p_payment_status public.payment_status default null,
  p_payment_reference text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  update public.orders
  set status = coalesce(p_status, status),
      payment_status = coalesce(p_payment_status, payment_status),
      payment_reference = coalesce(p_payment_reference, payment_reference),
      notes = coalesce(p_notes, notes),
      shipped_at = case when p_status = 'shipped' and shipped_at is null then now() else shipped_at end,
      delivered_at = case when p_status = 'delivered' and delivered_at is null then now() else delivered_at end
  where id = p_order_id;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    'order.updated',
    'order',
    p_order_id::text,
    jsonb_strip_nulls(jsonb_build_object(
      'status', p_status,
      'payment_status', p_payment_status,
      'payment_reference', p_payment_reference
    ))
  );
end;
$$;

revoke all on function public.admin_update_order(bigint, public.order_status, public.payment_status, text, text) from public, anon;
grant execute on function public.admin_update_order(bigint, public.order_status, public.payment_status, text, text) to authenticated, service_role;
