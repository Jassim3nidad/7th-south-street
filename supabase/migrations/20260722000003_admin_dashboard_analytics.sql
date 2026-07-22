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
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'overview', jsonb_build_object(
      'total_orders', (
        select count(*) from public.orders 
        where (p_start_date is null or created_at >= p_start_date)
          and (p_end_date is null or created_at <= p_end_date)
      ),
      'pending_orders', (
        select count(*) from public.orders 
        where status = 'pending'
          and (p_start_date is null or created_at >= p_start_date)
          and (p_end_date is null or created_at <= p_end_date)
      ),
      'total_revenue', (
        select coalesce(sum(total), 0) from public.orders 
        where payment_status = 'paid' 
          and status not in ('cancelled', 'refunded')
          and (p_start_date is null or created_at >= p_start_date)
          and (p_end_date is null or created_at <= p_end_date)
      ),
      'total_products', (select count(*) from public.products where status <> 'archived'),
      'total_customers', (select count(*) from public.customers)
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
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_dashboard_stats(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_dashboard_stats(timestamptz, timestamptz) to authenticated, service_role;
