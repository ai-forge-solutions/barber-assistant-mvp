# MIG-84 — Auditoría performance/Core Web Vitals

## Presupuesto y perfil objetivo mínimo

Perfil objetivo para rutas públicas críticas (`/`, `/pricing`, `/[slug]`, `/[slug]/reservar`): móvil 4G medio, CPU móvil de gama media, primera visita sin caché de HTML y con caché de assets estáticos cuando aplique.

Presupuesto mínimo usado antes de tocar código:

| Área | Objetivo |
| --- | --- |
| LCP | ≤ 2.5s p75; LCP textual o imagen priorizada y presente en HTML inicial cuando sea posible. |
| INP | ≤ 200ms p75; evitar JavaScript cliente innecesario en landing/precio y handlers síncronos pesados. |
| CLS | ≤ 0.1; reservar tamaño para imágenes/logos/avatares y evitar contenido inyectado encima del viewport. |
| JS comprimido por ruta pública | < 300 KB cuando sea viable; mover componentes estáticos fuera del bundle cliente. |
| Imágenes above-the-fold | < 500 KB y con dimensiones/espacio reservado. |
| Fonts/terceros | Mantener fuentes con `display=swap`; evitar terceros no necesarios en rutas públicas. |

## Auditoría inicial

### `/`

- LCP esperado: bloque hero textual (`h1`) sobre fondo negro; no hay imagen hero en la versión actual tras merge de MIG-82/MIG-83.
- INP: la landing importaba `PricingTeaser` desde `components/pricing/PricingBlocks.tsx`, que es un módulo `use client` por el toggle interactivo de `/pricing`. Eso hacía que una sección mayormente estática de la home entrara en el bundle cliente.
- CLS: no se observan imágenes above-the-fold ni embeds. Las secciones usan tamaños estáticos. La carga de fuentes puede producir cambio menor, mitigado por `display=swap`.

### `/pricing`

- LCP esperado: `h1` textual y cards de precio en HTML inicial.
- INP: el toggle anual/mensual necesita cliente (`useState`), pero el scope interactivo se limita a `PricingCards`.
- CLS: no hay imágenes. Las cards colapsables usan `hidden/block`; el cambio ocurre por interacción del usuario, por lo que no cuenta como CLS inesperado.

### `/[slug]`

- LCP esperado: nombre de barbería y, si existe, `logo_url` en header.
- CLS: `logo_url` y `photo_url` se renderizaban con `<img>` sin atributos `width`/`height`; aunque Tailwind fija `w-16 h-16`, los atributos ayudan al navegador a reservar ratio y a reducir avisos Lighthouse.
- Carga de datos: la ruta consulta Supabase en servidor y además `generateMetadata` hace queries extra para `shops`/`services`; no se cambia el comportamiento porque depende de auth/cookies y contenido por barbería.

### `/[slug]/reservar`

- LCP esperado: estado `Cargando…` inicial porque la ruta es cliente y valida auth + perfil + carga shop/barberos/servicios desde API.
- INP: no se detectan loops grandes ni listeners globales; calendario usa `date-fns` y arrays pequeños del mes. El cálculo de slots ocurre bajo demanda contra `/api/availability`.
- CLS: fotos de barberos en step 0 se renderizaban con `<img>` sin atributos `width`/`height`.
- Carga de datos: shop, barberos y servicios son datos públicos relativamente estables; pueden aceptar caché HTTP corta. Disponibilidad no se cachea porque cambia por reservas/bloqueos.

## Fixes aplicados

- Separé el teaser de pricing de la home en `components/pricing/PricingTeaser.tsx` para que `/` no importe el módulo `use client` completo de `PricingCards`. Impacto esperado: menos JavaScript cliente e hidratación en landing; mejora de INP/TBT sin cambiar copy ni diseño.
- Añadí `width`/`height` a logos y fotos de barberos en `/[slug]` y `/[slug]/reservar`. El logo above-the-fold usa `fetchPriority="high"`; las fotos de equipo bajo el fold usan `loading="lazy"` y `decoding="async"`. Impacto esperado: menos CLS/avisos Lighthouse y carga de imágenes más predecible.
- Añadí `Cache-Control: public, max-age=60, stale-while-revalidate=300` a los endpoints públicos de catálogo (`/api/shops`, `/api/shops/[id]/barbers`, `/api/shops/[id]/services`). Impacto esperado: menos latencia repetida en el flujo `/[slug]/reservar` para datos estables; no se cachea `/api/availability` porque los huecos son sensibles a reservas recientes.

## Evidencia por métrica

- LCP: `/` y `/pricing` tienen LCP textual; `/[slug]` reserva tamaño y prioridad para el logo si existe; no se introdujeron imágenes above-the-fold nuevas.
- INP: la home deja de cargar el bundle interactivo de cards de pricing. `/pricing` mantiene el JS necesario para el toggle anual/mensual. `/[slug]/reservar` conserva handlers pequeños; no se detectaron tareas síncronas grandes.
- CLS: se reservan dimensiones explícitas en logos/fotos dinámicas de rutas públicas. No hay iframes/ads/embeds ni contenido inyectado sobre el viewport.

## Validación local

- `npm run lint`: pasa con 7 warnings preexistentes/no bloqueantes.
- `npm run build`: el primer intento sin variables falló por `supabaseUrl is required`; se repitió con variables dummy locales para validar compilación/TypeScript y pasó.
- Smoke con `next start` local y `curl`:
  - `/` → 200, HTML sirve título `trujas — Agenda online para barberías`.
  - `/pricing` → 200, HTML sirve correctamente.
  - `/demo` → 307 esperado hacia login cliente (`/[slug]` requiere auth cliente antes de cargar barbería).
  - `/demo/reservar` → 200, shell cliente sirve correctamente; la carga real de datos requiere Supabase/configuración de entorno.
