'use client'

import { useState } from 'react'
import {
  PRICING_PLANS,
  RECOMMENDED_PLAN,
  type BillingCadence,
  type PricingPlanKey,
  getPlanBillingLabel,
  getPlanPrice,
} from '@/lib/billing/pricing'

function CheckoutButton({
  planKey,
  cadence,
  children,
  variant = 'primary',
}: {
  planKey: PricingPlanKey
  cadence: BillingCadence
  children: string
  variant?: 'primary' | 'secondary'
}) {
  const className =
    variant === 'secondary'
      ? "inline-flex min-h-[44px] w-full items-center justify-center rounded-sm border-2 border-white bg-transparent px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:bg-white hover:text-[#111111] active:scale-[0.98]"
      : "min-h-[44px] w-full rounded-sm bg-[#C8102E] px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:bg-[#111111] active:scale-[0.98]"

  return (
    <form action="/api/billing/checkout" method="POST">
      <input type="hidden" name="plan" value={planKey} />
      <input type="hidden" name="cadence" value={cadence} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  )
}

function CadenceToggle({ cadence, onChange }: { cadence: BillingCadence; onChange: (cadence: BillingCadence) => void }) {
  return (
    <div className="mx-auto flex max-w-sm border-2 border-[#111111] bg-white p-1" aria-label="Elegir forma de pago">
      {(['annual', 'monthly'] as BillingCadence[]).map((option) => {
        const active = cadence === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-h-[44px] flex-1 rounded-sm px-4 py-2 font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150 ${
              active ? 'bg-[#111111] text-white' : 'bg-white text-[#111111] hover:bg-[#E5E5E5]'
            }`}
          >
            {option === 'annual' ? 'Anual' : 'Mensual'}
          </button>
        )
      })}
    </div>
  )
}

export function PricingCards({ compact = false }: { compact?: boolean }) {
  const [cadence, setCadence] = useState<BillingCadence>('annual')
  const [openPlan, setOpenPlan] = useState<PricingPlanKey>(RECOMMENDED_PLAN.key)

  return (
    <div className="mx-auto max-w-xl lg:max-w-5xl">
      <CadenceToggle cadence={cadence} onChange={setCadence} />
      <p className="mx-auto mt-3 max-w-md text-center font-['DM_Sans'] text-[13px] leading-relaxed text-[#555555]">
        El primer mes cuesta 0€. Elige ahora anual recomendado o mes a mes; después se cobra el plan elegido.
      </p>

      <div className="mt-6 grid gap-3 lg:grid-cols-2 lg:items-start">
        {PRICING_PLANS.map((plan) => {
          const recommended = plan.key === RECOMMENDED_PLAN.key
          const open = plan.key === openPlan
          const price = getPlanPrice(plan, cadence)
          const billingLabel = getPlanBillingLabel(plan, cadence)
          const badge = cadence === 'annual' ? plan.annualBadge : recommended ? 'Flexible' : undefined

          return (
            <article
              key={plan.key}
              className={`relative border-2 bg-white ${recommended ? 'border-[#111111]' : 'border-[#E5E5E5]'}`}
            >
              <button
                type="button"
                onClick={() => setOpenPlan(plan.key)}
                aria-expanded={open}
                className="flex min-h-[76px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span>
                  <span className="block font-['Oswald'] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#999999]">{plan.eyebrow}</span>
                  <span className="mt-1 block font-['Oswald'] text-[20px] font-bold uppercase leading-tight text-[#111111]">{plan.name}</span>
                </span>
                <span className="shrink-0 text-right">
                  {badge && (
                    <span className="mb-1 inline-block border border-[#C8102E] px-2 py-1 font-['Oswald'] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C8102E]">
                      {badge}
                    </span>
                  )}
                  <span className="block font-['Oswald'] text-[26px] font-bold leading-none text-[#111111]">{price}€</span>
                  <span className="block font-['DM_Sans'] text-[11px] text-[#999999]">/ mes</span>
                </span>
              </button>

              <div className={`border-t border-[#E5E5E5] px-4 ${open ? 'block py-4' : 'hidden lg:block lg:py-4'}`}>
                <p className="font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">{plan.description}</p>

                <div className="mt-4 border-y border-[#E5E5E5] py-4">
                  <div className="flex items-end gap-2">
                    <span className="font-['Oswald'] text-[44px] font-bold leading-none text-[#111111]">{price}€</span>
                    <span className="pb-1 font-['DM_Sans'] text-[14px] text-[#555555]">/ mes</span>
                  </div>
                  <p className="mt-2 font-['DM_Sans'] text-[12px] text-[#999999]">{billingLabel}</p>
                </div>

                <ul className="mt-4 flex flex-col gap-2">
                  {(compact ? plan.features.slice(0, 3) : plan.features).map((feature) => (
                    <li key={feature} className="grid grid-cols-[18px_1fr] gap-3 font-['DM_Sans'] text-[13px] leading-relaxed text-[#555555]">
                      <span className="font-['Oswald'] text-[#1A3A6B]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  <CheckoutButton planKey={plan.key} cadence={cadence}>Empezar con primer mes gratis</CheckoutButton>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
