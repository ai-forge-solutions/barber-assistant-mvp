# Sitemap trujas.app (COMPLETO, 2026-W47)

Leyenda: [PREVIO] = venía de la pasada anterior; [NUEVO] = verificado en esta pasada.

## Validación
| Check | Resultado |
|---|---|
| XML válido, namespace correcto [PREVIO] | PASS (12 URLs, muy por debajo de 50.000 / 50 MB) |
| Declarado en robots.txt [PREVIO] | PASS |
| priority/changefreq [PREVIO] | PASS (no presentes) |
| lastmod [PREVIO] | FAIL (Low): ninguna URL tiene lastmod |
| Status por URL [NUEVO] | PASS: 12/12 devuelven 200 (fetch_page.py), sin redirecciones (URL final = solicitada) |
| Canonical [NUEVO] | PASS: las 12 tienen canonical autorreferente idéntico al loc |
| Noindex [NUEVO] | PASS: ninguna con noindex. /funciones y /funciones/pagina-reservas llevan `index, follow` explícito; el resto sin meta robots (indexable por defecto) |
| Cobertura sitemap vs enlaces internos [NUEVO] | Ver abajo |

Evidencia en raw/: fetch_home, fetch_pricing, fetch_sobre-nosotros, fetch_recursos, fetch_r_montar, fetch_r_agenda, fetch_r_elegir, fetch_r_noshows, fetch_r_precios, fetch_r_clientes, fetch_funciones, fetch_f_reservas, fetch_privacidad, fetch_terminos (.json). Meta extraídas con parse_html.py (salida solo en consola, no persistida; limitación). Cabeceras HTTP (X-Robots-Tag) NO MEDIDO.

## Tabla por URL [NUEVO]
| URL | Status | Canonical | Robots | Palabras |
|---|---|---|---|---|
| / | 200 | ok | - | 748 |
| /pricing | 200 | ok | - | 421 |
| /sobre-nosotros | 200 | ok | - | 277 |
| /recursos | 200 | ok | - | 355 |
| /recursos/montar-barberia-espana | 200 | ok | - | 2898 |
| /recursos/organizar-agenda-barberia | 200 | ok | - | 1509 |
| /recursos/elegir-app-reservas-barberia | 200 | ok | - | 2120 |
| /recursos/reducir-no-shows-barberia | 200 | ok | - | 2184 |
| /recursos/calcular-precios-barberia | 200 | ok | - | 1875 |
| /recursos/conseguir-clientes-barberia-barrio | 200 | ok | - | 2045 |
| /funciones | 200 | ok | index, follow | 90 |
| /funciones/pagina-reservas | 200 | ok | index, follow | 1177 |

## Páginas enlazadas no incluidas en sitemap [NUEVO]
- /privacidad y /terminos (enlazadas desde el footer de la home): 200, pero SIN canonical, SIN meta robots, y con title/description idénticos a la home (se sirven con "BAILOUT_TO_CLIENT_SIDE_RENDERING"; metadatos de la home heredados). Contenido propio: 611 y 398 palabras. Es correcto no listarlas en el sitemap (páginas legales), pero conviene darles metadatos propios y canonical; decidir si noindex o index (Medium/Low).
- /auth/barber?next=%2Fdashboard (enlazada desde home): área de login; no debe estar en sitemap. Su robots/noindex NO MEDIDO.
- Fuera del sitemap no se detectan más URLs internas enlazadas. Descubrimiento limitado a enlaces de las 14 páginas fetcheadas; no se hizo crawl completo.

## Calidad [NUEVO]
- Sin patrón doorway/ubicaciones: 0 páginas de localización, quality gates no aplican.
- Las 6 guías tienen 1.500-2.900 palabras, con fuentes oficiales y nota editorial; sin señales de plantilla repetida a nivel de H1/H2.
- /funciones es delgada (90 palabras, es un hub); considerar ampliar o fusionar. Riesgo Medium/Low.
- Fechas: solo montar-barberia-espana y organizar-agenda-barberia declaran datePublished (2026-11-02) en JSON-LD; las otras 4 guías no tienen fecha en el schema.
- Enlazado: /funciones no está enlazada desde la home ni desde el nav; solo desde /recursos y /funciones/pagina-reservas. Mejorar enlace interno.

## Recomendaciones
1. Añadir lastmod real (W3C, YYYY-MM-DD) por URL, basado en la última modificación sustancial del contenido (fecha de commit/publicación del contenido, no la fecha del build). Referencia: las dos guías con fecha 2026-11-02. No usar la misma fecha para todo.
2. Mantener sin priority/changefreq.
3. Añadir canonical y metadatos propios (title, description) a /privacidad y /terminos; decidir indexación.
4. Añadir datePublished/dateModified al schema Article de las 4 guías restantes y alinearlo con lastmod.
5. Enlazar /funciones desde la home/nav y ampliar su contenido.
6. Tras publicar cambios, reenviar sitemap solo por canales manuales del propietario (no se ha enviado ni hecho ping desde esta auditoría).

## NO MEDIDO
X-Robots-Tag, robots.txt bloqueos por URL en detalle, indexación real (GSC), crawl completo, tamaño en bytes del sitemap, validación parse_html persistida.
