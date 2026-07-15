create or replace function public.subscribe_newsletter(
  p_email text,
  p_name text,
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
    email, name, is_active, subscribed_at, unsubscribed_at
  ) values (
    v_email, nullif(btrim(coalesce(p_name, '')), ''), true, now(), null
  )
  on conflict (lower(email)) do update
  set name = coalesce(excluded.name, public.newsletter_subscribers.name),
      is_active = true,
      subscribed_at = now(),
      unsubscribed_at = null;

  return jsonb_build_object('accepted', true);
end;
$$;

revoke all on function public.subscribe_newsletter(text, text, text) from public;
grant execute on function public.subscribe_newsletter(text, text, text) to anon, authenticated, service_role;

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

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'overview', jsonb_build_object(
      'total_orders', (select count(*) from public.orders),
      'total_revenue', (select coalesce(sum(total), 0) from public.orders where payment_status = 'paid'),
      'total_products', (select count(*) from public.products where status <> 'archived'),
      'total_customers', (select count(*) from public.customers)
    ),
    'recent_orders', coalesce((
      select jsonb_agg(to_jsonb(recent) order by recent.created_at desc)
      from (
        select id, order_number, shipping_name, total, status, created_at
        from public.orders
        order by created_at desc
        limit 5
      ) as recent
    ), '[]'::jsonb),
    'low_stock', coalesce((
      select jsonb_agg(to_jsonb(stock) order by stock.stock_quantity, stock.product_name)
      from (
        select
          products.name as product_name,
          variants.size,
          variants.stock_quantity
        from public.product_variants as variants
        join public.products as products on products.id = variants.product_id
        where variants.is_active
          and variants.stock_quantity <= variants.low_stock_threshold
          and variants.stock_quantity > 0
        order by variants.stock_quantity, products.name
        limit 10
      ) as stock
    ), '[]'::jsonb),
    'sales_by_month', coalesce((
      select jsonb_agg(to_jsonb(monthly) order by monthly.month)
      from (
        select
          to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
          count(*) as orders,
          sum(total) as revenue
        from public.orders
        where created_at >= date_trunc('month', now()) - interval '5 months'
          and payment_status = 'paid'
        group by date_trunc('month', created_at)
        order by date_trunc('month', created_at)
      ) as monthly
    ), '[]'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(to_jsonb(top_product) order by top_product.sold desc)
      from (
        select
          product_name_snapshot as name,
          sum(quantity) as sold,
          sum(line_total) as revenue
        from public.order_items
        group by product_name_snapshot
        order by sold desc
        limit 5
      ) as top_product
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated, service_role;
