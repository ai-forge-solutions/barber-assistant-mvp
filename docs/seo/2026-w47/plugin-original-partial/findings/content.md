# Content Quality / E-E-A-T / On-Page: trujas.app

Auditoría claude-seo 2.5.0, semana 2026-W47 (fecha de análisis 2026-11-24). Estado: COMPLETO.
Marco: QRG de Google (11-09-2025). Las ponderaciones E-E-A-T y los umbrales de palabras son heurísticas internas de la skill, no reglas de Google.

## Scores

| Métrica | Score | Nota |
|---|---|---|
| **Content Quality** | **56/100** | Las guías son buenas (con fuentes y ejemplos numéricos); fallan la confianza y la experiencia |
| **On-Page** | **68/100** | Lo básico está bien; títulos largos, /funciones flojo, /pricing sin salida |
| E-E-A-T ponderado | 38/100 | Ver desglose |
| AI citation readiness | 66/100 | |

### Desglose E-E-A-T
| Factor (peso) | Score | Evidencia |
|---|---|---|
| Experience (20%) | 30 | No hay casos reales, testimonios ni capturas del producto (0 imágenes en guías y en /funciones/pagina-reservas). El único profesional del sector (Pablo, Trubarber, Galicia) aparece desautorizado de forma explícita en las 6 guías: "Esa firma no atribuye la redacción ni la revisión a Pablo". Los datos de la home ("Marcos Ruiz", "Barbería Norte") son ficticios. |
| Expertise (25%) | 50 | Contenido técnicamente cuidadoso: ejemplo de coste por minuto (9.240/6.468 min, 0,4638 €/min), diferencia entre margen y recargo, IVA al 21 % con cita a la AEAT, modelo 036, RETA/Importass, LGDCU art. 60 y AEPD. No hay credenciales: la autoría es "Equipo de trujas" (Organization) y se dice que las guías legales y fiscales no han tenido revisión profesional. |
| Authoritativeness (25%) | 25 | Sin señales externas en el material analizado; Organization sin `sameAs`, logo ni redes. Backlinks y menciones: NO MEDIDO. |
| Trustworthiness (30%) | 45 | A favor: precios claros y coherentes, la IA se declara, hay fuentes oficiales y los límites se explican. En contra: no hay titular legal, NIF, domicilio ni email de contacto; en páginas públicas se ven notas internas de borrador y texto de plantilla; la home promete algo que el resto del sitio niega. |

## Inventario (parse_html.py; word_count incluye la navegación)
| Página | Words | Mínimo de la skill | Estado |
|---|---|---|---|
| / | 748 | 500 | OK |
| /pricing | 421 | - | OK |
| /sobre-nosotros | 277 | - | Escaso para página de confianza |
| /recursos | 355 | - | OK (hub) |
| /funciones | 90 | 800 (servicio) | **THIN** |
| /funciones/pagina-reservas | 1177 | 800 | OK |
| montar-barberia-espana | 2898 | 1500 | OK |
| organizar-agenda-barberia | 1509 | 1500 | En el límite (cuenta navegación) |
| elegir-app-reservas-barberia | 2120 | 1500 | OK |
| reducir-no-shows-barberia | 2184 | 1500 | OK |
| calcular-precios-barberia | 1875 | 1500 | OK |
| conseguir-clientes-barberia-barrio | 2045 | 1500 | OK (obtenida en esta ejecución: raw/pages/conseguir-clientes-barberia-barrio.html, HTTP 200) |

## Hallazgos

### C1. Notas internas de borrador publicadas en guías indexables (CRÍTICA)
- Evidencia: elegir-app-reservas-barberia.html y reducir-no-shows-barberia.html, línea 2: "Borrador pendiente de revisión editorial, no de publicación."
- Impacto: el sitio dice en público que la página no está lista para publicarse. Daña la confianza del lector y del evaluador (QRG: contenido sin esfuerzo o sin terminar).
- Recomendación: revisar ambas guías y quitar la nota, o ponerles `noindex` hasta que estén revisadas.

### C2. Falta identidad legal y contacto del proveedor (ALTA, Trust)
- Evidencia: no hay `mailto:` ni email en home, pricing ni sobre-nosotros. privacidad.html remite al "canal de contacto disponible en trujas" sin decir cuál es. terminos.html incluye texto de plantilla: "Antes de vender de forma masiva, la barbería o el titular del servicio debe añadir sus datos legales concretos en la contratación y canales de contacto."
- Impacto: es una suscripción de pago con permanencia de 12 meses y nadie identifica quién vende. Es la señal de confianza más débil del sitio. Que sea obligatorio legalmente (p. ej. la LSSI) lo debe confirmar un asesor; aquí no se afirma.
- Recomendación: indicar titular (nombre o razón social), NIF, domicilio y email de soporte en footer, /sobre-nosotros y /terminos. Quitar el texto de plantilla. Añadir `contactPoint`, `email` y `sameAs` a Organization.

### C3. La home promete algo que el resto del sitio niega (ALTA, Trust)
- Evidencia: home, H3 "Los recordatorios los manda trujas": "La gente no desaparece y tú te dejas de estar pendiente." En cambio, /funciones dice "ni una garantía de asistencia" y /funciones/pagina-reservas (FAQ) responde "¿Los avisos aseguran que nadie falte? No."
- Recomendación: cambiar la frase de la home por una realista, por ejemplo "Tu cliente recibe un recordatorio por email el día antes".

### C4. Experiencia propia nula y practicante desautorizado (ALTA, Experience)
- Evidencia: la nota editorial idéntica en las 6 guías desvincula a Pablo. No hay casos, cifras propias de uso, capturas ni testimonios. pagina-reservas lo admite: "no una demostración interactiva ni una colección de capturas del producto".
- Recomendación: conseguir que Pablo (o barberos usuarios) revise y firme apartados concretos, como un recuadro "Cómo lo hacemos en Trubarber" con datos reales de agenda o no-shows. Añadir capturas reales del panel y de la reserva. Hacer un caso de estudio con cifras antes/después y fecha.

### C5. Voz de producto distante, con frases propias de IA (MEDIA)
- Evidencia: pagina-reservas: "El código selecciona citas que están entre 23 y 25 horas", "La oferta comercial de trujas indica que no hay comisión" y "Aquí no reproducimos una tabla de precios que pueda quedar desactualizada ni damos por confirmadas condiciones de permanencia, baja o exportación de datos". Es el propio proveedor no confirmando sus condiciones. Hay cautelas y negaciones en serie en todas las guías ("sin prometer", "no sustituye", "comprueba", "condiciones vigentes": unas 3-6 por página, Grep en HTML+RSC). También en metadatos: "sin prometer resultados" (meta de no-shows) y H2 "Revisa tarifas sin prometer que nadie se irá".
- No se encontraron muletillas típicas de IA en español ("en definitiva", "cabe destacar", "sin duda", "hoy en día", "descubre", "no solo… sino") en las 12 páginas.
- Recomendación: escribir en primera persona del producto ("Enviamos el recordatorio unas 24 h antes"). Mostrar los precios en la página de función. Dejar una sola nota de alcance por guía en vez de cautelas repartidas por el texto.

### C6. /funciones es thin y repite texto (MEDIA)
- Evidencia: 90 palabras, 2 H2. El párrafo de cuerpo copia literalmente la meta description de /funciones/pagina-reservas ("Un enlace propio para reservar en tu barbería desde la web, con cuenta de cliente, sin comisión por cita y con avisos por email. Consulta los planes."). No tiene schema.
- Recomendación: convertirla en un hub real (agenda diaria, horarios por barbero, cuenta de cliente, recordatorios, cancelación, límites como "sin WhatsApp/SMS") con capturas y enlaces a subpáginas. O fusionarla con pagina-reservas.

### C7. Fechas y frescura incoherentes (MEDIA)
- Evidencia: `datePublished` solo en montar y organizar (2026-11-02). Las otras 4 guías no tienen `datePublished` y ninguna tiene `dateModified`. Hay fechas visibles pero con 3 formatos distintos: "Revisado el 2 de noviembre", "Última revisión: 8 de noviembre" y "Última revisión documental: 8 de noviembre". La autoría también varía: "Equipo editorial trujas (asistencia IA)" frente a "Equipo de trujas" en schema y nota.
- Recomendación: usar en todas las guías un mismo bloque con autor, `<time>` de publicación y de revisión, y llevar `datePublished` y `dateModified` al Article.

### C8. Bloques repetidos entre guías y solapamiento temático (BAJA-MEDIA)
- Evidencia: "Nota editorial: método y alcance" es idéntica en las 6 guías, y el bloque "Sigue leyendo" es la misma lista. content_quality.py marcó `repetitive` (repetition_score 77) en montar-barberia-espana; es poco fiable, ver NO MEDIDO. Hay solapamiento de intención entre organizar-agenda-barberia ("sin vivir en WhatsApp") y /funciones/pagina-reservas ("Menos mensajes para acordar una hora"), y en recordatorios entre no-shows, organizar y pagina-reservas.
- Valoración: no hay duplicidad casi literal en el cuerpo (cada guía tiene su propia intención). Riesgo de canibalización bajo.
- Recomendación: dejar la nota editorial en una línea con enlace. Diferenciar la guía de agenda (método) de la página de función (producto) con enlaces cruzados claros.

### C9. Página "Sobre nosotros" débil como señal de confianza (MEDIA)
- Evidencia: 277 palabras. Miguel solo tiene "Su papel es construir el producto". Pablo no tiene apellido, enlace ni ubicación concreta. No hay foto, LinkedIn, historia, fecha de fundación ni contacto. Lo bueno: el proceso editorial es transparente (IA declarada, límites, sin revisión profesional).
- Recomendación: añadir la historia del origen (por qué existe, relación con Trubarber), bios con enlaces verificables, foto, contacto y datos legales.

### Precios (15 €/29 €, primer mes gratis): mayormente correcto
- Coinciden home, pricing y FAQ: Basic 15 €/mes con permanencia de 12 meses o 29 €/mes mes a mes; "30 días gratis" y "primer mes gratis" se usan como lo mismo; cancelación vía portal de Stripe explicada.
- Lagunas (BAJA-MEDIA): no se dice si el IVA está incluido. En el HTML del servidor el precio mes a mes del plan Pro (32 € con permanencia) no aparece: depende del toggle JS y no se ha comprobado renderizado (NO MEDIDO). /pricing no tiene schema Offer/Product. "Prioridad para nuevas funciones del MVP" expone jerga interna.

## On-Page
| Elemento | Estado |
|---|---|
| Title únicos | OK, 12/12 únicos. Separador mezclado: "—" en home/pricing y "\|" en el resto |
| Longitud del title | 4 guías superan unos 70 caracteres con " \| trujas" (p. ej. elegir-app ≈ 84, montar ≈ 82, no-shows ≈ 82): se cortarán en la SERP. Mover la marca o acortar |
| Meta description | 12/12 únicas. metadata_template.py: `site_risk: low`, `templated_ratio: 0.0`, `shared_cta_phrases: {}`. Señal secundaria `brand_suffix_in_description` en pricing, sobre-nosotros y funciones: probable falso positivo, porque la marca está dentro de una frase natural. montar ≈ 165 caracteres (algo larga) |
| H1 | 1 por página en todas. El H1 de la home ("¿Y si pudieras olvidarte de agendar citas en tu tiempo libre?") no incluye "agenda / reservas / barbería"; el title sí |
| Jerarquía | Correcta en guías (H2 numerados, H3 por criterio). /pricing: planes en `<span>` sin H2/H3 por plan |
| Canonical | Autorreferente en todas |
| Schema de contenido | Article + Breadcrumb en guías; ItemList en /recursos; sin schema en /pricing, /funciones y /funciones/pagina-reservas |
| Imágenes | 1 en toda la muestra (home, con alt). Las guías no tienen imágenes |

### Enlazado interno
- /pricing es un callejón sin salida: solo enlaza al logo. No tiene header de recursos ni footer con privacidad, términos o sobre-nosotros (ALTA en conversión y confianza).
- /funciones y /funciones/pagina-reservas no están en el menú principal (Recursos / Sobre nosotros / Ver planes). La home no enlaza /funciones y ninguna guía enlaza /funciones/pagina-reservas. Solo llegan desde /recursos y entre sí (MEDIA).
- Las guías no tienen footer con /privacidad ni /terminos según el parseo (BAJA-MEDIA).
- Lo bueno: el hub /recursos enlaza las 6 guías. Hay enlaces contextuales con anchors descriptivos (p. ej. "requisitos y costes para montar una barbería en España") y enlaces salientes a fuentes oficiales (AEAT, Seg. Social, BOE, AEPD, Google Help).

## AI citation readiness (66/100)
- A favor: respuestas directas al principio (calcular-precios abre con la fórmula en un párrafo), pasos numerados, ejemplos con cifras, notas numeradas [1][2][3] hacia fuentes oficiales, sección "Fuentes y alcance", tablas (home y calcular-precios).
- En contra: autor genérico (Organization). Faltan fechas en 4 guías. En pagina-reservas y la home hay FAQ visible sin marcado (FAQPage ya no da rich result para la mayoría de sitios, pero ayuda a estructurar). /pricing no tiene precios en datos estructurados. La guía montar lleva "2026" en el title y habrá que actualizarla en 2027.

## Prioridades
1. Quitar "Borrador pendiente de revisión…" de 2 guías (C1).
2. Publicar titular legal, NIF, domicilio y email, y quitar el texto de plantilla de /terminos (C2).
3. Corregir "La gente no desaparece" en la home (C3).
4. Añadir header y footer completos a /pricing, y /funciones al menú y a las guías.
5. Dar Experience real: revisión firmada por Pablo o barberos usuarios, capturas, caso de estudio (C4).
6. Ampliar /funciones o fusionarla; quitar el párrafo duplicado (C6).
7. Unificar autoría y fechas, con `datePublished` y `dateModified` en las 6 guías (C7).
8. Acortar los titles largos y añadir keyword al H1 de la home.

## NO MEDIDO
- **Legibilidad (Fernández-Huerta / Szigriszt-INFLESZ):** el plugin no tiene script de legibilidad para español (solo hay referencias en schema_generate.py). Valoración cualitativa: frases medias-largas con muchas subordinadas y negaciones; vocabulario accesible salvo en partes fiscales.
- **content_quality.py:** se ejecutó sobre el HTML bruto de montar-barberia-espana (overall 75, filler 0, ai_pattern 0, repetition 77, flag `repetitive`). No es válido como medida: las listas de frases son solo para inglés y la entrada incluía marcado y JSON de RSC. No se ejecutó en el resto.
- **Similitud entre guías:** sin script; la valoración de C8 es manual.
- Backlinks, menciones externas, reseñas y Authoritativeness externa.
- Precio Pro mes a mes y contenido renderizado por JS en /pricing (solo se analizó el HTML del servidor).
- Verificación de exactitud legal y fiscal de las guías (no se usó content_verify.py; las fuentes citadas existen como URLs oficiales, pero no se comprobó lo que dicen).
- /privacidad y /terminos: solo se revisó la parte de identidad y contacto.

## Evidencia
- Raw: trujas.app-audit/raw/pages/*.html (nuevo: conseguir-clientes-barberia-barrio.html), trujas.app-audit/raw/metadata.json (entrada de metadata_template.py)
- Scripts: parse_html.py (12 páginas), metadata_template.py --pairs-file, content_quality.py (1 página, no válido), render_page.py --mode never/auto (sobre-nosotros, pricing: is_spa=false, publication_date=null), fetch_page.py (conseguir-clientes).

## audit-data.json (Content Quality)
```json
{"category":"Content Quality","score":56,"onpage_score":68,"eeat":{"experience":30,"expertise":50,"authoritativeness":25,"trustworthiness":45,"weighted":38},"ai_citation_readiness":66,
"findings":[
{"id":"C1","severity":"critical","title":"Notas de borrador publicadas","urls":["/recursos/elegir-app-reservas-barberia","/recursos/reducir-no-shows-barberia"]},
{"id":"C2","severity":"high","title":"Sin identidad legal ni contacto; texto de plantilla en /terminos","urls":["/","/sobre-nosotros","/terminos","/privacidad"]},
{"id":"C3","severity":"high","title":"Home promete asistencia que FAQ niega","urls":["/","/funciones/pagina-reservas"]},
{"id":"C4","severity":"high","title":"Sin experiencia propia; practicante desautorizado","urls":["/recursos/*"]},
{"id":"C5","severity":"medium","title":"Voz de producto distante y exceso de cautelas","urls":["/funciones/pagina-reservas","/recursos/*"]},
{"id":"C6","severity":"medium","title":"/funciones thin (90 palabras) con párrafo duplicado","urls":["/funciones"]},
{"id":"C7","severity":"medium","title":"Fechas y autoría incoherentes; sin dateModified","urls":["/recursos/*"]},
{"id":"C8","severity":"low","title":"Bloques repetidos entre guías","urls":["/recursos/*"]},
{"id":"C9","severity":"medium","title":"Sobre nosotros débil","urls":["/sobre-nosotros"]},
{"id":"OP1","severity":"high","title":"/pricing sin enlaces internos","urls":["/pricing"]},
{"id":"OP2","severity":"medium","title":"Titles >70 caracteres en 4 guías","urls":["/recursos/*"]},
{"id":"OP3","severity":"low","title":"H1 de la home sin keyword","urls":["/"]}],
"metadata_template":{"site_risk":"low","templated_ratio":0.0,"shared_cta_phrases":{}}}
```
