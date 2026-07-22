-- Transactional Email Logs for Idempotency and Auditing

create table public.transactional_email_logs (
    id uuid primary key default gen_random_uuid(),
    idempotency_key text unique not null,
    recipient_email text not null,
    template_name text not null,
    subject text not null,
    status text not null check (status in ('pending', 'sent', 'failed')),
    error_message text,
    created_at timestamptz not null default now(),
    sent_at timestamptz,
    updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.transactional_email_logs enable row level security;

-- Policies
create policy "Admins can view email logs" on public.transactional_email_logs
for select to authenticated
using (public.is_admin());

create policy "Service role can manage email logs" on public.transactional_email_logs
for all to service_role
using (true)
with check (true);

-- Revoke public access
revoke all on table public.transactional_email_logs from anon, authenticated;
grant select on table public.transactional_email_logs to authenticated;
grant all on table public.transactional_email_logs to service_role;

-- Function for attempting email tracking
create or replace function public.log_transactional_email(
  p_idempotency_key text,
  p_recipient_email text,
  p_template_name text,
  p_subject text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_log public.transactional_email_logs%rowtype;
begin
  if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
    raise exception 'An idempotency key is required' using errcode = '22023';
  end if;

  insert into public.transactional_email_logs (
    idempotency_key, recipient_email, template_name, subject, status
  ) values (
    p_idempotency_key, p_recipient_email, p_template_name, p_subject, 'pending'
  )
  on conflict (idempotency_key) do nothing
  returning * into v_log;

  -- If it wasn't inserted, it already exists. We should fetch it.
  if v_log.id is null then
    select * into v_log
    from public.transactional_email_logs
    where idempotency_key = p_idempotency_key;

    if v_log.status = 'sent' then
      return jsonb_build_object('allowed', false, 'reason', 'Already sent', 'log_id', v_log.id);
    end if;

    -- If pending or failed, we allow a retry.
    return jsonb_build_object('allowed', true, 'log_id', v_log.id);
  end if;

  return jsonb_build_object('allowed', true, 'log_id', v_log.id);
end;
$$;

revoke all on function public.log_transactional_email(text, text, text, text) from public;
grant execute on function public.log_transactional_email(text, text, text, text) to service_role;

-- Function for marking email as sent or failed
create or replace function public.update_transactional_email_status(
  p_log_id uuid,
  p_status text,
  p_error_message text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.transactional_email_logs
  set status = p_status,
      error_message = p_error_message,
      sent_at = case when p_status = 'sent' then now() else sent_at end,
      updated_at = now()
  where id = p_log_id;
end;
$$;

revoke all on function public.update_transactional_email_status(uuid, text, text) from public;
grant execute on function public.update_transactional_email_status(uuid, text, text) to service_role;
