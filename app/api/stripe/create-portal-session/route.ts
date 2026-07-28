import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardAccess } from '@/lib/dashboard/access'
import { getAppUrl, getShopSubscription, getStripe } from '@/lib/billing/stripe'

export async function POST(request: NextRequest) {
  const appUrl = getAppUrl(request.nextUrl.origin)
  const stripe = getStripe()

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe no está configurado.' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { shop } = await getDashboardAccess(user.id)
  if (!shop) return NextResponse.json({ error: 'No hay barbería asociada.' }, { status: 403 })

  const subscription = await getShopSubscription(shop.id)
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: 'Todavía no hay cliente de Stripe para esta barbería.' }, { status: 409 })
  }

  const returnUrl = new URL('/billing', appUrl)
  returnUrl.searchParams.set('portal', 'return')

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: returnUrl.toString(),
  })

  return NextResponse.redirect(session.url, 303)
}
