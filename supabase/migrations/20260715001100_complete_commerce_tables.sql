-- 20260715001100_complete_commerce_tables.sql
-- Completes the schema for carts, order_status_history, and payment_records

-------------------------------------------------------------------------------
-- 1. Server-Persistent Carts
-------------------------------------------------------------------------------

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (
    (customer_id is not null and session_id is null) or 
    (customer_id is null and session_id is not null)
  )
);

create unique index idx_carts_customer on public.carts(customer_id) where customer_id is not null;
create unique index idx_carts_session on public.carts(session_id) where session_id is not null;

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete cascade not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, variant_id)
);

-- Enable RLS for carts
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Customers can view/manage their own carts
create policy "Customers can manage their own cart" on public.carts
  for all to authenticated
  using (customer_id in (select id from public.customers where user_id = auth.uid()));

create policy "Customers can manage their own cart items" on public.cart_items
  for all to authenticated
  using (cart_id in (
    select id from public.carts 
    where customer_id in (select id from public.customers where user_id = auth.uid())
  ));

-- Admins can view/manage all carts
create policy "Administrators have full access to carts" on public.carts
  for all to authenticated
  using (public.is_admin());

create policy "Administrators have full access to cart items" on public.cart_items
  for all to authenticated
  using (public.is_admin());

-------------------------------------------------------------------------------
-- 2. Order Status History
-------------------------------------------------------------------------------

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id bigint references public.orders(id) on delete cascade not null,
  status public.order_status not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.order_status_history enable row level security;

-- Customers can view their own order history
create policy "Customers can read their own order history" on public.order_status_history
  for select to authenticated
  using (order_id in (select id from public.orders where customer_id in (select id from public.customers where user_id = auth.uid())));

-- Admins have full access
create policy "Administrators have full access to order history" on public.order_status_history
  for all to authenticated
  using (public.is_admin());

-------------------------------------------------------------------------------
-- 3. Payment Records
-------------------------------------------------------------------------------

create table public.payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id bigint references public.orders(id) on delete restrict not null,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'PHP',
  payment_method text not null check (payment_method in ('cod', 'gcash', 'bank')),
  payment_status public.payment_status not null,
  reference_number text,
  metadata jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_records enable row level security;

-- Customers can view their own payment records
create policy "Customers can read their own payment records" on public.payment_records
  for select to authenticated
  using (order_id in (select id from public.orders where customer_id in (select id from public.customers where user_id = auth.uid())));

-- Admins have full access
create policy "Administrators have full access to payment records" on public.payment_records
  for all to authenticated
  using (public.is_admin());

-------------------------------------------------------------------------------
-- 4. Set missing defaults & updated_at triggers
-------------------------------------------------------------------------------

create trigger update_carts_updated_at
  before update on public.carts
  for each row execute function update_updated_at_column();

create trigger update_cart_items_updated_at
  before update on public.cart_items
  for each row execute function update_updated_at_column();

create trigger update_payment_records_updated_at
  before update on public.payment_records
  for each row execute function update_updated_at_column();
