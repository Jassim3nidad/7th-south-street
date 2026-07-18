create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_email text;
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_phone text;
  v_owned_customer_id bigint;
  v_email_customer_id bigint;
  v_email_customer_user_id uuid;
begin
  v_email := nullif(lower(btrim(coalesce(new.email, ''))), '');
  v_first_name := nullif(left(
    regexp_replace(btrim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), '[[:space:]]+', ' ', 'g'),
    100
  ), '');
  v_last_name := nullif(left(
    regexp_replace(btrim(coalesce(new.raw_user_meta_data ->> 'last_name', '')), '[[:space:]]+', ' ', 'g'),
    100
  ), '');
  v_full_name := nullif(left(
    regexp_replace(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '[[:space:]]+', ' ', 'g'),
    201
  ), '');
  v_phone := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), 32), '');

  if v_first_name is null and v_full_name is not null then
    v_first_name := left(split_part(v_full_name, ' ', 1), 100);
  end if;

  if v_last_name is null and v_full_name is not null and strpos(v_full_name, ' ') > 0 then
    v_last_name := nullif(left(btrim(substr(v_full_name, strpos(v_full_name, ' ') + 1)), 100), '');
  end if;

  if v_full_name is null then
    v_full_name := nullif(left(concat_ws(' ', v_first_name, v_last_name), 201), '');
  end if;

  insert into public.profiles (id, full_name, email, phone)
  values (new.id, v_full_name, v_email, v_phone)
  on conflict (id) do update
  set full_name = coalesce(excluded.full_name, profiles.full_name),
      email = excluded.email,
      phone = coalesce(excluded.phone, profiles.phone);

  -- User-supplied metadata is intentionally never consulted for authorization.
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer'::public.app_role)
  on conflict (user_id, role) do nothing;

  -- Phone-only identities can still have a profile and fixed customer role, but the
  -- commerce customer table requires a normalized email address.
  if v_email is null then
    return new;
  end if;

  select id
  into v_owned_customer_id
  from public.customers
  where user_id = new.id;

  select id, user_id
  into v_email_customer_id, v_email_customer_user_id
  from public.customers
  where lower(email) = v_email;

  if v_owned_customer_id is not null then
    if v_email_customer_id is null or v_email_customer_id = v_owned_customer_id then
      update public.customers
      set first_name = coalesce(v_first_name, first_name),
          last_name = coalesce(v_last_name, last_name),
          email = v_email,
          phone = coalesce(v_phone, phone),
          email_verified_at = new.email_confirmed_at
      where id = v_owned_customer_id;
    else
      -- A conflicting commerce email is never merged or reassigned implicitly.
      -- Keep the existing identity fields while still accepting safe display updates.
      update public.customers
      set first_name = coalesce(v_first_name, first_name),
          last_name = coalesce(v_last_name, last_name),
          phone = coalesce(v_phone, phone)
      where id = v_owned_customer_id;
    end if;
  elsif v_email_customer_id is null then
    insert into public.customers (
      user_id,
      first_name,
      last_name,
      email,
      phone,
      email_verified_at
    )
    values (
      new.id,
      coalesce(v_first_name, 'Customer'),
      coalesce(v_last_name, ''),
      v_email,
      v_phone,
      new.email_confirmed_at
    )
    on conflict do nothing
    returning id into v_owned_customer_id;

    -- If a concurrent import inserted the same unowned email after the lookup,
    -- a confirmed Auth identity may still claim it under the same strict rule.
    if v_owned_customer_id is null and new.email_confirmed_at is not null then
      update public.customers
      set user_id = new.id,
          first_name = coalesce(v_first_name, first_name),
          last_name = coalesce(v_last_name, last_name),
          phone = coalesce(v_phone, phone),
          email_verified_at = new.email_confirmed_at
      where lower(email) = v_email
        and user_id is null;
    end if;
  elsif v_email_customer_user_id is null and new.email_confirmed_at is not null then
    -- An imported/guest customer may be claimed only after Supabase has verified
    -- ownership of the matching email address. Rows owned by another UUID are never moved.
    update public.customers
    set user_id = new.id,
        first_name = coalesce(v_first_name, first_name),
        last_name = coalesce(v_last_name, last_name),
        phone = coalesce(v_phone, phone),
        email_verified_at = new.email_confirmed_at
    where id = v_email_customer_id
      and user_id is null;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, email_confirmed_at, raw_user_meta_data on auth.users
  for each row execute function private.handle_new_auth_user();

comment on function private.handle_new_auth_user() is
  'Provisions and synchronizes non-privileged customer identity records from Supabase Auth. Authorization metadata is ignored.';

create or replace function private.protect_profile_auth_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
declare
  v_request_user_id uuid := auth.uid();
begin
  if new.email is not distinct from old.email then
    return new;
  end if;

  -- Database maintenance/service operations do not carry an end-user auth.uid().
  if v_request_user_id is null or private.is_current_user_admin() then
    return new;
  end if;

  -- Only the nested auth.users synchronization path may change the email, and
  -- only to the email currently owned by that same Auth identity.
  if pg_trigger_depth() > 1
     and exists (
       select 1
       from auth.users
       where id = new.id
         and lower(email) = lower(new.email)
     ) then
    return new;
  end if;

  raise insufficient_privilege
    using message = 'Profile email can only be changed through Supabase Auth';
end;
$$;

revoke all on function private.protect_profile_auth_email() from public, anon, authenticated;

drop trigger if exists protect_profile_auth_email on public.profiles;
create trigger protect_profile_auth_email
  before update of email on public.profiles
  for each row execute function private.protect_profile_auth_email();

comment on function private.protect_profile_auth_email() is
  'Keeps customer-editable profile data from overriding the Auth-verified email identity.';

create or replace function private.protect_customer_auth_identity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private, public
as $$
declare
  v_request_user_id uuid := auth.uid();
  v_auth_user_exists boolean := false;
  v_auth_confirmed_at timestamptz;
begin
  if tg_op = 'UPDATE' then
    if new.user_id is not distinct from old.user_id
       and new.email is not distinct from old.email
       and new.email_verified_at is not distinct from old.email_verified_at then
      return new;
    end if;
  end if;

  -- Database maintenance/service operations do not carry an end-user auth.uid().
  if v_request_user_id is null or private.is_current_user_admin() then
    return new;
  end if;

  select true, email_confirmed_at
  into v_auth_user_exists, v_auth_confirmed_at
  from auth.users
  where id = new.user_id
    and lower(email) = lower(new.email);

  -- Nested writes are accepted only when every identity value exactly mirrors
  -- auth.users, avoiding a broad trigger-depth bypass.
  if pg_trigger_depth() > 1
     and v_auth_user_exists
     and new.email_verified_at is not distinct from v_auth_confirmed_at then
    return new;
  end if;

  -- Preserve authenticated checkout customer creation/linking only when the
  -- current user has a confirmed matching Auth email. Carry that confirmation
  -- timestamp into the commerce identity row.
  if new.user_id = v_request_user_id and v_auth_confirmed_at is not null then
    if tg_op = 'INSERT' then
      new.email_verified_at := v_auth_confirmed_at;
      return new;
    end if;

    if tg_op = 'UPDATE' then
      if old.user_id is null and new.email is not distinct from old.email then
        new.email_verified_at := v_auth_confirmed_at;
        return new;
      end if;
    end if;
  end if;

  raise insufficient_privilege
    using message = 'Customer authentication identity fields can only be changed through Supabase Auth';
end;
$$;

revoke all on function private.protect_customer_auth_identity() from public, anon, authenticated;

drop trigger if exists protect_customer_auth_identity on public.customers;
create trigger protect_customer_auth_identity
  before insert or update of user_id, email, email_verified_at on public.customers
  for each row execute function private.protect_customer_auth_identity();

comment on function private.protect_customer_auth_identity() is
  'Prevents authenticated customers from forging Auth-backed customer identity and verification fields while retaining verified guest checkout linking.';
