# Stripe y Supabase para trujas

## Decisión de pricing

La página `/pricing` y la pantalla `/billing` usan dos planes de Stripe:

1. `Barbería basic` — 29€/mes mensual o 15€/mes con permanencia anual, con primer mes gratis.
2. `Barbería pro` — 39€/mes mensual o 32€/mes con permanencia anual, con primer mes gratis.

El plan recomendado se integra también en la home porque la landing ya está enfocada a conversión. `/pricing` queda como página específica para comparar planes con toggle mensual/anual y cajas desplegables.

## Primer mes gratis

El checkout de `/api/stripe/create-checkout-session` usa Stripe Checkout en modo `subscription` con:

- `trial_period_days: 30` para que el primer mes sea 0€.
- `payment_method_collection: 'always'` para pedir tarjeta al iniciar el trial.
- `allow_promotion_codes: true` para futuras ofertas controladas desde Stripe.
- redirección a `/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}` tras checkout correcto.
- metadata de `shop_id`, `owner_user_id`, `plan` y `cadence` para sincronizar la suscripción por webhook.

La ruta legacy `/api/billing/checkout` reexporta el endpoint nuevo para no romper CTAs existentes.

Mientras falte `STRIPE_SECRET_KEY`, el endpoint redirige de vuelta a:

```text
/billing?checkout=missing_config&plan=<plan>
```

Así se puede revisar el copy sin cobrar. Para validar Checkout real hacen falta secrets de Stripe en el entorno del servidor.

## Variables necesarias para cerrar cobros reales

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
NEXT_PUBLIC_APP_URL=https://...
```

Si no se definen los `STRIPE_PRICE_*`, el servidor resuelve prices activos por lookup key:

```text
price_barberia_monthly
price_barberia_yearly
price_barberia_pro_monthly
price_barberia_pro_yearly
```

También hay que configurar en Stripe:

- productos y prices anteriores;
- Customer Portal para autoservicio de cambio/cancelación;
- webhook público apuntando a `/api/stripe/webhook`;
- dominio definitivo para Checkout y Portal.

## Resumen ejecutivo: setup productivo para aceptar pagos

Para aceptar pagos reales en producción no basta con desplegar el código. Hay que completar este setup operativo:

1. Crear en Stripe los productos y prices de `Barbería basic` y `Barbería pro` para mensual/anual, usando los lookup keys documentados o copiando los price IDs a `STRIPE_PRICE_*`.
2. Configurar en Netlify/producción `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y `NEXT_PUBLIC_APP_URL` con el dominio definitivo.
3. Publicar un webhook de Stripe hacia `https://<dominio>/api/stripe/webhook` con eventos de Checkout, suscripciones e invoices.
4. Habilitar Customer Portal en Stripe para cambios/cancelaciones de plan desde `/billing`.
5. Ejecutar la migración de Supabase de suscripciones antes de activar cobros, para que el webhook pueda persistir `shop_subscriptions`.
6. Hacer un smoke test con modo test de Stripe: login de barbero, checkout, webhook recibido, suscripción `trialing/active` en Supabase y acceso al dashboard/reservas.

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

La función `public.shop_has_active_subscription(shop_id)` centraliza la comprobación. El dashboard y la página pública de reservas la usan para bloquear acceso cuando la suscripción no está activa. El webhook firmado de Stripe mantiene el estado local con estos eventos:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

El Customer Portal se abre desde `/api/stripe/create-portal-session` para usuarios autenticados con barbería asociada y `stripe_customer_id` local.

## Pendiente para una tarea posterior

Para terminar la validación real faltan datos/configuración de Stripe y entorno:

1. configurar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en Netlify/entorno de deploy;
2. confirmar que los lookup keys o `STRIPE_PRICE_*` existen en Stripe;
3. configurar el webhook público hacia `/api/stripe/webhook`;
4. habilitar Customer Portal en Stripe;
5. hacer smoke test real de Checkout/Portal con cuenta de prueba antes de promover producción.
