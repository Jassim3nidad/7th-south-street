-- Restore security definer boundary for create_order
drop function if exists private.create_order_impl(jsonb, jsonb, jsonb, text, text, uuid);
alter function public.create_order(jsonb, jsonb, jsonb, text, text, uuid) set schema private;
alter function private.create_order(jsonb, jsonb, jsonb, text, text, uuid) rename to create_order_impl;
revoke all on function private.create_order_impl(jsonb, jsonb, jsonb, text, text, uuid) from public;
grant execute on function private.create_order_impl(jsonb, jsonb, jsonb, text, text, uuid) to anon, authenticated, service_role;

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
set search_path = pg_catalog, public
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
grant execute on function public.create_order(jsonb, jsonb, jsonb, text, text, uuid) to anon, authenticated, service_role;

-- Also move check_rate_limit to private schema to keep public clean of security definers
alter function public.check_rate_limit(text, text, integer, integer) set schema private;
alter function private.check_rate_limit(text, text, integer, integer) rename to check_rate_limit_impl;
revoke all on function private.check_rate_limit_impl(text, text, integer, integer) from public;
grant execute on function private.check_rate_limit_impl(text, text, integer, integer) to anon, authenticated, service_role;

create function public.check_rate_limit(
  p_ip_hash text,
  p_endpoint text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language sql
security invoker
set search_path = pg_catalog, public
as $$
  select private.check_rate_limit_impl(p_ip_hash, p_endpoint, p_limit, p_window_seconds);
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, text, integer, integer) to anon, authenticated, service_role;

-- Restore security definer boundary for rsvp_event
drop function if exists private.rsvp_event_impl(bigint, text, text, text);
alter function public.rsvp_event(bigint, text, text, text) set schema private;
alter function private.rsvp_event(bigint, text, text, text) rename to rsvp_event_impl;
revoke all on function private.rsvp_event_impl(bigint, text, text, text) from public;
grant execute on function private.rsvp_event_impl(bigint, text, text, text) to anon, authenticated, service_role;

create function public.rsvp_event(
  p_event_id bigint,
  p_name text,
  p_email text,
  p_phone text
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, public
as $$
  select private.rsvp_event_impl(p_event_id, p_name, p_email, p_phone);
$$;

revoke all on function public.rsvp_event(bigint, text, text, text) from public;
grant execute on function public.rsvp_event(bigint, text, text, text) to anon, authenticated, service_role;

-- Grant permissions for missing tables
grant select, insert, update, delete on public.carts to anon, authenticated, service_role;
grant select, insert, update, delete on public.cart_items to anon, authenticated, service_role;
grant select, insert, update, delete on public.order_status_history to anon, authenticated, service_role;
grant select, insert, update, delete on public.payment_records to anon, authenticated, service_role;
