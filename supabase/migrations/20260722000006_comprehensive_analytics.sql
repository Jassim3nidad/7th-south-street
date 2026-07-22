drop function if exists public.admin_dashboard_stats();

create or replace function public.admin_dashboard_stats(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_gross_sales numeric;
  v_net_sales numeric;
  v_order_count bigint;
  v_paid_order_count bigint;
  v_new_customers bigint;
  v_returning_customers bigint;
  v_rsvp_activity bigint;
  v_newsletter_growth bigint;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  -- 1. Sales & Orders
  select 
    coalesce(sum(total), 0),
    count(*)
  into v_gross_sales, v_order_count
  from public.orders
  where status <> 'cancelled'
    and (p_start_date is null or created_at >= p_start_date)
    and (p_end_date is null or created_at <= p_end_date);

  select 
    coalesce(sum(total), 0),
    count(*)
  into v_net_sales, v_paid_order_count
  from public.orders
  where payment_status = 'paid'
    and status not in ('cancelled', 'refunded')
    and (p_start_date is null or created_at >= p_start_date)
    and (p_end_date is null or created_at <= p_end_date);

  -- 2. Customer Growth
  select count(*) into v_new_customers
  from public.customers
  where (p_start_date is null or created_at >= p_start_date)
    and (p_end_date is null or created_at <= p_end_date);

  select count(distinct o1.customer_id) into v_returning_customers
  from public.orders o1
  where o1.payment_status = 'paid'
    and (p_start_date is null or o1.created_at >= p_start_date)
    and (p_end_date is null or o1.created_at <= p_end_date)
    and (
      select count(*) from public.orders o2 
      where o2.customer_id = o1.customer_id 
        and o2.payment_status = 'paid'
    ) > 1;

  -- 3. RSVPs & Newsletter
  select count(*) into v_rsvp_activity
  from public.event_rsvps
  where (p_start_date is null or created_at >= p_start_date)
    and (p_end_date is null or created_at <= p_end_date);

  select count(*) into v_newsletter_growth
  from public.newsletter_subscribers
  where (p_start_date is null or created_at >= p_start_date)
    and (p_end_date is null or created_at <= p_end_date);

  return jsonb_build_object(
    'overview', jsonb_build_object(
      'gross_sales', v_gross_sales,
      'net_sales', v_net_sales,
      'total_orders', v_order_count,
      'paid_orders', v_paid_order_count,
      'average_order_value', case when v_paid_order_count > 0 then v_net_sales / v_paid_order_count else 0 end,
      'new_customers', v_new_customers,
      'returning_customers', v_returning_customers,
      'rsvp_activity', v_rsvp_activity,
      'newsletter_growth', v_newsletter_growth,
      'total_products', (select count(*) from public.products where status <> 'archived')
    ),
    'recent_orders', coalesce((
      select jsonb_agg(to_jsonb(recent) order by recent.created_at desc)
      from (
        select id, order_number, shipping_name, total, status, created_at
        from public.orders
        where (p_start_date is null or created_at >= p_start_date)
          and (p_end_date is null or created_at <= p_end_date)
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
    'upcoming_events', coalesce((
      select jsonb_agg(to_jsonb(evt) order by evt.event_date asc)
      from (
        select
          id,
          title,
          event_date,
          location_name,
          rsvp_count,
          max_rsvp,
          status
        from public.events
        where (status = 'upcoming' or event_date >= now())
        order by event_date asc
        limit 5
      ) as evt
    ), '[]'::jsonb),
    'sales_by_month', coalesce((
      select jsonb_agg(to_jsonb(monthly) order by monthly.month)
      from (
        select
          to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
          count(*) as orders,
          sum(total) as revenue
        from public.orders
        where created_at >= coalesce(p_start_date, date_trunc('month', now()) - interval '5 months')
          and (p_end_date is null or created_at <= p_end_date)
          and payment_status = 'paid'
          and status not in ('cancelled', 'refunded')
        group by date_trunc('month', created_at)
        order by date_trunc('month', created_at)
      ) as monthly
    ), '[]'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(to_jsonb(top_product) order by top_product.sold desc)
      from (
        select
          oi.product_name_snapshot as name,
          sum(oi.quantity) as sold,
          sum(oi.line_total) as revenue
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where o.payment_status = 'paid'
          and o.status not in ('cancelled', 'refunded')
          and (p_start_date is null or o.created_at >= p_start_date)
          and (p_end_date is null or o.created_at <= p_end_date)
        group by oi.product_name_snapshot
        order by sold desc
        limit 5
      ) as top_product
    ), '[]'::jsonb),
    'top_variants', coalesce((
      select jsonb_agg(to_jsonb(top_variant) order by top_variant.sold desc)
      from (
        select
          oi.product_name_snapshot as name,
          oi.size,
          oi.color,
          sum(oi.quantity) as sold
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where o.payment_status = 'paid'
          and o.status not in ('cancelled', 'refunded')
          and (p_start_date is null or o.created_at >= p_start_date)
          and (p_end_date is null or o.created_at <= p_end_date)
        group by oi.product_name_snapshot, oi.size, oi.color
        order by sold desc
        limit 5
      ) as top_variant
    ), '[]'::jsonb),
    'sell_through', coalesce((
      select jsonb_agg(to_jsonb(st) order by st.sell_through_rate desc)
      from (
        select
          p.name,
          sum(oi.quantity) as sold,
          sum(v.stock_quantity) as stock,
          (sum(oi.quantity)::numeric / nullif((sum(oi.quantity) + sum(v.stock_quantity)), 0)) as sell_through_rate
        from public.products p
        join public.product_variants v on v.product_id = p.id
        left join public.order_items oi on oi.variant_id = v.id
        left join public.orders o on o.id = oi.order_id 
          and o.payment_status = 'paid' 
          and o.status not in ('cancelled', 'refunded')
          and (p_start_date is null or o.created_at >= p_start_date)
          and (p_end_date is null or o.created_at <= p_end_date)
        where p.status = 'published'
        group by p.id, p.name
        having sum(oi.quantity) > 0
        order by sell_through_rate desc
        limit 5
      ) as st
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_dashboard_stats(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_dashboard_stats(timestamptz, timestamptz) to authenticated, service_role;
