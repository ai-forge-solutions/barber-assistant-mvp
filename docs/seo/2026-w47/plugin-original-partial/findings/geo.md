# GEO / AI Search Readiness — https://trujas.app/

Fecha: 2026-11-24 · claude-seo 2.5.0 · Evidencia: `raw/robots.txt`, `raw/render-home.json`, `raw/pages/*.html`, `raw/geo-llms-txt.json`, `raw/geo-ua-{oai-searchbot,perplexitybot,claude-searchbot}.json`.

## Score AI Search Readiness: 66 / 100 (estimado; señales off-site NO MEDIDAS)

| Dimension | Peso | Score | Aporte | Base |
|---|---|---|---|---|
| Citabilidad | 25% | 72 | 18.0 | Guias con tablas resumen, formulas definidas, FAQ, fuentes oficiales (BOE, AEPD, AEAT/TGSS) con fecha de consulta. Penaliza: aviso "Borrador" publico, H2 imperativos y pocas preguntas literales. |
| Legibilidad estructural | 20% | 80 | 16.0 | H1 unico, H2/H3 jerarquicos y numerados, 9 tablas en 6 guias, blockquotes con formulas, listas. |
| Multimodal | 15% | 35 | 5.3 | 0 imagenes / 0 video en las 6 guias; solo 1 `<img>` en home y 1 en pricing. Tablas compensan parcialmente. |
| Autoridad y marca | 20% | 40 | 8.0 | Organization minima (name+url, sin `sameAs`, logo, descripcion). Autoria "Equipo editorial trujas, con asistencia de IA"; Person en /sobre-nosotros sin enlaces externos ("Pablo" sin apellido). Menciones externas NO MEDIDAS. |
| Accesibilidad tecnica | 20% | 92 | 18.4 | SSR/prerender Next.js; robots abierto; llms.txt valido; sitemap declarado. |
| **Total** | | | **65.7 -> 66** | |

## Acceso de crawlers IA (robots.txt: solo `User-Agent: *`, Allow /, Disallow rutas privadas)

| Bot | Capacidad que gobierna | Estado |
|---|---|---|
| OAI-SearchBot | ChatGPT Search (citacion) | Permitido (comodin). Fetch con UA: 200, 83144 chars, HTML completo |
| Claude-SearchBot | Busqueda en Claude | Permitido (comodin). Fetch con UA: 200, HTML identico |
| PerplexityBot | Indice de Perplexity | Permitido (comodin). Fetch con UA: 200, HTML identico |
| Googlebot | Google Search + AI Overviews | Permitido (comodin) |
| Bingbot | Bing / Copilot | Permitido (comodin) |
| Applebot | Siri/Spotlight/Safari | Permitido (comodin) |
| GPTBot | Entrenamiento OpenAI (no ChatGPT Search) | Permitido (comodin) |
| ClaudeBot | Entrenamiento Anthropic (no busqueda Claude) | Permitido (comodin) |
| Google-Extended | Entrenamiento/grounding Gemini; no afecta Search ni AIO | Permitido (comodin) |
| Applebot-Extended | Entrenamiento Apple Intelligence | Permitido (comodin) |
| CCBot, cohere-ai | Entrenamiento | Permitido (comodin) |

Nota: el fetch con UA falsificado no prueba el comportamiento del WAF/CDN ante IPs reales de los bots (NO MEDIDO). Bots de entrenamiento permitidos: decision de negocio, no un fallo.

## llms.txt y RSL
- `/llms.txt`: PRESENTE, 200 `text/plain; charset=UTF-8`, bien formado (H1, resumen en blockquote, secciones Producto / Recursos / Funciones, 11 enlaces absolutos coherentes con sitemap). Opcional; Google Search lo ignora.
- RSL 1.0: no hay directiva `License:` en robots.txt. `/license.xml` NO MEDIDO.

## Tecnica (SSR vs CSR)
- `X-Nextjs-Prerender: 1`, `X-Powered-By: Next.js`, Netlify. Contenido presente en HTML inicial: no depende de JS. Mismo ETag para los 3 UAs IA (sin cloaking).
- Contenido duplicado en payload RSC (`self.__next_f`) dentro del HTML: inocuo para extraccion pero infla el peso.

## Citabilidad por pasajes (6 guias)
Fortalezas:
- Apertura directa: `montar-barberia-espana` abre con alcance + tabla "Que necesito para abrir una barberia: resumen de requisitos" (pasaje extraible de alto valor).
- Formulas autocontenidas en blockquote (p.ej. "Tasa de no-shows = ausencias sin aviso / citas previstas x 100") y ejemplos numericos etiquetados como ilustrativos.
- Fuentes citadas con fecha de consulta (BOE articulos 60 y 85.6 LGDCU, AEPD, AEAT, TGSS, CIRCE/PAE). Divulgacion de interes comercial explicita.
- FAQ en `reducir-no-shows`, `elegir-app`, `pagina-reservas` (en `<p><strong>` o `<h3>` de pregunta).

Debilidades:
- **CRITICO**: `elegir-app-reservas-barberia` y `reducir-no-shows-barberia` muestran en texto visible "Borrador pendiente de revision editorial, no de publicacion." Un motor que cite el pasaje hereda una señal de baja fiabilidad; contradice la publicacion.
- H2 mayoritariamente imperativos ("Mide cuatro semanas...", "Distingue margen y recargo"); solo pagina-reservas y pocas secciones usan preguntas literales que casen con prompts ("cuanto cuesta", "que necesito").
- Muchas cautelas ("no garantiza", "no prometemos") diluyen la respuesta directa en los primeros 40-60 palabras de algunas secciones.
- Fechas inconsistentes: `datePublished` solo en 2 guias (montar, organizar); ninguna con `dateModified` pese a "Ultima revision" visible.

## Claridad de entidad
- Que es: claro en `<title>` ("trujas — Agenda online para barberias"), meta description y llms.txt ("agenda online para barberias independientes en España").
- Publico: "1 a 3 sillas" aparece en guias (elegir-app, montar) y "barberos de barrio" en home, pero no como definicion explicita en home/llms.txt.
- Precios (pricing, texto SSR): primer mes 0€; Basic 15€/mes con permanencia 12 meses o 29€/mes mes a mes; Pro 32€/mes con permanencia 12 meses. Sin mencion de IVA incluido/excluido. **Sin JSON-LD** en /pricing (ni Product/Offer ni SoftwareApplication).
- Organization sin `sameAs`, `logo`, `description`, `areaServed`; no hay `SoftwareApplication` en ningun sitio.
- Nombre en minuscula ("trujas") y "Trubarber" (negocio de Pablo) pueden confundir desambiguacion; no hay enlace a perfiles externos.

## Señales de marca publicas
| Plataforma | Estado |
|---|---|
| Wikipedia / Wikidata | NO MEDIDO (fetch via script denegado por permisos del entorno) |
| Reddit | NO MEDIDO |
| YouTube | NO MEDIDO (youtube_search.py no ejecutable: permiso denegado) |
| LinkedIn | NO MEDIDO; no hay enlace en el sitio |
| Enlaces sociales en el sitio | No se detectan `sameAs` ni enlaces a Instagram/LinkedIn/YouTube en /sobre-nosotros |
| Visibilidad real en ChatGPT/Perplexity/AIO | NO MEDIDO (sin DataForSEO) |

## Puntuacion por plataforma (preparacion, no visibilidad medida)
| Plataforma | Score | Notas |
|---|---|---|
| Google AI Overviews | 60 | Depende de ranking organico (NO MEDIDO). Estructura y fuentes buenas; falta schema de precio/producto y E-E-A-T de autor. |
| ChatGPT Search | 62 | OAI-SearchBot permitido, SSR. Sin señales de marca externas verificadas. |
| Perplexity | 66 | Prefiere pasajes con fuentes y tablas: buen encaje. Penaliza "Borrador". |
| Bing Copilot | 58 | Indexacion Bing / IndexNow NO MEDIDO; schema minimo. |

## Top 5 cambios de mayor impacto
1. **Eliminar el aviso "Borrador pendiente de revision..."** de las 2 guias (o despublicarlas hasta revisar). Esfuerzo: 15 min. Impacto: alto.
2. **JSON-LD en /pricing y home**: `SoftwareApplication` (applicationCategory BusinessApplication, operatingSystem Web, areaServed ES) con `offers` (Basic 15/29€, Pro 32€, priceCurrency EUR, aclarar IVA en texto y schema). Esfuerzo: 1-2 h.
3. **Reforzar entidad**: Organization con `logo`, `description` ("agenda online para barberias de 1 a 3 sillas en España"), `sameAs` a perfiles reales; frase definitoria en home y llms.txt incluyendo publico y precio. Esfuerzo: 1-2 h (+ crear perfiles si no existen).
4. **Autoria y fechas**: autor nominal (Person con enlace a /sobre-nosotros#miguel o revisor experto, p.ej. Pablo con apellido/negocio verificable) en Article; `datePublished` + `dateModified` en las 6 guias coherentes con el texto visible. Esfuerzo: 2 h.
5. **Pasajes-respuesta**: convertir 1-2 H2 por guia en preguntas literales ("¿Cuanto cuesta montar una barberia?", "¿Que es un no-show y como se calcula?") con respuesta directa de 40-60 palabras antes de las cautelas; añadir 1 imagen/diagrama propio por guia (alt descriptivo). Esfuerzo: 4-6 h.

Adicional (medio plazo): presencia off-site verificable (YouTube tutorial de la pagina de reservas, hilos en comunidades de barberos, directorios SaaS), y medir visibilidad IA con DataForSEO.

## Hallazgos estructurados (audit-data.json · AI Search Readiness)
```json
{
  "category": "AI Search Readiness",
  "score": 66,
  "dimensions": {"citability": 72, "structure": 80, "multimodal": 35, "authority": 40, "technical": 92},
  "findings": [
    {"id": "geo-draft-notice", "severity": "critical", "pages": ["/recursos/elegir-app-reservas-barberia", "/recursos/reducir-no-shows-barberia"], "evidence": "Texto visible 'Borrador pendiente de revision editorial, no de publicacion.'"},
    {"id": "geo-pricing-no-schema", "severity": "high", "pages": ["/pricing"], "evidence": "0 bloques JSON-LD; precios 15/29/32 EUR solo en texto; IVA no indicado"},
    {"id": "geo-entity-thin", "severity": "high", "pages": ["/"], "evidence": "Organization solo name+url, sin sameAs/logo/description; sin SoftwareApplication"},
    {"id": "geo-author-dates", "severity": "medium", "pages": ["/recursos/*"], "evidence": "Autoria 'Equipo editorial trujas, con asistencia de IA'; datePublished en 2/6 guias; dateModified en 0/6"},
    {"id": "geo-multimodal", "severity": "medium", "pages": ["/recursos/*"], "evidence": "0 imagenes/video en guias"},
    {"id": "geo-crawlers", "severity": "pass", "evidence": "robots.txt comodin Allow; OAI-SearchBot/Claude-SearchBot/PerplexityBot 200 con HTML SSR completo"},
    {"id": "geo-llmstxt", "severity": "pass", "evidence": "/llms.txt 200 text/plain bien formado"}
  ],
  "not_measured": ["brand mentions (Wikipedia, Reddit, YouTube, LinkedIn)", "live AI visibility", "WAF behavior for real bot IPs", "RSL license.xml", "Bing indexation"]
}
```
