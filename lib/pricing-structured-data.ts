import {
  PRICING_PLANS,
  TRIAL_PERIOD_DAYS,
  type BillingCadence,
  getPlanBillingLabel,
  getPlanPrice,
} from '@/lib/billing/pricing'
import { SITE_URL } from '@/lib/seo'

export function pricingSoftwareSchema() {
  const url = new URL('/pricing', SITE_URL).toString()

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'trujas',
    url,
    applicationCategory: 'BusinessApplication',
    description: `Software de gestión de citas para barberías. Todos los planes empiezan con ${TRIAL_PERIOD_DAYS} días gratis; cancela dentro de los primeros ${TRIAL_PERIOD_DAYS} días antes del primer cobro si no quieres continuar. Después de la prueba se cobra la modalidad elegida.`,
    offers: PRICING_PLANS.flatMap((plan) =>
      (['monthly', 'annual'] as BillingCadence[]).map((cadence) => {
        const price = getPlanPrice(plan, cadence)
        return {
          '@type': 'Offer',
          name: `${plan.name} — ${cadence === 'monthly' ? 'Mes a mes' : 'Con permanencia de 12 meses'}`,
          url,
          description: getPlanBillingLabel(plan, cadence),
          price,
          priceCurrency: 'EUR',
          // Both tariffs are per month; the annual key denotes commitment, not a yearly lump sum.
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price,
            priceCurrency: 'EUR',
            billingDuration: 'P1M',
          },
        }
      }),
    ),
  }
}
