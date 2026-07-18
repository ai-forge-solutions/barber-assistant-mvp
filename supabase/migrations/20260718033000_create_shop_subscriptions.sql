-- MIG-72: Stripe billing state for barber/shop access.
-- Customers remain separate from barbers. Billing attaches to shops because a shop
-- subscription unlocks the barber dashboard for the owner and active barbers.

create table if not exists public.shop_subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  plan_key text not null check (plan_key in ('solo', 'recommended', 'premium')),
  status text not null default 'incomplete' check (status in (
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  )),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists shop_subscriptions_one_current_per_shop_idx
  on public.shop_subscriptions(shop_id)
  where status in ('incomplete', 'trialing', 'active', 'past_due', 'paused');

create index if not exists shop_subscriptions_shop_status_idx
  on public.shop_subscriptions(shop_id, status);

alter table public.shop_subscriptions enable row level security;

drop policy if exists "shop_subscriptions_select_shop_members" on public.shop_subscriptions;
drop policy if exists "shop_subscriptions_service_role_all" on public.shop_subscriptions;

create policy "shop_subscriptions_select_shop_members"
  on public.shop_subscriptions
  for select
  using (
    exists (
      select 1
      from public.shops shop
      where shop.id = shop_subscriptions.shop_id
        and shop.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.barbers barber
      where barber.shop_id = shop_subscriptions.shop_id
        and barber.user_id = auth.uid()
        and barber.is_active = true
    )
  );

create policy "shop_subscriptions_service_role_all"
  on public.shop_subscriptions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select on table public.shop_subscriptions to authenticated;
grant select, insert, update, delete on table public.shop_subscriptions to service_role;

create or replace function public.shop_has_active_subscription(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_subscriptions subscription
    where subscription.shop_id = target_shop_id
      and subscription.status in ('active', 'trialing')
      and (
        subscription.current_period_end is null
        or subscription.current_period_end > now()
      )
  );
$$;

grant execute on function public.shop_has_active_subscription(uuid) to authenticated;
grant execute on function public.shop_has_active_subscription(uuid) to service_role;
