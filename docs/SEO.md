# trujas · SEO y publicación de recursos

## Alcance

Rutas públicas de rastreo `/robots.txt` y `/sitemap.xml`, metadatos de home/precios y sección editorial `/recursos` con dos guías aprobadas por Miguel el2/11/2026. La autorización puntual de publicar estos textos no activa cron ni autopublicación futura. No se cambian DB, OAuth, Stripe, servicios de email, precios ni autenticación de reservas.

La landing conserva su contenido y diseño salvo un enlace «Guías para barberos» en el footer. No se utiliza la publicación como pretexto para promover otros cambios pendientes de develop a producción.

## Rutas y seguridad

Sin rutas de metadata, `/robots.txt` y `/sitemap.xml` coincidían con `app/[slug]/page.tsx`, que requiere login antes de consultar la barbería. Las convenciones `app/robots.ts` y `app/sitemap.ts` tienen prioridad específica. El proxy excluye solo esos dos nombres exactos; se preservan sus near-matches y el límite de sesión de las reservas.

Sitemap explícito: home, precios, índice de recursos y los dos artículos aprobados. No consulta Supabase ni enumera barberías, clientes, citas, tokens o borradores. No inventa fechas lastmod en cada build. Añadir otra pieza requiere contenido aprobado e inclusión explícita.

Robots desaconseja rastrear superficies operativas; no autentica ni garantiza desindexación. Los canonicals se declaran por página, nunca uno global que dirija cuentas/barberías a la home. No se inventan autores expertos, ratings, reseñas ni resultados.

La sección editorial estática usa una allowlist de slugs. Los desconocidos deben dar404, no login o200 de fallback. Markdown versionado dentro del repo, sin dependencia runtime del workspace del operador; render de servidor sin habilitar HTML crudo de Markdown. La procedencia/hashes y eliminación de envoltorios de revisión deben poder verificarse sin copiar secretos o datos GSC al repo.

## Verificación reproducible

```sh
npm ci --no-audit --no-fund
npm run lint
npm run test:resources
# Solo placeholders para compilación y smoke local, nunca producción:
export NEXT_PUBLIC_SUPABASE_URL=https://trujas-seo.invalid
export NEXT_PUBLIC_SUPABASE_ANON_KEY=local-placeholder
export SUPABASE_SERVICE_ROLE_KEY=local-placeholder
export RESEND_API_KEY=local-placeholder
export STRIPE_SECRET_KEY=local-placeholder
export NEXT_TELEMETRY_DISABLED=1
npm run build
npm run start -- --hostname 127.0.0.1 --port 3214
# En otra terminal, tras verificar disponibilidad:
SEO_TEST_BASE_URL=http://127.0.0.1:3214 npm run test:seo
SEO_TEST_BASE_URL=http://127.0.0.1:3214 node --test tests/resources-http.test.mjs
```

Los tests de datos/contenido son independientes del servidor. Los tests HTTP requieren un build y servidor actuales; no basta con editar la fuente del proceso `next start`. Comprobar además móvil, tablas con scroll confinado, enlaces índice→post→precios y ausencia de estados/nota de revisión en UI.

Los placeholders no prueban Supabase, Resend o Stripe. No crear usuarios, reservas, correos, cobros o conversiones ficticias para validar publicación. Suite SEO focalizada no equivale a cobertura funcional total. Registrar warnings preexistentes y no presentarlos como nuevos errores.

## Aprobación, promoción y cierre

Flujo: fuente/version/hash → aprobación → implementación/PR a develop → pruebas/preview → promoción selectiva a main autorizada → revisión desplegada/URLs reales. No identificar clic en CTA con alta, ni alta con activación o pago.

Si main y develop divergen, inspeccionar commits y diff primero. Promover únicamente commits/paths editoriales y su base técnica, preservando fixes de producción y otros cambios pendientes. Probar también la rama concreta de release. No afirmar publicación por haber abierto una PR o recibido un check de preview.

El workspace `/home/hermes/seo-trujas` conserva investigación, aprobaciones, evidencias y entregas aisladas de Velz. No es una dependencia de la web publicada. La fuente comercial de Basic declara recordatorios por EMAIL, no WhatsApp universal. Revalidar precios y compromiso al modificar contenidos.

Analítica alta→configuración→uso→pago, envío de informes y cron tienen contratos/permisos separados. La publicación puntual no los instala ni activa. `docs/SEO-VERIFICATION.md` conserva evidencia histórica de la primera base sin artículos; la publicación posterior se verifica y registra separadamente.
