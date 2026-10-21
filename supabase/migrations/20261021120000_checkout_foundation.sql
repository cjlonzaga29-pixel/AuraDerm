-- AuraDerm checkout foundation (additive only).
--
-- Target: Supabase project brrydhnpwkfejehksdkn (AuraDerm). Never apply this
-- to any other project.
--
-- Everything here is server-only: RLS is enabled with no policies and the
-- anon/authenticated roles get no table or function privileges, so the public
-- API key can neither list nor create orders. The Next.js server reaches these
-- objects with the service-role key through the RPC functions below.
--
-- Prices are always written by the server from its own catalog; order_items
-- rows are immutable snapshots of what was sold at that moment.

create extension if not exists pgcrypto;

-- Orders ---------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Human-facing reference, e.g. AD-T-7K3M9Q2X (T = test, L = live).
  reference text not null unique,
  -- Client-generated key: one checkout attempt creates at most one order.
  idempotency_key text not null unique,
  -- Hash of the normalized request; a reused key with a different request is
  -- rejected instead of silently returning the other order.
  request_hash text not null,
  -- sha256 of the order-status token handed to the customer's browser.
  access_token_hash text not null,
  mode text not null check (mode in ('test', 'live')),
  currency text not null check (currency = 'PHP'),
  subtotal_minor integer not null check (subtotal_minor > 0),
  -- null = no delivery pricing rule configured (only allowed in test mode).
  shipping_minor integer check (shipping_minor is null or shipping_minor >= 0),
  total_minor integer not null check (total_minor > 0),
  -- true while any line uses an owner-authorized sample price.
  uses_sample_prices boolean not null,

  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  delivery_address jsonb not null,

  payment_method text not null check (payment_method in ('online', 'cod')),
  payment_status text not null check (payment_status in (
    'awaiting_payment',      -- online: session pending or not yet paid
    'session_failed',        -- online: provider session could not be created
    'paid',                  -- online: verified by webhook / API reconciliation
    'cod_pending',           -- COD: unpaid, awaiting owner confirmation
    'cod_collected',         -- COD: cash received on delivery
    'cancelled',
    'refunded'
  )),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in (
    'unfulfilled', 'awaiting_confirmation', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'
  )),
  sheet_sync_status text not null default 'not_required' check (sheet_sync_status in (
    'not_required', 'pending', 'synced', 'failed'
  )),

  provider text check (provider is null or provider = 'paymongo'),
  provider_session_id text unique,
  provider_payment_id text,
  paid_at timestamptz,

  -- Salted hash of the client address, used only for submission limits.
  client_fingerprint text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_total_matches check (total_minor = subtotal_minor + coalesce(shipping_minor, 0)),
  -- Live orders need a configured delivery price and real prices.
  constraint orders_live_requires_pricing check (
    mode = 'test' or (shipping_minor is not null and not uses_sample_prices)
  ),
  constraint orders_paid_has_timestamp check (payment_status <> 'paid' or paid_at is not null)
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_fingerprint_idx on public.orders (client_fingerprint, created_at desc);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete restrict,
  line_number smallint not null check (line_number between 1 and 20),
  product_handle text not null,
  product_name text not null,
  price_kind text not null check (price_kind in ('confirmed', 'sample')),
  unit_price_minor integer not null check (unit_price_minor > 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total_minor integer not null,
  currency text not null check (currency = 'PHP'),
  created_at timestamptz not null default now(),
  unique (order_id, line_number),
  unique (order_id, product_handle),
  constraint order_items_line_total check (line_total_minor = unit_price_minor * quantity)
);

-- Item snapshots are immutable once written.
create or replace function public.prevent_order_item_change() returns trigger
language plpgsql as $$
begin
  raise exception 'order_items are immutable snapshots';
end;
$$;

drop trigger if exists order_items_immutable on public.order_items;
create trigger order_items_immutable
  before update or delete on public.order_items
  for each row execute function public.prevent_order_item_change();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- Payment provider events ------------------------------------------------------

-- One row per provider event id: repeated webhook deliveries are no-ops.
-- Only non-personal fields are stored (no billing name/email/phone).
create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  provider text not null check (provider = 'paymongo'),
  provider_event_id text not null,
  event_type text not null,
  livemode boolean not null,
  provider_session_id text,
  order_id uuid references public.orders (id) on delete restrict,
  outcome text not null default 'received' check (outcome in (
    'received', 'applied', 'ignored', 'rejected'
  )),
  outcome_detail text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

-- Google Sheets outbox ---------------------------------------------------------

-- Durable queue: written in the same transaction as a COD order, so an accepted
-- order is never lost even if the sheet is unreachable.
create table if not exists public.sheet_sync_outbox (
  id bigint generated always as identity primary key,
  order_id uuid not null unique references public.orders (id) on delete restrict,
  mode text not null check (mode in ('test', 'live')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'synced', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  synced_range text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sheet_sync_outbox_due_idx
  on public.sheet_sync_outbox (status, next_attempt_at);

drop trigger if exists sheet_sync_outbox_touch on public.sheet_sync_outbox;
create trigger sheet_sync_outbox_touch
  before update on public.sheet_sync_outbox
  for each row execute function public.touch_updated_at();

-- Sold counts -----------------------------------------------------------------

-- Units that count as sold: live orders only (never test orders), paid online
-- or COD collected/delivered, excluding cancelled, refunded or returned orders.
-- No storefront component reads this yet; it documents the semantics.
create or replace view public.product_sold_units
with (security_invoker = true) as
select
  i.product_handle,
  sum(i.quantity)::integer as units
from public.order_items i
join public.orders o on o.id = i.order_id
where o.mode = 'live'
  and o.payment_status not in ('cancelled', 'refunded')
  and o.fulfillment_status not in ('cancelled', 'returned')
  and (
    (o.payment_method = 'online' and o.payment_status = 'paid')
    or (o.payment_method = 'cod' and (o.payment_status = 'cod_collected' or o.fulfillment_status = 'delivered'))
  )
group by i.product_handle;

-- Row level security: no policies, so only the service role can read/write.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;
alter table public.sheet_sync_outbox enable row level security;

revoke all on public.orders, public.order_items, public.payment_events, public.sheet_sync_outbox
  from anon, authenticated;
revoke all on public.product_sold_units from anon, authenticated;

-- RPC: create order ------------------------------------------------------------

-- Atomic, idempotent order creation. Returns the order row plus
-- `created` (false when the idempotency key already existed).
create or replace function public.checkout_create_order(
  p_order jsonb,
  p_items jsonb,
  p_rate_limit integer default 5,
  p_rate_window_seconds integer default 600
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_existing public.orders;
  v_order public.orders;
  v_recent integer;
  v_item jsonb;
  v_line smallint := 0;
begin
  select * into v_existing from public.orders where idempotency_key = p_order->>'idempotency_key';
  if found then
    if v_existing.request_hash <> p_order->>'request_hash' then
      return jsonb_build_object('error', 'idempotency_conflict');
    end if;
    return jsonb_build_object('created', false, 'order', to_jsonb(v_existing) - 'access_token_hash' - 'request_hash' - 'client_fingerprint');
  end if;

  if p_order->>'client_fingerprint' is not null then
    select count(*) into v_recent from public.orders
      where client_fingerprint = p_order->>'client_fingerprint'
        and created_at > now() - make_interval(secs => p_rate_window_seconds);
    if v_recent >= p_rate_limit then
      return jsonb_build_object('error', 'rate_limited');
    end if;
  end if;

  insert into public.orders (
    reference, idempotency_key, request_hash, access_token_hash, mode, currency,
    subtotal_minor, shipping_minor, total_minor, uses_sample_prices,
    customer_name, customer_phone, customer_email, delivery_address,
    payment_method, payment_status, fulfillment_status, sheet_sync_status,
    provider, client_fingerprint
  ) values (
    p_order->>'reference', p_order->>'idempotency_key', p_order->>'request_hash',
    p_order->>'access_token_hash', p_order->>'mode', p_order->>'currency',
    (p_order->>'subtotal_minor')::integer, (p_order->>'shipping_minor')::integer,
    (p_order->>'total_minor')::integer, (p_order->>'uses_sample_prices')::boolean,
    p_order->>'customer_name', p_order->>'customer_phone', p_order->>'customer_email',
    p_order->'delivery_address',
    p_order->>'payment_method', p_order->>'payment_status',
    coalesce(p_order->>'fulfillment_status', 'unfulfilled'),
    case when p_order->>'payment_method' = 'cod' then 'pending' else 'not_required' end,
    case when p_order->>'payment_method' = 'online' then 'paymongo' else null end,
    p_order->>'client_fingerprint'
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_line := v_line + 1;
    insert into public.order_items (
      order_id, line_number, product_handle, product_name, price_kind,
      unit_price_minor, quantity, line_total_minor, currency
    ) values (
      v_order.id, v_line, v_item->>'product_handle', v_item->>'product_name',
      v_item->>'price_kind', (v_item->>'unit_price_minor')::integer,
      (v_item->>'quantity')::integer, (v_item->>'line_total_minor')::integer,
      v_item->>'currency'
    );
  end loop;

  if v_order.payment_method = 'cod' then
    insert into public.sheet_sync_outbox (order_id, mode) values (v_order.id, v_order.mode);
  end if;

  return jsonb_build_object('created', true, 'order', to_jsonb(v_order) - 'access_token_hash' - 'request_hash' - 'client_fingerprint');
end;
$$;

-- RPC: attach a provider checkout session --------------------------------------

create or replace function public.checkout_attach_session(
  p_order_id uuid,
  p_session_id text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order public.orders;
begin
  update public.orders
     set provider_session_id = p_session_id,
         payment_status = case when payment_status = 'session_failed' then 'awaiting_payment' else payment_status end
   where id = p_order_id
     and payment_method = 'online'
     and (provider_session_id is null or provider_session_id = p_session_id)
  returning * into v_order;
  if not found then
    return jsonb_build_object('error', 'not_attachable');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.checkout_mark_session_failed(p_order_id uuid) returns void
language sql
set search_path = public
as $$
  update public.orders
     set payment_status = 'session_failed'
   where id = p_order_id and payment_method = 'online'
     and payment_status = 'awaiting_payment' and provider_session_id is null;
$$;

-- RPC: record a provider event (deduplicated) -----------------------------------

-- Returns {"duplicate": true} if this event id was already fully processed.
-- An event still marked 'received' (processing was interrupted) is handed back
-- for another attempt; every downstream step is idempotent.
create or replace function public.checkout_record_event(
  p_provider_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_session_id text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_id bigint;
  v_outcome text;
begin
  insert into public.payment_events (provider, provider_event_id, event_type, livemode, provider_session_id)
  values ('paymongo', p_provider_event_id, p_event_type, p_livemode, p_session_id)
  on conflict (provider, provider_event_id) do nothing
  returning id into v_id;
  if v_id is null then
    select outcome into v_outcome from public.payment_events
     where provider = 'paymongo' and provider_event_id = p_provider_event_id;
    return jsonb_build_object('duplicate', v_outcome <> 'received');
  end if;
  return jsonb_build_object('duplicate', false);
end;
$$;

create or replace function public.checkout_finish_event(
  p_provider_event_id text,
  p_order_id uuid,
  p_outcome text,
  p_detail text
) returns void
language sql
set search_path = public
as $$
  update public.payment_events
     set order_id = p_order_id, outcome = p_outcome, outcome_detail = left(p_detail, 500), processed_at = now()
   where provider = 'paymongo' and provider_event_id = p_provider_event_id;
$$;

-- RPC: mark paid (idempotent, guarded) ------------------------------------------

-- Only an online order awaiting payment, in the expected mode, with a matching
-- session, reference, amount and currency can become paid. Re-applying is a
-- no-op.
create or replace function public.checkout_mark_paid(
  p_session_id text,
  p_reference text,
  p_mode text,
  p_amount_minor integer,
  p_currency text,
  p_payment_id text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where provider_session_id = p_session_id for update;
  if not found then
    return jsonb_build_object('result', 'unknown_session');
  end if;
  if v_order.payment_status = 'paid' then
    return jsonb_build_object('result', 'already_paid', 'order_id', v_order.id);
  end if;
  if v_order.reference <> p_reference then
    return jsonb_build_object('result', 'reference_mismatch', 'order_id', v_order.id);
  end if;
  if v_order.mode <> p_mode then
    return jsonb_build_object('result', 'mode_mismatch', 'order_id', v_order.id);
  end if;
  if v_order.total_minor <> p_amount_minor or v_order.currency <> p_currency then
    return jsonb_build_object('result', 'amount_mismatch', 'order_id', v_order.id);
  end if;
  if v_order.payment_status not in ('awaiting_payment', 'session_failed') then
    return jsonb_build_object('result', 'not_payable', 'order_id', v_order.id);
  end if;
  update public.orders
     set payment_status = 'paid', paid_at = now(), provider_payment_id = p_payment_id
   where id = v_order.id;
  return jsonb_build_object('result', 'marked_paid', 'order_id', v_order.id);
end;
$$;

-- RPC: order status for the customer's own browser -------------------------------

create or replace function public.checkout_order_status(
  p_reference text,
  p_access_token_hash text
) returns jsonb
language sql
set search_path = public
as $$
  select jsonb_build_object(
    'id', id, 'reference', reference, 'mode', mode, 'payment_method', payment_method,
    'payment_status', payment_status, 'fulfillment_status', fulfillment_status,
    'subtotal_minor', subtotal_minor, 'shipping_minor', shipping_minor,
    'total_minor', total_minor, 'currency', currency,
    'sheet_sync_status', sheet_sync_status, 'created_at', created_at,
    'provider_session_id', provider_session_id
  )
  from public.orders
  where reference = p_reference and access_token_hash = p_access_token_hash;
$$;

-- RPC: Sheets outbox -------------------------------------------------------------

-- Claims up to p_limit due jobs with a lease, so concurrent workers never sync
-- the same order at the same time.
create or replace function public.sheet_sync_claim(p_limit integer default 10, p_lease_seconds integer default 120)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_rows jsonb;
begin
  with due as (
    select id from public.sheet_sync_outbox
     where status in ('pending', 'failed', 'processing')
       and next_attempt_at <= now()
       and (locked_until is null or locked_until < now())
       and attempts < 20
     order by next_attempt_at
     limit p_limit
     for update skip locked
  ), claimed as (
    update public.sheet_sync_outbox s
       set status = 'processing', attempts = s.attempts + 1,
           locked_until = now() + make_interval(secs => p_lease_seconds)
      from due where s.id = due.id
    returning s.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'job_id', c.id,
    'attempts', c.attempts,
    'order', to_jsonb(o) - 'access_token_hash' - 'request_hash' - 'client_fingerprint',
    'items', (select jsonb_agg(to_jsonb(i) order by i.line_number) from public.order_items i where i.order_id = o.id)
  )), '[]'::jsonb) into v_rows
  from claimed c join public.orders o on o.id = c.order_id;
  return v_rows;
end;
$$;

create or replace function public.sheet_sync_complete(p_job_id bigint, p_range text) returns void
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  update public.sheet_sync_outbox
     set status = 'synced', synced_range = p_range, locked_until = null, last_error = null
   where id = p_job_id
  returning order_id into v_order_id;
  update public.orders set sheet_sync_status = 'synced' where id = v_order_id;
end;
$$;

create or replace function public.sheet_sync_fail(p_job_id bigint, p_error text) returns void
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid;
  v_attempts integer;
begin
  update public.sheet_sync_outbox
     set status = 'failed', locked_until = null, last_error = left(p_error, 500),
         next_attempt_at = now() + make_interval(secs => least(3600, 30 * power(2, attempts)::integer))
   where id = p_job_id
  returning order_id, attempts into v_order_id, v_attempts;
  update public.orders set sheet_sync_status = 'failed' where id = v_order_id;
end;
$$;

-- Function privileges: service role only.
revoke all on function public.checkout_create_order(jsonb, jsonb, integer, integer) from public, anon, authenticated;
revoke all on function public.checkout_attach_session(uuid, text) from public, anon, authenticated;
revoke all on function public.checkout_mark_session_failed(uuid) from public, anon, authenticated;
revoke all on function public.checkout_record_event(text, text, boolean, text) from public, anon, authenticated;
revoke all on function public.checkout_finish_event(text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.checkout_mark_paid(text, text, text, integer, text, text) from public, anon, authenticated;
revoke all on function public.checkout_order_status(text, text) from public, anon, authenticated;
revoke all on function public.sheet_sync_claim(integer, integer) from public, anon, authenticated;
revoke all on function public.sheet_sync_complete(bigint, text) from public, anon, authenticated;
revoke all on function public.sheet_sync_fail(bigint, text) from public, anon, authenticated;
revoke all on function public.prevent_order_item_change() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

grant execute on function public.checkout_create_order(jsonb, jsonb, integer, integer) to service_role;
grant execute on function public.checkout_attach_session(uuid, text) to service_role;
grant execute on function public.checkout_mark_session_failed(uuid) to service_role;
grant execute on function public.checkout_record_event(text, text, boolean, text) to service_role;
grant execute on function public.checkout_finish_event(text, uuid, text, text) to service_role;
grant execute on function public.checkout_mark_paid(text, text, text, integer, text, text) to service_role;
grant execute on function public.checkout_order_status(text, text) to service_role;
grant execute on function public.sheet_sync_claim(integer, integer) to service_role;
grant execute on function public.sheet_sync_complete(bigint, text) to service_role;
grant execute on function public.sheet_sync_fail(bigint, text) to service_role;
