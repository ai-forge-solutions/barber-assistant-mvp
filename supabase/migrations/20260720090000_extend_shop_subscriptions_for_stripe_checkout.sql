create index if not exists shop_subscriptions_customer_idx
  on public.shop_subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.shop_subscriptions
  add column if not exists last_webhook_event_id text,
  add column if not exists last_webhook_event_at timestamptz;

alter table public.shop_subscriptions
  drop constraint if exists shop_subscriptions_plan_key_check;

alter table public.shop_subscriptions
  add constraint shop_subscriptions_plan_key_check
  check (plan_key in ('basic', 'pro', 'recommended', 'premium'));

create index if not exists shop_subscriptions_last_webhook_event_idx
  on public.shop_subscriptions(last_webhook_event_id)
  where last_webhook_event_id is not null;
