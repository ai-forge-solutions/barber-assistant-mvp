import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, markCheckoutSessionCompleted, upsertSubscriptionFromStripe } from '@/lib/billing/stripe'

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription
  if (typeof subscription === 'string') return subscription
  if (subscription?.id) return subscription.id

  const legacyInvoice = invoice as unknown as { subscription?: string | { id?: string } | null }
  const legacySubscription = legacyInvoice.subscription
  if (typeof legacySubscription === 'string') return legacySubscription
  return legacySubscription?.id ?? null
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook no configurado.' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Falta stripe-signature.' }, { status: 400 })
  }

  const rawBody = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error('[stripe webhook] firma inválida:', error)
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await markCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, event.id)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await upsertSubscriptionFromStripe(event.data.object as Stripe.Subscription, event.id)
        break
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = getInvoiceSubscriptionId(invoice)
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await upsertSubscriptionFromStripe(subscription, event.id)
        }
        break
      }
      default:
        break
    }
  } catch (error) {
    console.error('[stripe webhook] error procesando evento:', event.id, error)
    return NextResponse.json({ error: 'No se pudo procesar el evento.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
