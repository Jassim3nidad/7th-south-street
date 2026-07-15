create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and role = 'admin'::public.app_role
  );
$$;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    lower(new.email)
  )
  on conflict (id) do update
  set email = excluded.email;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer'::public.app_role)
  on conflict do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

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
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their own roles"
on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Anyone can read active categories"
on public.categories for select to anon, authenticated
using (is_active);

create policy "Anyone can read public products"
on public.products for select to anon, authenticated
using (status in ('available', 'sold_out', 'coming_soon'));

create policy "Anyone can read active public variants"
on public.product_variants for select to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.status in ('available', 'sold_out', 'coming_soon')
  )
);

create policy "Anyone can read public product images"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status in ('available', 'sold_out', 'coming_soon')
  )
);

create policy "Customers can read their own customer record"
on public.customers for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Customers can update their own customer record"
on public.customers for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Customers can manage their own addresses"
on public.customer_addresses for all to authenticated
using (
  exists (
    select 1 from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.user_id = (select auth.uid())
  )
);

create policy "Customers can read their own orders"
on public.orders for select to authenticated
using ((select auth.uid()) = customer_user_id);

create policy "Customers can read their own order items"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.customer_user_id = (select auth.uid())
  )
);

create policy "Anyone can read public events"
on public.events for select to anon, authenticated
using (status <> 'cancelled');

create policy "Anyone can read public event galleries"
on public.event_gallery for select to anon, authenticated
using (
  exists (
    select 1 from public.events
    where events.id = event_gallery.event_id
      and events.status <> 'cancelled'
  )
);

create policy "Customers can manage their own wishlist"
on public.wishlists for all to authenticated
using (
  exists (
    select 1 from public.customers
    where customers.id = wishlists.customer_id
      and customers.user_id = (select auth.uid())
  )
)
with check (
  exists (
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
    'profiles', 'user_roles', 'categories', 'products', 'product_variants',
    'product_images', 'customers', 'customer_addresses', 'orders', 'order_items',
    'inventory_movements', 'events', 'event_rsvps', 'event_gallery',
    'newsletter_subscribers', 'wishlists', 'audit_logs'
  ] loop
    execute format(
      'create policy "Administrators have full access" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      table_name
    );
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories, public.products, public.product_variants,
  public.product_images, public.events, public.event_gallery
to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
