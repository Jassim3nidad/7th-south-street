drop policy "Public product images are readable" on storage.objects;

create policy "Administrators can inspect product images"
on storage.objects for select to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
  and public.is_admin()
);

alter function public.admin_save_product(bigint, jsonb) security invoker;
alter function public.admin_delete_product(bigint) security invoker;
alter function public.admin_update_order(bigint, public.order_status, public.payment_status, text, text) security invoker;
alter function public.admin_dashboard_stats() security invoker;

create or replace function public.admin_adjust_inventory(
  p_variant_id bigint,
  p_stock_quantity integer,
  p_reason text default 'Manual adjustment'
)
returns integer
language plpgsql
security invoker
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
    (case when p_stock_quantity > v_previous then 'restock' else 'adjustment' end)::public.inventory_movement_type,
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

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'user_roles', 'categories', 'products', 'product_variants',
    'product_images', 'customers', 'customer_addresses', 'orders', 'order_items',
    'inventory_movements', 'events', 'event_rsvps', 'event_gallery',
    'newsletter_subscribers', 'wishlists', 'audit_logs'
  ] loop
    execute format('drop policy "Administrators have full access" on public.%I', table_name);
  end loop;
end;
$$;

drop policy "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or public.is_admin());

drop policy "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id or public.is_admin())
with check ((select auth.uid()) = id or public.is_admin());

drop policy "Users can read their own roles" on public.user_roles;
create policy "Users can read their own roles"
on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

drop policy "Anyone can read active categories" on public.categories;
create policy "Anyone can read active categories"
on public.categories for select to anon
using (is_active);

create policy "Authenticated users can read permitted categories"
on public.categories for select to authenticated
using (is_active or public.is_admin());

drop policy "Anyone can read public products" on public.products;
create policy "Anyone can read public products"
on public.products for select to anon
using (status in ('available', 'sold_out', 'coming_soon'));

create policy "Authenticated users can read permitted products"
on public.products for select to authenticated
using (status in ('available', 'sold_out', 'coming_soon') or public.is_admin());

drop policy "Anyone can read active public variants" on public.product_variants;
create policy "Anyone can read active public variants"
on public.product_variants for select to anon
using (
  is_active
  and exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.status in ('available', 'sold_out', 'coming_soon')
  )
);

create policy "Authenticated users can read permitted variants"
on public.product_variants for select to authenticated
using (
  public.is_admin()
  or (
    is_active
    and exists (
      select 1 from public.products
      where products.id = product_variants.product_id
        and products.status in ('available', 'sold_out', 'coming_soon')
    )
  )
);

drop policy "Anyone can read public product images" on public.product_images;
create policy "Anyone can read public product images"
on public.product_images for select to anon
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status in ('available', 'sold_out', 'coming_soon')
  )
);

create policy "Authenticated users can read permitted product images"
on public.product_images for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status in ('available', 'sold_out', 'coming_soon')
  )
);

drop policy "Customers can read their own customer record" on public.customers;
create policy "Customers can read their own customer record"
on public.customers for select to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

drop policy "Customers can update their own customer record" on public.customers;
create policy "Customers can update their own customer record"
on public.customers for update to authenticated
using ((select auth.uid()) = user_id or public.is_admin())
with check ((select auth.uid()) = user_id or public.is_admin());

drop policy "Customers can manage their own addresses" on public.customer_addresses;
create policy "Customers can manage their own addresses"
on public.customer_addresses for all to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.user_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.user_id = (select auth.uid())
  )
);

drop policy "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
on public.orders for select to authenticated
using ((select auth.uid()) = customer_user_id or public.is_admin());

drop policy "Customers can read their own order items" on public.order_items;
create policy "Customers can read their own order items"
on public.order_items for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.customer_user_id = (select auth.uid())
  )
);

drop policy "Anyone can read public events" on public.events;
create policy "Anyone can read public events"
on public.events for select to anon
using (status <> 'cancelled');

create policy "Authenticated users can read permitted events"
on public.events for select to authenticated
using (status <> 'cancelled' or public.is_admin());

drop policy "Anyone can read public event galleries" on public.event_gallery;
create policy "Anyone can read public event galleries"
on public.event_gallery for select to anon
using (
  exists (
    select 1 from public.events
    where events.id = event_gallery.event_id
      and events.status <> 'cancelled'
  )
);

create policy "Authenticated users can read permitted event galleries"
on public.event_gallery for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.events
    where events.id = event_gallery.event_id
      and events.status <> 'cancelled'
  )
);

drop policy "Customers can manage their own wishlist" on public.wishlists;
create policy "Customers can manage their own wishlist"
on public.wishlists for all to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.customers
    where customers.id = wishlists.customer_id
      and customers.user_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.customers
    where customers.id = wishlists.customer_id
      and customers.user_id = (select auth.uid())
  )
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_roles', 'categories', 'products', 'product_variants', 'product_images',
    'orders', 'order_items', 'events', 'event_gallery'
  ] loop
    execute format(
      'create policy "Administrators can insert" on public.%I for insert to authenticated with check (public.is_admin())',
      table_name
    );
    execute format(
      'create policy "Administrators can update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      table_name
    );
    execute format(
      'create policy "Administrators can delete" on public.%I for delete to authenticated using (public.is_admin())',
      table_name
    );
  end loop;
end;
$$;

create policy "Administrators can insert" on public.profiles
for insert to authenticated with check (public.is_admin());
create policy "Administrators can delete" on public.profiles
for delete to authenticated using (public.is_admin());

create policy "Administrators can insert" on public.customers
for insert to authenticated with check (public.is_admin());
create policy "Administrators can delete" on public.customers
for delete to authenticated using (public.is_admin());

create policy "Administrators have full access" on public.inventory_movements
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Administrators have full access" on public.event_rsvps
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Administrators have full access" on public.newsletter_subscribers
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Administrators have full access" on public.audit_logs
for all to authenticated using (public.is_admin()) with check (public.is_admin());
