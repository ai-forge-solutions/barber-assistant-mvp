# Stripe y Supabase para TURNO.

## Decisión de pricing

La página `/pricing` usa tres tiers para crear anclaje:

1. `Arranque` — 29€/mes mensual o 24€/mes anual. Sirve como opción flexible de entrada.
2. `Barbería anual` — recomendado: 15€/mes con compromiso anual, con primer mes gratis.
3. `Barbería pro` — 39€/mes mensual o 32€/mes anual para equipos/locales con más sillas.

El plan recomendado se integra también en la home porque la landing ya está enfocada a conversión. `/pricing` queda como página específica para comparar planes con toggle mensual/anual y cajas desplegables.

## Primer mes gratis

El checkout de `/api/billing/checkout` usa Stripe Checkout en modo `subscription` con:

- `trial_period_days: 30` para que el primer mes sea 0€.
- `payment_method_collection: 'if_required'` para no pedir método de pago si Stripe no lo necesita al iniciar el trial.
- `allow_promotion_codes: true` para futuras ofertas controladas desde Stripe.
- redirección a `/auth/barber/signup` tras checkout correcto.

Mientras falten variables de Stripe, el endpoint queda mockeado y redirige a:

```text
/auth/barber/signup?next=/dashboard&billing_mock=true&plan=<plan>
```

Así se puede revisar el flujo y el copy sin cobrar.

## Variables necesarias para cerrar cobros reales

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SOLO_MONTHLY=price_...
STRIPE_PRICE_SOLO_ANNUAL=price_...
STRIPE_PRICE_RECOMMENDED_MONTHLY=price_...
STRIPE_PRICE_RECOMMENDED_ANNUAL=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_ANNUAL=price_...
NEXT_PUBLIC_APP_URL=https://...
```

También hay que configurar en Stripe:

- producto TURNO. y los tres prices anteriores;
- Customer Portal si Miguel quiere autoservicio de cambio/cancelación;
- dominio definitivo para el checkout real.

## Supabase: acceso de barberos con suscripción activa

La migración `20260718033000_create_shop_subscriptions.sql` crea `public.shop_subscriptions`.

Decisión de modelo:

- La suscripción pertenece a `shops`, no a `customers`.
- `customers` sigue siendo solo para clientes finales que reservan.
- Los barberos siguen en `barbers`.
- Un shop activo desbloquea el dashboard para el `owner_id` de `shops` y para `barbers.is_active = true` de ese shop.

Estados que permiten acceso:

```text
active, trialing
```

Además, si `current_period_end` existe, debe estar en el futuro.

La función `public.shop_has_active_subscription(shop_id)` centraliza la comprobación. En una tarea posterior se debería usar en el guard del dashboard y mantenerla sincronizada con webhooks de Stripe:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

## Pendiente para una tarea posterior

Para empezar a cobrar de verdad faltan datos de Miguel / Stripe:

1. confirmar si los planes anuales se facturan mes a mes con compromiso anual o en un cargo anual;
2. claves live/test de Stripe;
3. IDs reales de los prices;
4. webhook secret;
5. dominio definitivo para el checkout real;
6. si se debe bloquear dashboard inmediatamente cuando `past_due` o dar periodo de gracia.
