import Link from 'next/link'
import AvailabilityBar from '@/components/pricing/AvailabilityBar'
import type { BillingCadence, PricingPlanKey } from '@/lib/billing/pricing'

function CheckoutButton({
  planKey,
  cadence,
  children,
}: {
  planKey: PricingPlanKey
  cadence: BillingCadence
  children: string
}) {
  return (
    <form action="/api/billing/checkout" method="POST">
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

export default function PricingTeaser() {
  return (
    <section id="precio" className="bg-[#111111] px-6 py-12 text-center sm:px-10">
      <p className="mx-auto inline-block border border-[#C8102E] px-4 py-2 font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C8102E]">Primer mes gratis</p>
      <h2 className="mt-6 font-['Oswald'] text-[34px] font-bold uppercase leading-tight text-white">
        Prueba trujas con tu barbería real por 0€.
      </h2>
      <p className="mx-auto mt-5 max-w-lg font-['DM_Sans'] text-[16px] leading-relaxed text-white">
        El recomendado es 15€/mes con compromiso anual. Durante el primer mes configuras la agenda y no pagas nada.
      </p>
      <AvailabilityBar />
      <div className="mx-auto mt-7 max-w-md border-2 border-white bg-white px-5 py-5 text-left">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">Plan recomendado</p>
            <h3 className="mt-1 font-['Oswald'] text-[24px] font-bold uppercase text-[#111111]">Barbería basic</h3>
          </div>
          <div className="border border-[#C8102E] px-2 py-1 font-['Oswald'] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C8102E]">0€ hoy</div>
        </div>
        <div className="mt-5 flex items-end gap-2">
          <span className="font-['Oswald'] text-[48px] font-bold leading-none text-[#111111]">15€</span>
          <span className="pb-1 font-['DM_Sans'] text-[14px] text-[#555555]">/ mes</span>
        </div>
        <p className="mt-2 font-['DM_Sans'] text-[13px] text-[#555555]">Compromiso anual. Sin comisión por reserva. Primer mes gratis.</p>
        <div className="mt-5">
          <CheckoutButton planKey="recommended" cadence="annual">Empezar con primer mes gratis</CheckoutButton>
        </div>
      </div>
      <Link href="/pricing" className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-sm border-2 border-white px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:bg-white hover:text-[#111111] active:scale-[0.98]">
        Ver todos los planes
      </Link>
    </section>
  )
}
