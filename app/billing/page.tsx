import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardAccess } from '@/lib/dashboard/access'
import { PRICING_PLANS, getPlanBillingLabel, getPlanPrice, type BillingCadence } from '@/lib/billing/pricing'
import AppNav from '@/components/nav/AppNav'
import ColorStripe from '@/components/brand/ColorStripe'

type BillingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const statusLabels: Record<string, string> = {
  incomplete: 'Pendiente de pago',
  incomplete_expired: 'Pago caducado',
  trialing: 'Primer mes gratis activo',
  active: 'Suscripción activa',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  unpaid: 'Impagada',
  paused: 'Pausada',
}

const setupReasonLabels: Record<string, string> = {
  stripe_price_missing: 'Falta un price activo de Stripe para el plan elegido. Revisa los lookup keys o las variables STRIPE_PRICE_*.',
  supabase_billing_schema: 'Falta aplicar la migración de suscripciones en Supabase antes de cobrar.',
}

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key]
  return Array.isArray(raw) ? raw[0] : raw
}

function formatDate(valueToFormat: string | null | undefined) {
  if (!valueToFormat) return 'Sin fecha todavía'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(valueToFormat))
}

function CheckoutForm({ planKey, cadence, children }: { planKey: string; cadence: BillingCadence; children: string }) {
  return (
    <form action="/api/stripe/create-checkout-session" method="POST">
      <input type="hidden" name="plan" value={planKey} />
      <input type="hidden" name="cadence" value={cadence} />
      <button
        type="submit"
        className="min-h-[44px] w-full rounded-sm bg-[#C8102E] px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:bg-[#111111] active:scale-[0.98]"
      >
        {children}
      </button>
    </form>
  )
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = searchParams ? await searchParams : {}
  const checkout = value(params, 'checkout')
  const portal = value(params, 'portal')
  const setupReason = value(params, 'reason')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/barber?next=/billing')

  const access = await getDashboardAccess(user.id)
  if (!access.shop) redirect('/onboarding')

  const subscription = access.subscription
  const statusLabel = subscription ? statusLabels[subscription.status] ?? subscription.status : 'Sin suscripción activa'
  const statusColor = access.hasActiveSubscription ? 'text-[#1A3A6B] border-[#1A3A6B]' : 'text-[#C8102E] border-[#C8102E]'

  return (
    <div className="min-h-screen bg-white">
      <AppNav />
      <ColorStripe />

      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 py-8 pb-12">
        <section>
          <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">
            Billing
          </p>
          <h1 className="mt-2 font-['Oswald'] text-[34px] font-bold uppercase leading-tight text-[#111111]">
            Activa las reservas de {access.shop.name ?? 'tu barbería'}.
          </h1>
          <p className="mt-4 font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">
            El dashboard y el link de reservas se desbloquean con una suscripción activa o en prueba. Primer mes gratis con tarjeta.
          </p>
        </section>

        {checkout === 'success' && (
          <div className="border-2 border-[#1A3A6B] bg-white px-4 py-3">
            <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1A3A6B]">Checkout confirmado</p>
            <p className="mt-1 font-['DM_Sans'] text-[13px] text-[#555555]">Stripe está sincronizando tu suscripción. Si todavía ves esta pantalla, espera unos segundos y recarga.</p>
          </div>
        )}

        {checkout === 'cancelled' && (
          <div className="border-2 border-[#C8102E] bg-white px-4 py-3">
            <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8102E]">Checkout cancelado</p>
            <p className="mt-1 font-['DM_Sans'] text-[13px] text-[#555555]">No se ha cambiado nada. Puedes volver a intentarlo cuando quieras.</p>
          </div>
        )}

        {checkout === 'missing_config' && (
          <div className="border-2 border-[#C8102E] bg-white px-4 py-3">
            <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8102E]">Stripe no está configurado</p>
            <p className="mt-1 font-['DM_Sans'] text-[13px] text-[#555555]">Falta STRIPE_SECRET_KEY o los prices/lookup keys en el entorno del servidor.</p>
          </div>
        )}

        {checkout === 'missing_setup' && (
          <div className="border-2 border-[#C8102E] bg-white px-4 py-3">
            <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8102E]">Falta setup de cobro</p>
            <p className="mt-1 font-['DM_Sans'] text-[13px] text-[#555555]">
              {setupReason ? setupReasonLabels[setupReason] ?? 'Revisa la configuración de Stripe y Supabase antes de volver a intentarlo.' : 'Revisa la configuración de Stripe y Supabase antes de volver a intentarlo.'}
            </p>
          </div>
        )}

        {checkout === 'checkout_error' && (
          <div className="border-2 border-[#C8102E] bg-white px-4 py-3">
            <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8102E]">No se pudo abrir Stripe</p>
            <p className="mt-1 font-['DM_Sans'] text-[13px] text-[#555555]">No se ha cobrado nada. Inténtalo otra vez y, si sigue fallando, revisa los logs de Stripe Checkout.</p>
          </div>
        )}

        {portal === 'return' && (
          <div className="border border-[#E5E5E5] bg-white px-4 py-3">
            <p className="font-['DM_Sans'] text-[13px] text-[#555555]">Has vuelto del portal de Stripe. La suscripción se actualizará con el webhook.</p>
          </div>
        )}

        <section className="border-2 border-[#111111] bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#999999]">Estado actual</p>
              <h2 className="mt-1 font-['Oswald'] text-[24px] font-bold uppercase text-[#111111]">{statusLabel}</h2>
            </div>
            <span className={`shrink-0 border px-2 py-1 font-['Oswald'] text-[10px] font-semibold uppercase tracking-[0.1em] ${statusColor}`}>
              {access.hasActiveSubscription ? 'Activo' : 'Bloqueado'}
            </span>
          </div>
          <div className="mt-4 grid gap-2 border-t border-[#E5E5E5] pt-4 font-['DM_Sans'] text-[13px] text-[#555555]">
            <p>Barbería: <span className="text-[#111111]">{access.shop.name}</span></p>
            <p>Próxima fecha: <span className="text-[#111111]">{formatDate(subscription?.current_period_end)}</span></p>
          </div>
          {subscription?.stripe_customer_id && (
            <form action="/api/stripe/create-portal-session" method="POST" className="mt-5">
              <button
                type="submit"
                className="min-h-[44px] w-full rounded-sm border-2 border-[#111111] bg-transparent px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#111111] transition-colors duration-150 hover:bg-[#111111] hover:text-white active:scale-[0.98]"
              >
                Gestionar suscripción
              </button>
            </form>
          )}
        </section>

        <section>
          <h2 className="font-['Oswald'] text-[26px] font-bold uppercase text-[#111111]">Elige plan</h2>
          <p className="mt-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">
            Stripe cobra de forma segura. trujas no guarda tarjetas.
          </p>

          <div className="mt-4 grid gap-3">
            {PRICING_PLANS.map((plan) => (
              <article key={plan.key} className="border-2 border-[#111111] bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-['Oswald'] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">{plan.eyebrow}</p>
                    <h3 className="mt-1 font-['Oswald'] text-[22px] font-bold uppercase text-[#111111]">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-['Oswald'] text-[28px] font-bold leading-none text-[#111111]">{getPlanPrice(plan, 'annual')}€</p>
                    <p className="font-['DM_Sans'] text-[11px] text-[#999999]">/ mes anual</p>
                  </div>
                </div>
                <p className="mt-3 font-['DM_Sans'] text-[13px] leading-relaxed text-[#555555]">{plan.description}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="border border-[#E5E5E5] p-3">
                    <p className="font-['DM_Sans'] text-[12px] text-[#555555]">{getPlanBillingLabel(plan, 'annual')}</p>
                    <div className="mt-3">
                      <CheckoutForm planKey={plan.key} cadence="annual">Probar anual</CheckoutForm>
                    </div>
                  </div>
                  <div className="border border-[#E5E5E5] p-3">
                    <p className="font-['DM_Sans'] text-[12px] text-[#555555]">{getPlanBillingLabel(plan, 'monthly')}</p>
                    <div className="mt-3">
                      <CheckoutForm planKey={plan.key} cadence="monthly">Probar mensual</CheckoutForm>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {access.hasActiveSubscription && (
          <Link
            href="/dashboard/agenda"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-[#C8102E] px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white"
          >
            Entrar al dashboard
          </Link>
        )}
      </main>
    </div>
  )
}
