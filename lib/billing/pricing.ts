export type PricingPlanKey = 'solo' | 'recommended' | 'premium'

export type PricingPlan = {
  key: PricingPlanKey
  name: string
  eyebrow: string
  priceMonthly: number
  billingLabel: string
  anchorPriceMonthly?: number
  badge?: string
  stripePriceEnv: string
  description: string
  features: string[]
  cta: string
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    key: 'solo',
    name: 'Arranque',
    eyebrow: 'Para probar sin lío',
    priceMonthly: 29,
    billingLabel: 'mes a mes',
    stripePriceEnv: 'STRIPE_PRICE_SOLO_MONTHLY',
    description: 'Para una barbería que quiere ordenar la agenda sin compromiso anual.',
    features: [
      'Página de reservas para tu barbería',
      'Agenda diaria en el móvil',
      'Clientes, servicios y barberos básicos',
      'Recordatorios operativos por email',
    ],
    cta: 'Probar este plan',
  },
  {
    key: 'recommended',
    name: 'Barbería anual',
    eyebrow: 'Recomendado',
    priceMonthly: 15,
    anchorPriceMonthly: 29,
    billingLabel: '15€/mes con compromiso anual',
    badge: 'Ahorra 48%',
    stripePriceEnv: 'STRIPE_PRICE_RECOMMENDED_MONTHLY',
    description: 'El precio pensado para una barbería de barrio: menos que un corte al mes y sin comisiones por reserva.',
    features: [
      'Todo lo del plan Arranque',
      'Precio bloqueado durante el primer año',
      'Sin comisión por reserva',
      'Configuración guiada de la barbería',
      'Prioridad para nuevas funciones del MVP',
    ],
    cta: 'Empezar con 15€/mes',
  },
  {
    key: 'premium',
    name: 'Barbería pro',
    eyebrow: 'Para equipos',
    priceMonthly: 39,
    billingLabel: 'mes a mes',
    stripePriceEnv: 'STRIPE_PRICE_PREMIUM_MONTHLY',
    description: 'Para locales con más movimiento que necesitan ayuda extra y varias sillas activas.',
    features: [
      'Todo lo del plan anual',
      'Soporte prioritario de configuración',
      'Hasta 6 barberos activos',
      'Revisión mensual de agenda y no-shows',
    ],
    cta: 'Quiero el pro',
  },
]

export const RECOMMENDED_PLAN = PRICING_PLANS.find((plan) => plan.key === 'recommended')!

export function getPricingPlan(planKey: string | null): PricingPlan {
  return PRICING_PLANS.find((plan) => plan.key === planKey) ?? RECOMMENDED_PLAN
}

export function getConfiguredStripePriceId(plan: PricingPlan): string | undefined {
  return process.env[plan.stripePriceEnv]
}
