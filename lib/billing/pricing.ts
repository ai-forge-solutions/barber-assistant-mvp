export type PricingPlanKey = 'recommended' | 'premium'
export type BillingCadence = 'monthly' | 'annual'

export type PricingPlan = {
  key: PricingPlanKey
  name: string
  eyebrow: string
  monthlyPrice: number
  annualPrice: number
  monthlyBillingLabel: string
  annualBillingLabel: string
  monthlyStripePriceEnv: string
  annualStripePriceEnv: string
  annualBadge?: string
  description: string
  features: string[]
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: 'recommended',
    name: 'Barbería basic',
    eyebrow: 'Recomendado',
    monthlyPrice: 29,
    annualPrice: 15,
    monthlyBillingLabel: 'Mes a mes. Primer mes gratis.',
    annualBillingLabel: '15€/mes con compromiso anual. Primer mes gratis.',
    monthlyStripePriceEnv: 'STRIPE_PRICE_RECOMMENDED_MONTHLY',
    annualStripePriceEnv: 'STRIPE_PRICE_RECOMMENDED_ANNUAL',
    annualBadge: 'Recomendado',
    description: 'El precio pensado para una barbería de barrio: menos que un corte al mes y sin comisiones por reserva.',
    features: [
      'Página de reservas para tu barbería',
      'Agenda diaria en el móvil',
      'Clientes, servicios y barberos básicos',
      'Recordatorios operativos por email',
      'Precio bloqueado durante el primer año',
      'Sin comisión por reserva',
      'Configuración guiada de la barbería',
      'Prioridad para nuevas funciones del MVP',
    ],
  },
  {
    key: 'premium',
    name: 'Barbería pro',
    eyebrow: 'Para equipos',
    monthlyPrice: 39,
    annualPrice: 32,
    monthlyBillingLabel: 'Mes a mes. Primer mes gratis.',
    annualBillingLabel: '32€/mes con compromiso anual. Primer mes gratis.',
    monthlyStripePriceEnv: 'STRIPE_PRICE_PREMIUM_MONTHLY',
    annualStripePriceEnv: 'STRIPE_PRICE_PREMIUM_ANNUAL',
    annualBadge: 'Ahorra 18%',
    description: 'Para locales con más movimiento que necesitan ayuda extra y varias sillas activas.',
    features: [
      'Todo lo del plan Basic',
      'Soporte prioritario de configuración',
      'Hasta 6 barberos activos',
      'Revisión mensual de agenda y no-shows',
    ],
  },
]

export const RECOMMENDED_PLAN = PRICING_PLANS.find((plan) => plan.key === 'recommended')!

export function getPricingPlan(planKey: string | null): PricingPlan {
  return PRICING_PLANS.find((plan) => plan.key === planKey) ?? RECOMMENDED_PLAN
}

export function getBillingCadence(value: string | null): BillingCadence {
  return value === 'monthly' ? 'monthly' : 'annual'
}

export function getPlanPrice(plan: PricingPlan, cadence: BillingCadence): number {
  return cadence === 'monthly' ? plan.monthlyPrice : plan.annualPrice
}

export function getPlanBillingLabel(plan: PricingPlan, cadence: BillingCadence): string {
  return cadence === 'monthly' ? plan.monthlyBillingLabel : plan.annualBillingLabel
}

export function getConfiguredStripePriceId(plan: PricingPlan, cadence: BillingCadence): string | undefined {
  if (cadence === 'monthly') {
    return process.env[plan.monthlyStripePriceEnv]
  }

  return process.env[plan.annualStripePriceEnv] ?? process.env[plan.monthlyStripePriceEnv]
}
