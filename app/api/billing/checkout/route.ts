import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getBillingCadence, getConfiguredStripePriceId, getPricingPlan } from '@/lib/billing/pricing'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const plan = getPricingPlan(formData.get('plan')?.toString() ?? null)
  const cadence = getBillingCadence(formData.get('cadence')?.toString() ?? null)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const priceId = getConfiguredStripePriceId(plan, cadence)

  if (!stripeSecretKey || !priceId) {
    const mockUrl = new URL('/auth/barber/signup', appUrl)
    mockUrl.searchParams.set('next', '/dashboard')
    mockUrl.searchParams.set('billing_mock', 'true')
    mockUrl.searchParams.set('plan', plan.key)
    mockUrl.searchParams.set('cadence', cadence)
    return NextResponse.redirect(mockUrl, 303)
  }

  const stripe = new Stripe(stripeSecretKey)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    payment_method_collection: 'if_required',
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    subscription_data: {
      trial_period_days: 30,
      metadata: {
        plan: plan.key,
        cadence,
        source: 'turno-pricing',
      },
    },
    success_url: `${appUrl}/auth/barber/signup?next=%2Fdashboard&checkout_session_id={CHECKOUT_SESSION_ID}&plan=${plan.key}`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled&plan=${plan.key}`,
    metadata: {
      plan: plan.key,
      cadence,
      source: 'turno-pricing',
    },
  })

  if (!session.url) {
    return NextResponse.json({ error: 'No se pudo crear la sesión de pago.' }, { status: 500 })
  }

  return NextResponse.redirect(session.url, 303)
}
