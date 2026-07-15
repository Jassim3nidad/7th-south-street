grant usage on schema private to anon, authenticated, service_role;

create or replace function private.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'::public.app_role
  );
$$;

revoke all on function private.is_current_user_admin() from public;
grant execute on function private.is_current_user_admin() to anon, authenticated, service_role;

comment on function private.is_current_user_admin() is
  'Private RLS helper. SECURITY DEFINER avoids recursive user_roles policies and always checks auth.uid(); it is not exposed through the Data API.';

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select private.is_current_user_admin();
$$;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

comment on function public.is_admin(uuid) is
  'Self-scoped SECURITY INVOKER wrapper used by RLS. The compatibility argument is ignored so callers cannot inspect another user role.';

alter function public.create_order(jsonb, jsonb, jsonb, text, text, uuid)
  set schema private;
alter function private.create_order(jsonb, jsonb, jsonb, text, text, uuid)
  rename to create_order_impl;

revoke all on function private.create_order_impl(jsonb, jsonb, jsonb, text, text, uuid) from public;
grant execute on function private.create_order_impl(jsonb, jsonb, jsonb, text, text, uuid)
  to anon, authenticated, service_role;

comment on function private.create_order_impl(jsonb, jsonb, jsonb, text, text, uuid) is
  'Private transactional checkout implementation. It validates variants, locks inventory, ignores client prices, and writes trusted snapshots.';

create function public.create_order(
  p_items jsonb,
  p_customer_information jsonb,
  p_shipping_information jsonb,
  p_payment_method text,
  p_notes text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.create_order_impl(
    p_items,
    p_customer_information,
    p_shipping_information,
    p_payment_method,
    p_notes,
    p_idempotency_key
  );
$$;

revoke all on function public.create_order(jsonb, jsonb, jsonb, text, text, uuid) from public;
grant execute on function public.create_order(jsonb, jsonb, jsonb, text, text, uuid)
  to anon, authenticated, service_role;

comment on function public.create_order(jsonb, jsonb, jsonb, text, text, uuid) is
  'Minimal public checkout boundary. SECURITY INVOKER delegates to a private, fully validating transactional implementation.';

alter function public.rsvp_event(bigint, text, text, text)
  set schema private;
alter function private.rsvp_event(bigint, text, text, text)
  rename to rsvp_event_impl;

revoke all on function private.rsvp_event_impl(bigint, text, text, text) from public;
grant execute on function private.rsvp_event_impl(bigint, text, text, text)
  to anon, authenticated, service_role;

comment on function private.rsvp_event_impl(bigint, text, text, text) is
  'Private RSVP implementation. It validates input, locks event capacity, and makes duplicate email submissions idempotent.';

create function public.rsvp_event(
  p_event_id bigint,
  p_name text,
  p_email text,
  p_phone text
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.rsvp_event_impl(p_event_id, p_name, p_email, p_phone);
$$;

revoke all on function public.rsvp_event(bigint, text, text, text) from public;
grant execute on function public.rsvp_event(bigint, text, text, text)
  to anon, authenticated, service_role;

comment on function public.rsvp_event(bigint, text, text, text) is
  'Minimal public RSVP boundary. SECURITY INVOKER delegates to the private capacity-checked implementation.';
