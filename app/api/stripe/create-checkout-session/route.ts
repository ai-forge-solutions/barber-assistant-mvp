import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardAccess } from '@/lib/dashboard/access'
import { getBillingCadence, getPricingPlan } from '@/lib/billing/pricing'
import {
  TRIAL_PERIOD_DAYS,
  ensureStripeCustomer,
  getAppUrl,
  getShopSubscription,
  getStripe,
  isBillingSetupError,
  resolveStripePriceId,
} from '@/lib/billing/stripe'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const plan = getPricingPlan(formData.get('plan')?.toString() ?? null)
  const cadence = getBillingCadence(formData.get('cadence')?.toString() ?? null)
  const appUrl = getAppUrl(request.nextUrl.origin)
  const stripe = getStripe()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/auth/barber/signup', appUrl)
    loginUrl.searchParams.set('next', '/billing')
    loginUrl.searchParams.set('plan', plan.key)
    loginUrl.searchParams.set('cadence', cadence)
    return NextResponse.redirect(loginUrl, 303)
  }

  const { shop } = await getDashboardAccess(user.id)
  if (!shop) {
    return NextResponse.redirect(new URL('/onboarding', appUrl), 303)
  }

  if (!stripe) {
    const billingUrl = new URL('/billing', appUrl)
    billingUrl.searchParams.set('checkout', 'missing_config')
    billingUrl.searchParams.set('plan', plan.key)
    return NextResponse.redirect(billingUrl, 303)
  }

  let subscription: Awaited<ReturnType<typeof getShopSubscription>>
  let priceId: string
  let customerId: string

  try {
    subscription = await getShopSubscription(shop.id)
    priceId = await resolveStripePriceId(stripe, plan, cadence)
    customerId = await ensureStripeCustomer({
      stripe,
      shopId: shop.id,
      shopName: shop.name,
      userId: user.id,
      userEmail: user.email,
      subscription,
      planKey: plan.key,
    })
  } catch (error) {
    console.error('[stripe checkout] configuración incompleta:', error)
    const billingUrl = new URL('/billing', appUrl)
    billingUrl.searchParams.set('checkout', isBillingSetupError(error) ? 'missing_setup' : 'checkout_error')
    if (isBillingSetupError(error)) billingUrl.searchParams.set('reason', error.reason)
    billingUrl.searchParams.set('plan', plan.key)
    billingUrl.searchParams.set('cadence', cadence)
    return NextResponse.redirect(billingUrl, 303)
  }

  const successUrl = new URL('/billing', appUrl)
  successUrl.searchParams.set('checkout', 'success')
  successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}')

  const cancelUrl = new URL('/billing', appUrl)
  cancelUrl.searchParams.set('checkout', 'cancelled')
  cancelUrl.searchParams.set('plan', plan.key)

  const metadata = {
    shop_id: shop.id,
    owner_user_id: user.id,
    plan: plan.key,
    cadence,
    source: 'trujas-billing',
  }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: shop.id,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
        metadata,
      },
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata,
    })
  } catch (error) {
    console.error('[stripe checkout] error creando sesión:', error)
    const billingUrl = new URL('/billing', appUrl)
    billingUrl.searchParams.set('checkout', 'checkout_error')
    billingUrl.searchParams.set('plan', plan.key)
    billingUrl.searchParams.set('cadence', cadence)
    return NextResponse.redirect(billingUrl, 303)
  }

  if (!session.url) {
    console.error('[stripe checkout] sesión sin URL:', session.id)
    const billingUrl = new URL('/billing', appUrl)
    billingUrl.searchParams.set('checkout', 'checkout_error')
    billingUrl.searchParams.set('plan', plan.key)
    billingUrl.searchParams.set('cadence', cadence)
    return NextResponse.redirect(billingUrl, 303)
  }

  return NextResponse.redirect(session.url, 303)
}
