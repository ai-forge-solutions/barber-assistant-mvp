# Technical SEO - https://trujas.app/ (2026-W47) - COMPLETO

Score Technical SEO: **78/100**

Stack: Netlify + Next.js (Turbopack, App Router), HTML prerenderizado (`X-Nextjs-Prerender: 1`), gzip. Evidencia: raw/render-home.json, raw/pages/*.html (14 ficheros), robots.txt, sitemap.xml, fetch_page.py (http/www/404/indexnow.txt).

## Estado por categoria
| Categoria | Estado |
|---|---|
| Crawlability | PASS (robots permisivo, solo rutas privadas en Disallow, Sitemap declarado) |
| Indexabilidad | PARCIAL (/privacidad y /terminos sin canonical y con metadatos genericos) |
| Seguridad | PARCIAL (HSTS y nosniff si; faltan CSP, X-Frame-Options/frame-ancestors, Referrer-Policy, Permissions-Policy) |
| URLs/redirecciones | PASS |
| Movil | PASS (viewport correcto; resto NO MEDIDO) |
| Rendering JS | PASS con matiz (SSR/prerender; BAILOUT en todas las paginas) |
| Datos estructurados | PASS parcial (detectado; validacion fina fuera de alcance) |
| IndexNow | No implementado (Info) |

## Hallazgos

### High
**H1. /privacidad y /terminos: sin canonical, title/description genericos de la home, sin og:*; no estan en el sitemap pero son indexables (sin meta robots).**
- Evidencia: raw/pages/privacidad.html, raw/pages/terminos.html (title "trujas - Agenda online para barberias", description de la home, sin `<link rel=canonical>`, sin `meta robots`; solo `<h1>` presente).
- Riesgo: titulos duplicados con la home, paginas legales que compiten o se canibalizan; senal de que no usan `generateMetadata`.
- Recomendacion: definir `metadata` propio (title "Politica de privacidad | trujas", description, `alternates.canonical`), y decidir si se indexan (si no, `robots: {index:false, follow:true}`; si si, anadir al sitemap). Aplicar tambien al metadata de pagina de 404 (el titulo del RSC es "Barberia - trujas" pero el `<head>` renderizado muestra el generico).

### Medium
**M1. Sin imagen social (og:image / twitter:image) en ninguna de las 14 paginas; twitter:card=summary.**
- Evidencia: Grep `og:image|twitter:image` = 0 coincidencias en raw/pages.
- Recomendacion: og:image 1200x630 por defecto en el layout (y por guia si procede), `twitter:card=summary_large_image`.

**M2. Cabeceras de seguridad incompletas.**
- Presentes: `Strict-Transport-Security: max-age=31536000`, `X-Content-Type-Options: nosniff`.
- Ausentes: Content-Security-Policy, X-Frame-Options o `frame-ancestors`, Referrer-Policy, Permissions-Policy. HSTS sin `includeSubDomains`/`preload`. `X-Powered-By: Next.js` expone el stack.
- Evidencia: cabeceras de fetch_page.py (raw/render-home.json y consulta http/www/404).
- Recomendacion: en `netlify.toml` / `next.config` `headers()`: `X-Frame-Options: DENY` (o CSP frame-ancestors 'none'), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimo, CSP en Report-Only primero; `poweredByHeader:false`; HSTS con `includeSubDomains` (y `preload` solo tras verificar subdominios).

### Low
**L1. `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING">` en las 14 paginas.** Evidencia: Grep en raw/pages. Next.js marca un limite Suspense que cae a CSR (tipico de `useSearchParams`/`dynamic(ssr:false)`/componente cliente sin Suspense en un layout compartido). Como el contenido principal (h1, texto, JSON-LD, enlaces) ya esta en el HTML servido, el impacto SEO actual es bajo; el coste es JS extra/hidratacion mas lenta (INP/LCP). Recomendacion: localizar el componente en el layout (aparece justo tras `<div hidden>` antes del header; candidato: cabecera/navegacion/banner cliente), envolver con `<Suspense>` alrededor solo del fragmento que usa `useSearchParams` o moverlo a hoja del arbol para que el resto se renderice estatico.

**L2. Un solo `<h1>` por pagina (OK) pero la estructura h2/h3 y enlazado interno no se auditaron en profundidad** (ver informe de contenido).

**L3. Fuentes de Google (Rye, Oswald, DM Sans) via CSS externo con `preload as=style` + `<link stylesheet>` render-blocking.** Posible impacto en LCP; considerar `next/font` (autoalojado). NO MEDIDO con datos reales.

**L4. 404 con `noindex` y status 404 reales (correcto)**, pero sin enlaces utiles salvo "Volver al inicio". Info/mejora menor: anadir enlaces a /recursos y /funciones.

### Info (correcto)
- **Redirecciones**: `http://trujas.app/` -> 301 -> `https://trujas.app/`; `https://www.trujas.app/` -> 301 -> `https://trujas.app/` (redirect_chain de fetch_page.py). Un solo salto, host canonico sin www. PASS.
- **Status**: las 14 URLs 200; ruta inexistente `/no-existe-seo-check-404` -> 404 real con `meta robots noindex` (no soft-404).
- **Canonicals**: autorreferenciales y absolutos en home, pricing, sobre-nosotros, recursos, 6 guias, funciones, pagina-reservas (excepto H1). Coherentes con el sitemap (12 URLs).
- **Meta robots**: `index, follow` explicito solo en /funciones y /funciones/pagina-reservas; resto sin etiqueta (indexable por defecto). Sin X-Robots-Tag noindex.
- **robots.txt**: `Allow: /`, Disallow de /api/, /auth/, /dashboard, /billing, /onboarding, /cuenta/, /cancel/; `Sitemap: https://trujas.app/sitemap.xml`. Sin bloqueo de CSS/JS ni de crawlers de IA. Ver findings/sitemap.md.
- **Idioma**: `<html lang="es">` en todas; `og:locale=es_ES`; JSON-LD `inLanguage: es`. **hreflang**: no existe (sitio monolingue, no necesario; no se delega a seo-hreflang).
- **Movil**: `<meta name="viewport" content="width=device-width, initial-scale=1">`. Boton/enlace con `min-h-11` (44px) visto en la 404. Resto de tap targets NO MEDIDO.
- **URL structure**: minusculas, guiones, sin parametros, jerarquia clara (/recursos/*, /funciones/*). Nota: mezcla /pricing (EN) con resto en espanol (/funciones, /sobre-nosotros); considerar /precios con 301 (Low, coste de migracion; no urgente).
- **Cache/compresion**: HTML `max-age=0, must-revalidate`, edge cache Netlify hit, gzip. Sin Brotli visible (Content-Encoding gzip).
- **Datos estructurados** (detectados, sin validar contra Rich Results): home Organization + WebSite; guias Article + BreadcrumbList; /recursos ItemList + BreadcrumbList; /sobre-nosotros graph Organization/AboutPage. Organization sin logo/sameAs (mejora E-E-A-T, Low). Article en montar-barberia-espana y organizar-agenda muestra `datePublished`; comprobar `dateModified`/`author` en el resto (ver informe schema/contenido).
- **Rendering JS**: HTML del servidor ya contiene `<title>`, meta, canonical, h1 y JSON-LD (raw fetch, `mode_used: raw`); no se requiere JS para indexar contenido. `is_spa` no concluyente (null en modo raw).
- **IndexNow**: `https://trujas.app/indexnow.txt` -> 404; no se conoce fichero de clave `<key>.txt`. No se envio nada. Info: sin IndexNow (Bing/Yandex/Naver). Recomendacion opcional: generar clave, publicar `/<key>.txt` en `/public` y enviar URLs nuevas con indexnow_submit.py tras cada despliegue; Google no lo usa.

## Prioridades
1. (High) Metadatos/canonical de /privacidad y /terminos (decidir index/noindex + sitemap).
2. (Medium) og:image/twitter:image por defecto.
3. (Medium) Cabeceras de seguridad (X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP, HSTS ampliado, quitar X-Powered-By).
4. (Low) Resolver BAILOUT_TO_CLIENT_SIDE_RENDERING con Suspense acotado; fuentes con next/font.
5. (Low/Info) IndexNow, enlaces en 404, consistencia idioma en /pricing.

## NO MEDIDO
- Core Web Vitals reales (LCP/INP/CLS): no se ejecuto pagespeed_check/CrUX; solo indicios de fuente (fuentes externas, hidratacion por BAILOUT).
- Tap targets y layout movil completos (sin render movil/capturas).
- Validacion Rich Results/Schema.org detallada y completitud de Article en las 6 guias.
- Cabeceras de recursos estaticos (/_next/static), cache inmutable, Brotli.
- Cabeceras exactas de /privacidad, /terminos, /funciones* (solo contenido HTML analizado; status 200 confirmado).
- Enlaces rotos/internos y cadenas de redireccion de URLs con barra final (`/funciones/`), mayusculas, parametros.
- Indexacion real en Google/Bing (GSC no disponible).
- sitemap_discovery.py: validacion cubierta en findings/sitemap.md (no repetida).
