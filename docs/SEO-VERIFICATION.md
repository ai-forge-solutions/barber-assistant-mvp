# Verificación de base SEO · 2 noviembre 2026

## Alcance y revisión base

- Base `develop`: `fd34d2993dc8eef6c12af351c378e54b941aa684`. No contiene ni despliega artículos.
- Root cause reproducido: faltaban rutas metadata y `/[slug]` exige sesión antes de validar la barbería. Sin sesión, robots/sitemap acababan en login. Se añaden rutas específicas sin debilitar el login de reservas.
- React/JSX de home y precios: cuerpos de ambas funciones idénticos a develop; solo imports/metadata añadidos. Sin cambios en componentes, checkout, API, DB, OAuth, precios o recordatorios.
- Canonicals solo en `/` y `/pricing`, absolutos; no canonical global hacia la home. Sitemap allowlist de esas dos URL, sin clientes, slugs, borradores ni URLs inventadas. Robots no es seguridad ni noindex.
- Proxy excluye únicamente nombres exactos robots.txt y sitemap.xml; rutas parecidas y protegidas siguen autenticadas.

## Ejecución real

- `npm ci --no-audit --no-fund`: correcto; no dependencias añadidas.
- `npm run build`: correcto (incluye TypeScript); `npm run lint`: exit0, sin errores y con los mismos siete warnings ya presentes en develop (verificado también en el worktree base).
- `node --test tests/seo-http.test.mjs` contra base: **4 fallos/3 éxitos**. Contra candidato: **7 éxitos/0 fallos**. Los fallos de base son exactamente rutas metadata/canonicals ausentes.
- HTTP local production build: robots200 text/plain, sitemap200 XML, canonical/OG/twitter específicos; login conservado en dashboard/agenda, barbería desconocida y nombres parecidos a metadata. Robots no crea cookie ni redirige.
- Puppeteer: home y precios a390px y1440px, navegación CTA real home→pricing, sin overflow horizontal ni errores runtime/console. Revisión visual de capturas móviles: CTA y tarjetas legibles, sin clipping. Capturas completas incluyen estados de animaciones/lazy loading: no prueban todos los estados interactivos ni todos los elementos diferidos.
- Entorno: Node22.23.1, Next16.2.9, Chrome for Testing156.0.8078.4 (instalación Playwright chromium-1248), Lighthouse13.6.0. Variables locales placeholder, Supabase inválido a propósito. No se hicieron reservas/altas/pagos/emails ni llamadas de escritura a servicios reales. No es un smoke de producción ni de backends.

## Rendimiento: primera tanda

Tres ejecuciones móviles por URL y revisión, misma máquina y producción local, Lighthouse con throttling simulado. LCP/TBT en ms; CLS sin unidad. Mediana y rango:

| Ruta | Métrica | Base | Candidato |
|---|---|---|---|
| `/` | LCP | 803.853 (783.679–854.147) | 870.305 (827.525–870.803) |
| `/` | CLS | 0.037 (0.037–0.037) | 0.037 (0.037–0.037) |
| `/` | TBT | 125.145 (95–191.0) | 201 (140–272.5) |
| `/` | bytes | 466530 (466530–467161) | 466929 (466929–467559) |
| `/` | requests | 32 (32–32) | 32 (32–32) |
| `/pricing` | LCP | 903.103 (783.246–910.428) | 775.1 (773.629–775.359) |
| `/pricing` | CLS | 0.046 (0.046–0.046) | 0.046 (0.046–0.046) |
| `/pricing` | TBT | 737.327 (415.377–1416.0) | 94.923 (91.927–96.0) |
| `/pricing` | bytes | 338718 (324640–338718) | 339037 (339037–339037) |
| `/pricing` | requests | 21 (21–21) | 21 (21–21) |

La variabilidad de TBT es importante, especialmente en precios. La home mostró TBT mayor en esta tanda; por eso no se aceptó basándose en un score y se repitió alternando revisiones. No se atribuye a metadata la mejor puntuación de precios ni se promete mejora de velocidad.

## Confirmación serial home

Una instancia de navegador, orden AB/BA/AB, tres ejecuciones por revisión. Throttling **DevTools real**: CPU4×, latencia562.5ms, descarga1474.56Kbps, viewport412×823. No mezclar estas cifras con la primera tanda simulada.

| Métrica | Base mediana (rango) | Candidato mediana (rango) |
|---|---|---|
| LCP | 1709.812 (1670.047–1721.355) | 1696.94 (1635.872–1720.957) |
| CLS | 0.143 (0.143–0.143) | 0.143 (0.143–0.143) |
| TBT | 219.519 (136.132–234.208) | 232.407 (195.682–244.28) |
| bytes | 426545 (426522–427175) | 426935 (426935–426935) |
| requests | 31 (31–31) | 31 (31–31) |

LCP y TBT quedan dentro de rangos solapados, CLS y peticiones idénticos; el aumento de TBT inicial no se reproduce como degradación consistente. No se han añadido dependencias ni lógica de cliente. CLS0.143 en este perfil ya existe en develop: no se presenta como arreglado ni se oculta tras la puntuación. TBT no equivale a INP; sin datos de campo.

## Evidencia y límites

Detalles completos conservados en workspace local aislado `/home/hermes/seo-trujas/evidence/`: seo-http-red/green.txt, web-base/, web-candidate/, web-confirmation/, verified-summary.json. Los logs/capturas locales no son URLs de preview o evidencia pública descargable desde esta PR; se incluye aquí el resumen reproducible sin datos privados. Instrucciones: docs/SEO.md. No se ha verificado Netlify/hosting, revisión desplegada, Googlebot, indexación, Search Console submission ni conversión. No deploy/cron/main. Antes de producción: autorización separada y smoke de revisión real.
