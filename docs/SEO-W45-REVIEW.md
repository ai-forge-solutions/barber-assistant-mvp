# trujas · Revisión editorial 2026-W45

## Estado actual · entrega definitiva mediante PR #34

Por petición de Miguel, esta PR deja las cinco piezas listas para publicación/indexación mediante su aprobación y merge, sin una segunda aprobación editorial ni un parche posterior para quitar noindex. Se integró `develop` con la #35 preservando autoría colectiva, notas editoriales, JSON-LD y las dos guías históricas.

- Cuatro recursos y la función de reservas pasan a `approved` en el catálogo de publicación; se eliminan avisos de borrador. `approved` expresa elegibilidad de esta entrega, no que ya esté desplegada.
- `/funciones` y `/funciones/pagina-reservas` permiten `index, follow`. Las cuatro guías no emiten noindex y las seis URLs nuevas se añaden al sitemap y a `llms.txt`.
- Se mantienen canonicals de producción, catálogo finito, 404 reales, enlaces internos y CTAs a precios. Los previews de Netlify deben seguir protegidos con su cabecera noindex; esa protección no debe trasladarse a producción.
- No se inventan fechas de publicación: las novedades conservan `publishedAt=null` hasta que se confirme su publicación real. Se omite `datePublished` de su JSON-LD y no se muestra una fecha falsa. Esto no bloquea indexación.
- Los cuerpos Markdown y sus hashes de procedencia no se reescriben. Los archivos `provenance-2026-W45.json` documentan la preparación histórica como `pending_review`; no son el estado de publicación vigente.
- Revisión editorial/comercial independiente de las cinco piezas: sin bloqueantes comprobados; funciones, email, límites de cancelación, costes y cálculos contrastados con código y aritmética. No acredita revisión jurídica/fiscal profesional ni entrega real de emails.

### Verificación actual

- `npm ci --ignore-scripts`: instalación limpia desde lockfile, 605 paquetes.
- `npm run lint`: 0 errores, 7 warnings preexistentes fuera del cambio.
- `npm run build -- --webpack`: compilación, TypeScript y páginas estáticas correctos con configuración local fixture.
- Suite completa contra `next start`: **114 pass / 0 fail / 5 skip** (tres pruebas PostgreSQL dedicadas y dos lecturas reales de barberías). No se certifica DB real ni checkout.
- Chromium: siete rutas × 390/1440 px = **14 comprobaciones**, sin errores JS ni overflow horizontal de documento. Canonicals y ausencia de avisos/noindex del producto comprobados; CTA real de la función navega a precios. Capturas móviles inspeccionadas.
- Pruebas RED→GREEN de estado editorial, schema sin fecha inventada, función/hub sin bloqueo y ampliación del sitemap/llms.

### Comparación local de rendimiento con la #35 integrada

Chromium observado, viewport 390×844, contextos nuevos, orden alternado base/candidato y tres corridas por combinación; sin throttling de CPU/red. **No es Lighthouse, CWV de campo ni INP.** La suma de exceso de tareas largas observada fue 0 en las medianas, no una medición de TBT de Lighthouse.

| Ruta | LCP observado base → candidato (ms) | CLS base → candidato | Transferencia recursos base → candidato (bytes) | Requests |
|---|---:|---:|---:|---:|
| `/recursos` | 160 → 168 | 0,01237 → 0,01237 | 245617 → 246917 | 37 → 37 |
| `/recursos/organizar-agenda-barberia` | 168 → 172 | 0,00892 → 0,00892 | 224846 → 225794 | 30 → 30 |
| `/pricing` | 196 → 168 | 0,03984 → 0,03984 | 209106 → 209189 | 15 → 15 |

Estas diferencias locales pequeñas no acreditan mejora o ausencia universal de regresiones. La ampliación de navegación/contenido tiene el coste observado indicado.

### Frontera de aprobación y publicación

PR contra `develop`, sin auto-merge ni despliegue de producción por el agente. Su aprobación y merge completan la decisión editorial y técnica de esta entrega. La promoción de `develop` a la rama/contexto de producción sigue el flujo existente de Miguel: si producción no despliega `develop`, el merge de esta PR no la publica por sí solo. Una vez desplegada, el producto no impone ningún bloqueo editorial adicional a esas URLs. Indexable no garantiza que Google las indexe ni cuándo.

## Registro histórico de la preparación inicial (superado por el estado anterior)

## Alcance

Implementación para revisión, no autorización de publicación. Cuatro guías nuevas en `/recursos` y una página de función en `/funciones/pagina-reservas`, con hub `/funciones`.

| Pieza | Ruta | Aporte |
|---|---|---|
| Elegir software de reservas | `/recursos/elegir-app-reservas-barberia` | Ocho criterios y ficha de comparación con coste, salida y pruebas reales |
| Reducir no-shows | `/recursos/reducir-no-shows-barberia` | Nueve medidas, registro de cuatro semanas y política adaptable sin cargos |
| Página de reservas | `/funciones/pagina-reservas` | Cuenta requerida, cinco pasos reales y recordatorios por email sin prometer entrega |
| Calcular precios | `/recursos/calcular-precios-barberia` | Presupuesto rellenable y ejemplo sintético coste/tiempo/margen/IVA |
| Conseguir clientes de barrio | `/recursos/conseguir-clientes-barberia-barrio` | Plan de 90 días, reseñas sin selección/incentivos y medición de visitas |

Todos los textos están completos, con autoría editorial honesta y asistencia IA. Son `pending_review`, `publishedAt=null`, visibles como vista previa y con `noindex,nofollow`; no entran en sitemap. No se añade schema con fechas, expertos, oferta o testimonios ficticios. Los dos recursos anteriores, su procedencia, landing, precios, CSS global y proxy permanecen intactos.

Los borradores derivan de cinco briefs originales de claude-seo; la redacción y esta integración son trabajo editorial posterior de Hermes. El recibo nativo conserva `partial`, `workflow_verified=false`, aunque CLI terminó con exit 0: un Agent `seo-geo` no equivale a invocar la Skill requerida. El runtime nativo no estaba listo; no se reinstaló ni se relanzó. No se presentan los textos como entrega editorial nativa verificada.

Procedencia portable: `content/resources/provenance-2026-W45.json` y `content/features/provenance-2026-W45.json`; copias Markdown byte a byte con SHA-256 real, sin rutas privadas. La procedencia histórica no se reescribe.

## Validación local ejecutada

Entorno: build de producción local, backend con placeholders, sin credenciales reales ni operaciones de citas/pagos/email.

- `npm run build`: pasa compilación, TypeScript y generación estática de las rutas nuevas.
- `npm run lint`: exit 0, cero errores y siete warnings en archivos no modificados.
- `SEO_TEST_BASE_URL=http://127.0.0.1:3255 node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/*.test.mjs`: 84 pasan, cero fallan, tres integraciones PostgreSQL omitidas por falta del entorno dedicado. No es verificación de DB/producto real.
- Tests de contenido/componentes: catálogo finito, cuerpo Markdown íntegro, fuentes/hashes históricos, metadatos, fecha/noindex por estado y rechazo de traversal/HTML ejecutable.
- HTTP sobre servidor del build actual: seis recursos HTTP200 sin redirect; desconocidos 404; canonicals propios; robots/sitemap y fronteras auth históricas preservadas. Solo las cinco URLs históricas siguen en sitemap, sin lastmod inventado.
- Navegador real: siete rutas editoriales × 390/1440 px = 14 comprobaciones. Un H1, canonical, estado de revisión, sin overflow horizontal de documento ni page errors; once destinos internos únicos HTTP200; navegación real a `/pricing` desde cada página. Las tablas anchas tienen scroll accesible dentro de su contenedor.
- Capturas inspeccionadas en móvil para precio y función de reservas: jerarquía y texto legibles, aviso de revisión visible; sin capturas privadas del producto ni simulaciones presentadas como reales.
- Escaneo de líneas añadidas: sin credenciales hardcodeadas, shell injection o eval; única coincidencia de `dangerouslySetInnerHTML` es una aserción que lo prohíbe.

## Rendimiento antes/después

Lighthouse 13.6.0, móvil con throttling DevTools, medianas de tres corridas por ruta; 12 lecturas base conservadas y 12 del candidato. No son CWV de campo ni INP.

| Ruta | LCP base → candidato (ms) | CLS base → candidato | TBT base → candidato (ms) | Bytes base → candidato | Requests |
|---|---:|---:|---:|---:|---:|
| `/` | 1730 → 1667 | 0,143 → 0,143 | 237 → 218 | 425529 → 425522 | 31 → 31 |
| `/pricing` | 1559 → 1547 | 0,047 → 0,047 | 147 → 191 | 339504 → 339497 | 21 → 21 |
| `/recursos` | 1531 → 1550 | 0,013 → 0,013 | 252 → 153 | 368667 → 380822 | 37 → 41 |
| `/recursos/organizar-agenda-barberia` | 1525 → 1546 | 0,080 → 0,080 | 214 → 165 | 353631 → 354624 | 30 → 30 |

No se observa cambio de CLS; LCP varía entre −63 y +21 ms. La home conserva CLS 0,143 ya presente, fuera de «bueno» (0,1), sin modificar landing. `/pricing` aumenta la mediana TBT 44 ms; rangos base 127–548 ms y candidato 153–268 ms se solapan. Su código y requests son iguales; esto sugiere variabilidad del laboratorio, pero no demuestra ausencia de regresión de CPU ni mejora general. El índice pesa 12155 bytes más y cuatro requests extra al enlazar/prefetch de novedades; aumento explícito, no «cero coste». No se hicieron cambios globales para optimizar estas observaciones.

Revisión independiente estática focal: sin hallazgos accionables ni bloqueos; verificó hashes de las cinco piezas y los dos históricos, así como rutas protegidas. No repitió tests/build ni usó red.

## Pendiente antes de publicación

1. Revisión humana editorial y comercial de los cinco textos. Revisión fiscal de la guía económica; el ejemplo es sintético, no asesoramiento.
2. Capturas reales del recorrido de reservas con autorización y privacidad, o aceptación explícita de su omisión. No se atribuye al texto una demostración interactiva.
3. Preview remoto real del HEAD y revisión de noindex; una PR o el localhost no son una URL de preview público. Sin aprovisionar infraestructura ni modificar permisos.
4. Aprobación y promoción separadas por Miguel; esta PR no se fusiona ni modifica producción.

Las pruebas de contenido/HTTP/browser no certifican creación de una barbería, entrega de emails, checkout, pagos, conversiones o resultados SEO.
