-- CODGuard initial schema + RLS

create extension if not exists "pgcrypto";

create type public.member_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.order_status as enum (
  'pending', 'verified', 'rejected', 'cancelled', 'dispatched', 'delivered', 'rto'
);
create type public.order_source as enum ('manual', 'csv', 'shopify', 'woocommerce');
create type public.integration_provider as enum ('shopify', 'woocommerce', 'whatsapp', 'courier');
create type public.integration_status as enum ('disconnected', 'misconfigured', 'connected', 'degraded');

create table public.plans (
  id text primary key,
  name text not null,
  orders_per_month integer not null,
  whatsapp_messages_per_month integer not null default 0,
  ai_insights_per_month integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.plans (id, name, orders_per_month, whatsapp_messages_per_month, ai_insights_per_month) values
  ('starter', 'Starter', 500, 0, 0),
  ('growth', 'Growth', 5000, 1000, 100),
  ('pro', 'Pro', 50000, 10000, 1000);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Karachi',
  currency text not null default 'PKR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade unique,
  plan_id text not null references public.plans (id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  phone_normalized text not null,
  full_name text,
  created_at timestamptz not null default now(),
  unique (business_id, phone_normalized)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete restrict,
  external_ref text,
  address_line text,
  city text,
  cod_amount numeric(14,2) not null check (cod_amount >= 0),
  currency text not null default 'PKR',
  status public.order_status not null default 'pending',
  source public.order_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_business_created_idx on public.orders (business_id, created_at desc);
create index orders_business_status_idx on public.orders (business_id, status);

create table public.risk_evaluations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  rule_version text not null,
  factors jsonb not null default '[]'::jsonb,
  is_override boolean not null default false,
  override_reason text,
  created_at timestamptz not null default now()
);

create index risk_evaluations_order_idx on public.risk_evaluations (order_id, created_at desc);

create table public.verification_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  token_hash text not null unique,
  action text not null check (action in ('verify', 'cancel')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  provider public.integration_provider not null,
  status public.integration_status not null default 'disconnected',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, provider)
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete cascade,
  provider text not null,
  external_id text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  event_type text not null,
  idempotency_key text not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (business_id, idempotency_key)
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users (id),
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS helpers
create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_memberships m
    where m.business_id = p_business_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_business_role(p_business_id uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_memberships m
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;

alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.subscriptions enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.risk_evaluations enable row level security;
alter table public.verification_tokens enable row level security;
alter table public.integration_connections enable row level security;
alter table public.webhook_events enable row level security;
alter table public.usage_events enable row level security;
alter table public.plans enable row level security;
alter table public.admin_audit_logs enable row level security;

-- plans: read for authenticated
create policy plans_select on public.plans for select to authenticated using (true);

create policy businesses_select on public.businesses for select to authenticated
  using (public.is_business_member(id));
create policy businesses_insert on public.businesses for insert to authenticated
  with check (true);

create policy memberships_select on public.business_memberships for select to authenticated
  using (public.is_business_member(business_id) or user_id = auth.uid());
create policy memberships_insert on public.business_memberships for insert to authenticated
  with check (user_id = auth.uid() or public.has_business_role(business_id, array['owner', 'admin']::public.member_role[]));

create policy subscriptions_select on public.subscriptions for select to authenticated
  using (public.is_business_member(business_id));
create policy subscriptions_insert on public.subscriptions for insert to authenticated
  with check (public.has_business_role(business_id, array['owner', 'admin']::public.member_role[]));

create policy customers_all on public.customers for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy orders_all on public.orders for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy risk_all on public.risk_evaluations for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy tokens_member on public.verification_tokens for select to authenticated
  using (public.is_business_member(business_id));
create policy tokens_insert on public.verification_tokens for insert to authenticated
  with check (public.is_business_member(business_id));

create policy integrations_all on public.integration_connections for all to authenticated
  using (public.is_business_member(business_id))
  with check (public.has_business_role(business_id, array['owner', 'admin']::public.member_role[]));

create policy webhooks_select on public.webhook_events for select to authenticated
  using (business_id is null or public.is_business_member(business_id));

create policy usage_select on public.usage_events for select to authenticated
  using (public.is_business_member(business_id));
create policy usage_insert on public.usage_events for insert to authenticated
  with check (public.is_business_member(business_id));

create policy admin_audit_insert on public.admin_audit_logs for insert to authenticated with check (actor_user_id = auth.uid());
