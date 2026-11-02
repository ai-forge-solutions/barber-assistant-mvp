# trujas · Base técnica SEO y límites de publicación

## Alcance

Base desde `develop`: rutas públicas `/robots.txt` y `/sitemap.xml`, metadata inicial de home/precios y pruebas HTTP de regresión. No crea artículos, no publica en producción, no configura cron, analítica, OAuth, Stripe ni base de datos. No cambia copy/JSX, diseño, precios, recordatorios, checkout ni autenticación de reservas.

## Causa y solución

Sin rutas de metadata, `/robots.txt` y `/sitemap.xml` coinciden con `app/[slug]/page.tsx`. Esa página requiere login de cliente antes de consultar la barbería y devuelve 307. Las convenciones `app/robots.ts` y `app/sitemap.ts` generan rutas estáticas específicas, con prioridad sobre `[slug]`. El proxy excluye **solo esos dos paths exactos**; mantiene el refresco de sesión en rutas de producto.

El sitemap enumera exclusivamente `https://trujas.app/` y `/pricing`. No consulta Supabase ni incluye barberías, datos de clientes, reservas, tokens o borradores. No inventa `lastmod`. Nuevas rutas editoriales requieren revisión y alta explícita; no se publica un directorio de barberías.

Robots permite el contenido público y desaconseja rastrear superficies operativas. `Disallow` no autentica ni garantiza desindexación: la autenticación existente sigue siendo el límite de acceso. No se ha convertido `/[slug]` en página pública ni corregido su comportamiento heredado para slugs inexistentes (también redirigen al login).

Canonicals y Open Graph se declaran en cada página de marketing, **nunca como canonical global en root layout**. Se conservan título y descripción de home; precios tiene metadata específica sin inventar descuentos o condiciones. No se añaden reviews, ratings ni estadísticas estructuradas ficticias.

## Verificación local reproducible

```sh
npm ci --no-audit --no-fund
npm run lint
# Valores ficticios únicamente para compilar/smoke local. No copiar a producción.
export NEXT_PUBLIC_SUPABASE_URL=https://trujas-seo.invalid
export NEXT_PUBLIC_SUPABASE_ANON_KEY=local-placeholder
export SUPABASE_SERVICE_ROLE_KEY=local-placeholder
export RESEND_API_KEY=re_local_placeholder
export STRIPE_SECRET_KEY=sk_test_local_placeholder
export NEXT_TELEMETRY_DISABLED=1
npm run build
npm run start -- --hostname 127.0.0.1 --port 3214
# En otra terminal con el servidor listo:
SEO_TEST_BASE_URL=http://127.0.0.1:3214 npm run test:seo
```

La suite valida status/content-type de robots y sitemap, allowlist de URLs, metadata en HTML inicial, CTA hacia precios y conservación de login de cliente/barbero, incluidas rutas de metadata parecidas pero no iguales. No crea usuarios, reservas, pagos, correos ni eventos de conversión. No prueba entregas reales de Supabase/Resend/Stripe; los placeholders no son credenciales ni prueba del backend.

El repositorio no tenía suite general de tests: `test:seo` es una suite HTTP focalizada, no cobertura funcional completa del producto. Requiere un build y servidor actuales: editar fuente después de compilar exige reconstruir antes de dar por verde la prueba.

## Operación editorial separada

Workspace local de trujas: `/home/hermes/seo-trujas`, separado de Velz (método de referencia, nunca estado compartido). Configuración local, evidencias GSC, investigaciones, revisiones y entregas tienen raíz propia. No se incluye el snapshot GSC ni secretos en Git.

Flujo: investigar intención del dueño de barbería → priorizar por evidencia → redactar artefacto versionado → revisión identificada por hash → implementación en rama/PR a `develop` → publicación autorizada por separado → comprobar URL real → medir. Una PR no es publicación, un clic no es alta y un alta no es activación ni pago.

Hasta verificar el contrato real de producto, el plan Basic declara recordatorios **por email** en `lib/billing/pricing.ts`. No convertir el mockup de WhatsApp en promesa de automatización universal en nuevos contenidos. El compromiso anual y el precio posterior a la prueba deben explicitarse al citar precios; la página `/pricing` es la referencia comercial actual.

## Puertas pendientes antes de automatizar o publicar

- Revisión/merge a `develop` y autorización separada para producción; comprobar robots/sitemap/metadatos en el despliegue real, no inferirlos del build.
- Elegir estructura editorial sin colisionar con `[slug]`; no hay nuevas páginas editoriales en este cambio.
- Consentimiento/analítica y atribución de prueba, configuración, primera reserva y pago: propuesta, no instrumentación instalada. No enviar PII ni simular conversiones.
- Destino de revisión/entrega propio de trujas y permisos de envío aprobados explícitamente. No heredar carpetas o autorizaciones de Velz.
- Medición móvil antes/después en condiciones equivalentes; resultados de laboratorio local no son datos de campo ni INP real.
- Cron y publicación automática permanecen desactivados. Ningún script de esta PR programa jobs o publica contenido.
