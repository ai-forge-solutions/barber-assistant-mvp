import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  TRIAL_PERIOD_DAYS,
  getConfiguredStripePriceId,
  getPlanLookupKey,
  type BillingCadence,
  type PricingPlan,
  type PricingPlanKey,
} from '@/lib/billing/pricing'

export type ShopSubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

export type ShopSubscription = {
  id: string
  shop_id: string
  plan_key: PricingPlanKey | 'recommended' | 'premium'
  status: ShopSubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  cancel_at_period_end: boolean
}

const ACTIVE_SUBSCRIPTION_STATUSES = ['incomplete', 'trialing', 'active', 'past_due', 'paused']
const STRIPE_API_VERSION = '2026-06-24.dahlia'

export type BillingSetupErrorReason = 'stripe_price_missing' | 'supabase_billing_schema'

export class BillingSetupError extends Error {
  reason: BillingSetupErrorReason

  constructor(reason: BillingSetupErrorReason, message: string) {
    super(message)
    this.name = 'BillingSetupError'
    this.reason = reason
  }
}

export function isBillingSetupError(error: unknown): error is BillingSetupError {
  return error instanceof BillingSetupError
}

function getSupabaseErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code ?? '')
    : ''
}

function getSupabaseErrorMessage(error: unknown) {
  return typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: string }).message ?? '')
    : String(error)
}

function isBillingSchemaError(error: unknown) {
  const code = getSupabaseErrorCode(error)
  const message = getSupabaseErrorMessage(error)
  return ['42P01', '42703', '23514', 'PGRST204'].includes(code) || message.includes('shop_subscriptions')
}

function assertNoBillingSchemaError(error: unknown) {
  if (!error) return
  if (isBillingSchemaError(error)) {
    throw new BillingSetupError(
      'supabase_billing_schema',
      'La tabla de suscripciones de Supabase no está lista para Stripe Checkout.'
    )
  }
  throw error
}

function getDatabasePlanKey(plan: PricingPlanKey | undefined) {
  if (plan === 'pro') return 'premium'
  return 'recommended'
}

export function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) return null
  return new Stripe(stripeSecretKey, { apiVersion: STRIPE_API_VERSION })
}

export function getAppUrl(origin: string) {
  return (process.env.NEXT_PUBLIC_APP_URL ?? origin).replace(/\/$/, '')
}

export function isActiveSubscription(subscription: Pick<ShopSubscription, 'status' | 'current_period_end'> | null | undefined) {
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) return false
  if (!subscription.current_period_end) return true
  return new Date(subscription.current_period_end).getTime() > Date.now()
}

export async function getShopSubscription(shopId: string) {
  const { data, error } = await supabaseAdmin
    .from('shop_subscriptions')
    .select('*')
    .eq('shop_id', shopId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  assertNoBillingSchemaError(error)
  return (data ?? null) as ShopSubscription | null
}

export async function resolveStripePriceId(stripe: Stripe, plan: PricingPlan, cadence: BillingCadence) {
  const configuredPriceId = getConfiguredStripePriceId(plan, cadence)
  if (configuredPriceId) return configuredPriceId

  const lookupKey = getPlanLookupKey(plan, cadence)
  const prices = await stripe.prices.list({ active: true, limit: 1, lookup_keys: [lookupKey] })
  const price = prices.data[0]
  if (!price?.id) {
    throw new BillingSetupError('stripe_price_missing', `No hay price activo en Stripe para lookup_key=${lookupKey}`)
  }
  return price.id
}

export async function ensureStripeCustomer({
  stripe,
  shopId,
  shopName,
  userId,
  userEmail,
  subscription,
  planKey,
}: {
  stripe: Stripe
  shopId: string
  shopName?: string | null
  userId: string
  userEmail?: string | null
  subscription: ShopSubscription | null
  planKey?: PricingPlanKey
}) {
  if (subscription?.stripe_customer_id) return subscription.stripe_customer_id

  const customer = await stripe.customers.create({
    email: userEmail ?? undefined,
    name: shopName ?? undefined,
    metadata: {
      shop_id: shopId,
      owner_user_id: userId,
      source: 'trujas-dashboard',
    },
  })

  if (subscription) {
    const { error } = await supabaseAdmin
      .from('shop_subscriptions')
      .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
      .eq('id', subscription.id)
    assertNoBillingSchemaError(error)
  } else {
    const { error } = await supabaseAdmin.from('shop_subscriptions').insert({
      shop_id: shopId,
      plan_key: getDatabasePlanKey(planKey),
      status: 'incomplete',
      stripe_customer_id: customer.id,
    })
    assertNoBillingSchemaError(error)
  }

  return customer.id
}

function unixToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null
}

function readSubscriptionPeriod(subscription: Stripe.Subscription) {
  const raw = subscription as unknown as Record<string, unknown>
  const firstItem = subscription.items.data[0] as unknown as Record<string, unknown> | undefined

  return {
    current_period_start: unixToIso((raw.current_period_start as number | undefined) ?? (firstItem?.current_period_start as number | undefined)),
    current_period_end: unixToIso((raw.current_period_end as number | undefined) ?? (firstItem?.current_period_end as number | undefined)),
    trial_ends_at: unixToIso(subscription.trial_end),
  }
}

function planFromMetadata(metadata: Stripe.Metadata | null | undefined): PricingPlanKey | 'recommended' | 'premium' {
  const plan = metadata?.plan
  if (plan === 'pro' || plan === 'premium') return 'premium'
  return 'recommended'
}

export async function upsertSubscriptionFromStripe(subscription: Stripe.Subscription, eventId?: string) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const priceId = subscription.items.data[0]?.price.id ?? null
  const metadata = subscription.metadata
  const shopId = metadata.shop_id
  const planKey = planFromMetadata(metadata)
  const period = readSubscriptionPeriod(subscription)

  const payload = {
    plan_key: planKey,
    status: subscription.status as ShopSubscriptionStatus,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    current_period_start: period.current_period_start,
    current_period_end: period.current_period_end,
    trial_ends_at: period.trial_ends_at,
    cancel_at_period_end: subscription.cancel_at_period_end,
    last_webhook_event_id: eventId ?? null,
    last_webhook_event_at: eventId ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  const bySubscription = await supabaseAdmin
    .from('shop_subscriptions')
    .update(payload)
    .eq('stripe_subscription_id', subscription.id)
    .select('id')
    .maybeSingle()

  assertNoBillingSchemaError(bySubscription.error)

  if (bySubscription.data?.id) return bySubscription.data.id as string

  const byCustomer = await supabaseAdmin
    .from('shop_subscriptions')
    .update(payload)
    .eq('stripe_customer_id', customerId)
    .select('id')
    .maybeSingle()

  assertNoBillingSchemaError(byCustomer.error)

  if (byCustomer.data?.id) return byCustomer.data.id as string

  if (!shopId) {
    throw new Error(`No shop_id metadata for Stripe subscription ${subscription.id}`)
  }

  const { data, error } = await supabaseAdmin
    .from('shop_subscriptions')
    .insert({ ...payload, shop_id: shopId })
    .select('id')
    .single()

  assertNoBillingSchemaError(error)
  if (!data?.id) {
    throw new Error(`No se pudo guardar la suscripción de Stripe ${subscription.id}`)
  }
  return data.id as string
}

export async function markCheckoutSessionCompleted(session: Stripe.Checkout.Session, eventId?: string) {
  const shopId = session.metadata?.shop_id
  const planKey = planFromMetadata(session.metadata)
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

  if (!shopId || !customerId) return

  const { error } = await supabaseAdmin
    .from('shop_subscriptions')
    .update({
      plan_key: planKey,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId ?? null,
      last_webhook_event_id: eventId ?? null,
      last_webhook_event_at: eventId ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('shop_id', shopId)
    .in('status', ACTIVE_SUBSCRIPTION_STATUSES)
  assertNoBillingSchemaError(error)
}

export { TRIAL_PERIOD_DAYS }
