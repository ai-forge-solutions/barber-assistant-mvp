import Link from 'next/link'
import { PRICING_PLANS, RECOMMENDED_PLAN } from '@/lib/billing/pricing'
import AvailabilityBar from '@/components/pricing/AvailabilityBar'

function CheckoutButton({ planKey, children }: { planKey: string; children: string }) {
  return (
    <form action="/api/billing/checkout" method="POST">
      <input type="hidden" name="plan" value={planKey} />
      <button
        type="submit"
        className="min-h-[44px] w-full rounded-sm bg-[#C8102E] px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:bg-[#111111] active:scale-[0.98]"
      >
        {children}
      </button>
    </form>
  )
}

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PRICING_PLANS.map((plan) => {
        const recommended = plan.key === RECOMMENDED_PLAN.key
        return (
          <article
            key={plan.key}
            className={`relative flex flex-col border-2 bg-white px-5 py-5 ${
              recommended ? 'border-[#111111]' : 'border-[#E5E5E5]'
            }`}
          >
            {plan.badge && (
              <div className="absolute right-4 top-4 border border-[#C8102E] px-2 py-1 font-['Oswald'] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C8102E]">
                {plan.badge}
              </div>
            )}
            <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#999999]">{plan.eyebrow}</p>
            <h3 className="mt-3 font-['Oswald'] text-[24px] font-bold uppercase leading-tight text-[#111111]">{plan.name}</h3>
            <p className="mt-4 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">{plan.description}</p>

            <div className="mt-5 border-y border-[#E5E5E5] py-5">
              {plan.anchorPriceMonthly && (
                <p className="font-['DM_Sans'] text-[13px] text-[#999999]">
                  Antes <span className="line-through">{plan.anchorPriceMonthly}€/mes</span>
                </p>
              )}
              <div className="mt-1 flex items-end gap-2">
                <span className="font-['Oswald'] text-[44px] font-bold leading-none text-[#111111]">{plan.priceMonthly}€</span>
                <span className="pb-1 font-['DM_Sans'] text-[14px] text-[#555555]">/ mes</span>
              </div>
              <p className="mt-2 font-['DM_Sans'] text-[12px] text-[#999999]">{plan.billingLabel}</p>
            </div>

            <ul className="mt-5 flex flex-1 flex-col gap-3">
              {(compact ? plan.features.slice(0, 4) : plan.features).map((feature) => (
                <li key={feature} className="grid grid-cols-[18px_1fr] gap-3 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">
                  <span className="font-['Oswald'] text-[#1A3A6B]">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <CheckoutButton planKey={plan.key}>{plan.cta}</CheckoutButton>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function PricingTeaser() {
  return (
    <section id="precio" className="bg-[#111111] px-6 py-12 text-center sm:px-10">
      <p className="mx-auto inline-block border border-[#C8102E] px-4 py-2 font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C8102E]">Solo para las primeras 50 barberías</p>
      <h2 className="mt-6 font-['Oswald'] text-[34px] font-bold uppercase leading-tight text-white">
        Entra ahora y prueba Trujas con tu barbería real.
      </h2>
      <p className="mx-auto mt-5 max-w-lg font-['DM_Sans'] text-[16px] leading-relaxed text-white">
        Sin compromiso. Tu primer mes es gratis. Queremos ver qué pasa con las primeras barberías antes de abrirlo a todo el mundo.
      </p>
      <AvailabilityBar />
      <div className="mx-auto mt-7 max-w-md border-2 border-white bg-white px-5 py-5 text-left">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">Plan inicial</p>
            <h3 className="mt-1 font-['Oswald'] text-[24px] font-bold uppercase text-[#111111]">Barbería anual</h3>
          </div>
          <div className="border border-[#C8102E] px-2 py-1 font-['Oswald'] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C8102E]">Ahorra 48%</div>
        </div>
        <div className="mt-5 flex items-end gap-2">
          <span className="font-['Oswald'] text-[48px] font-bold leading-none text-[#111111]">15€</span>
          <span className="pb-1 font-['DM_Sans'] text-[14px] text-[#555555]">/ mes</span>
        </div>
        <p className="mt-2 font-['DM_Sans'] text-[13px] text-[#555555]">Compromiso anual. Sin comisión por reserva. Primer mes gratis.</p>
        <div className="mt-5">
          <CheckoutButton planKey="recommended">Reservar mi plaza</CheckoutButton>
        </div>
      </div>
      <Link href="/pricing" className="mt-6 inline-flex min-h-[44px] items-center justify-center font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white underline-offset-4 hover:underline">
        Ver todos los planes
      </Link>
    </section>
  )
}
