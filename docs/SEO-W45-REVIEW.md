# trujas · Revisión editorial 2026-W45

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
