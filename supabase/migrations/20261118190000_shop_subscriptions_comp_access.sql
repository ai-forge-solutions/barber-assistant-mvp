-- Complimentary ("comp") access: a shop subscription granted manually instead of paid
-- through Stripe (friends, founder/testing accounts). Access rules are unchanged:
-- status in ('active','trialing') and current_period_end null (lifetime) or in the future.

alter table public.shop_subscriptions
  add column if not exists source text not null default 'stripe',
  add column if not exists comp_reason text;

alter table public.shop_subscriptions
  drop constraint if exists shop_subscriptions_source_check;

alter table public.shop_subscriptions
  add constraint shop_subscriptions_source_check
  check (source in ('stripe', 'comp'));

-- A comp row never carries a Stripe subscription, so Stripe webhooks can never match it.
alter table public.shop_subscriptions
  drop constraint if exists shop_subscriptions_comp_without_stripe_check;

alter table public.shop_subscriptions
  add constraint shop_subscriptions_comp_without_stripe_check
  check (source = 'stripe' or (stripe_subscription_id is null and stripe_price_id is null));

comment on column public.shop_subscriptions.source is
  'stripe = paid via Stripe Checkout; comp = complimentary access granted manually (scripts/grant-comp-access.mjs).';
comment on column public.shop_subscriptions.comp_reason is
  'Why a comp subscription was granted. Required in practice for source = comp.';
