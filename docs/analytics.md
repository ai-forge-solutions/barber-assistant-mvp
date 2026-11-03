# trujas · Analítica (GA4)

Qué hace el código y qué está configurado a mano en GA4 y Netlify.

## Dónde vive la propiedad

- GA4: cuenta **trujas** (`414530221`), propiedad **trujas.app** (`562094841`), flujo web **trujas.app web** (`16261000262`), ID de medición `G-VJEZSX2XX3`. Creada el 3 nov 2026 con `miguel.carmona@ai-forges.com`. Es una cuenta aparte de la de velz.
- Netlify (proyecto `barber-assitant`): `NEXT_PUBLIC_GA_MEASUREMENT_ID` solo tiene valor en el contexto **Production**. Deploy Previews, branch deploys (`develop`) y local no miden. Next.js la incrusta en el build, así que un cambio de valor exige redeploy.
- Ya configurado en GA4:
  - País España, zona horaria Spain Time (GMT+01:00), moneda EUR.
  - Retención de datos de eventos y usuarios: 14 meses.
  - Uso compartido de datos: sin «Productos y servicios de Google» ni «Recomendaciones para tu empresa». Google Signals queda desactivado (por defecto, y el código además manda `allow_google_signals: false`).
  - Medición mejorada: activos scroll, clics salientes, vídeo y descargas. **Desactivados** «Cambios de página basados en eventos del historial del navegador» (el código manda los `page_view` con la URL saneada; si se activa, se duplican y llegan URLs sin sanear), búsqueda en el sitio e interacciones con formularios.
  - Dimensiones personalizadas (ámbito evento): `cta_id`, `cta_location`, `user_type`, `method`, `plan`, `billing_cadence`, `booking_step`.
- **Pendiente (manual)**: cuando lleguen los primeros eventos, marcar con la estrella en *Admin → Data display → Events* los key events `sign_up`, `onboarding_complete`, `checkout_completed` y `booking_complete`. Esta versión de GA4 no deja crearlos por nombre antes de recibirlos. `purchase` lo creó GA4 sola y se puede ignorar.
- Opcional: definir tráfico interno (*Data streams → Configure tag settings → Define internal traffic*) y dar acceso a más personas desde *Account access management*.

## Lo que hace el código

- `lib/analytics/index.ts`: runtime. `lib/analytics/url.ts`: saneado de URLs (puro, con tests). `components/analytics/Analytics.tsx`: se monta en `app/layout.tsx`, envía los `page_view` en cada navegación del App Router y pinta el banner.
- **Consent Mode v2, modo básico.** Todo empieza denegado y `gtag.js` no se carga hasta que el visitante pulsa «Aceptar». «Rechazar» y «Aceptar» tienen el mismo estilo y tamaño (AEPD). La elección se guarda en `localStorage` (`trujas_consent_v1`). Se puede cambiar desde «Cookies» en el pie de la landing o desde «Cambiar preferencias de cookies» en `/privacidad#cookies`. Al retirar el consentimiento se para la medición (`ga-disable-…`) y se borran las cookies `_ga*`. Publicidad (`ad_storage`, `ad_user_data`, `ad_personalization`) siempre denegada.
- **Sin `NEXT_PUBLIC_GA_MEASUREMENT_ID` no hace nada**: ni banner ni script ni `dataLayer`.
- **Nada privado llega a GA**:
  - `page_location`/`page_referrer` solo conservan los parámetros `utm_*`, `checkout`, `portal`, `plan` y `cadence`. Se eliminan `code` (Supabase), `session_id` (Stripe), `next`, emails, teléfonos y cualquier otro parámetro, y también el `#hash` (tokens de Supabase).
  - Los UUID del path pasan a `[id]` y los JWT/hex largos a `[token]` (`/dashboard/barberos/[id]/horario`).
  - Un referrer externo se reduce a su origen (`https://checkout.stripe.com/`).
  - En `/billing?checkout=success`, además, se quita `session_id` de la barra de direcciones.
  - Los eventos nunca llevan nombres, emails, teléfonos, IDs de base de datos ni texto libre (lo comprueba un test sobre las llamadas a `track()`). No se usa `user_id`.
- **`content_group`** en cada página: `landing`, `pricing`, `resources`, `auth`, `onboarding`, `billing`, `dashboard`, `client_account`, `booking_cancel`, `legal`, `shop`, `booking`.

### Eventos

| Evento | Cuándo | Parámetros |
|---|---|---|
| `cta_click` | Clic en «Empezar gratis», «¿Ya tienes cuenta?», «Ver todos los planes», «Ver planes» (recursos) y «Reservar» (página de barbería) | `cta_id`, `cta_location` |
| `begin_checkout` | Clic en un botón de checkout (landing, `/pricing`, `/billing`) | `plan`, `billing_cadence`, `cta_location` |
| `sign_up` | Alta por email creada; con Google, al pulsar «Crear cuenta con Google» (intención: Google no dice aún si la cuenta es nueva) | `method`, `user_type` |
| `login` | Login por email correcto; con Google, al pulsar «Entrar con Google» | `method`, `user_type` |
| `onboarding_complete` | El barbero termina el onboarding | `user_type` |
| `checkout_completed` | Vuelta de Stripe a `/billing?checkout=success` (una vez por pestaña) | — |
| `booking_start` | Se carga el flujo de reserva de una barbería activa | — |
| `booking_step` | Cada paso del flujo de reserva | `booking_step` (`barber`, `service`, `date`, `time`, `confirm`), `step_number` |
| `booking_slot_unavailable` | El hueco elegido ya no está libre (409) | — |
| `booking_complete` | Cita confirmada | `value`, `currency` (EUR), `service_duration_min` |
| `add_to_calendar` | «Añadir al calendario» tras reservar | — |
| `booking_cancelled` | Se abre `/cancel/success` | — |

Para añadir un CTA basta con atributos: `data-ga-event="cta_click" data-ga-cta-id="…" data-ga-cta-location="…"`. Cualquier `data-ga-*` se envía como parámetro en snake_case.

## Verificación

```sh
npm run test:analytics
npm run lint
# Build local con un ID de prueba (no es el de producción) y placeholders de docs/SEO.md:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST000000 npm run build && npm run start -- --hostname 127.0.0.1 --port 3214
```

En el navegador: sin elegir, no hay peticiones a `googletagmanager.com`/`google-analytics.com` y el `dataLayer` solo tiene el `consent default` denegado. Tras «Aceptar», carga `gtag.js` y sale `page_view` (`gcs=G101`). En DevTools → Network, filtrando por `collect`, comprueba que `dl` no lleva tokens.

## Lectura para agentes (Hermes)

Hermes lee GA4 con una cuenta de servicio de solo lectura, sin navegador:

- Cuenta de servicio `hermes-ga4-reader@hermes-oauth-501323.iam.gserviceaccount.com`, en el proyecto de GCP **hermes-oauth** (`hermes-oauth-501323`), donde están activadas la **Google Analytics Data API** (informes) y la **Google Analytics Admin API** (listar cuentas y propiedades con `accountSummaries`). No tiene roles en el proyecto.
- Acceso: rol **Viewer** en las propiedades GA4 trujas.app (`562094841`) y velz.io (`561805505`), desde *Admin → Property access management*. Puede leer informes, pero no cambiar la configuración.
- La clave JSON (`private_key_id` que empieza por `0f86c3b5`) vive solo en la máquina de Hermes, en `~/.hermes/ga4-reader.json` con permisos `600`. Nunca se sube a un repo: Google desactiva automáticamente las claves que detecta en repos públicos. Para rotarla, crea una nueva en *IAM → Service accounts → hermes-ga4-reader → Keys* y borra la anterior.
- En `~/.hermes/.env`:

  ```sh
  GOOGLE_APPLICATION_CREDENTIALS=$HOME/.hermes/ga4-reader.json
  GA4_PROPERTY_ID=562094841
  ```

- Uso (no necesita dependencias nuevas; usa `jose`):

  ```sh
  npm run report:ga4 -- --property trujas --days 28
  npm run report:ga4 -- --property velz --days 7 --json
  ```

  Saca el embudo (`page_view` → `cta_click` → `begin_checkout` → `sign_up` → `onboarding_complete` → `checkout_completed`, y `booking_start` → `booking_complete`), las sesiones por canal, los clics por CTA y las vistas por `content_group`. Un 403 significa que falta el rol Viewer en esa propiedad.
