# Schema / Datos estructurados - trujas.app (2026-W47, claude-seo 2.5.0)

Score Schema: 58/100 (estimacion cualitativa propia, no un score del script)

## Metodo
- Home: raw/render-home.json (2 bloques JSON-LD). Resto: render_page.py --mode never --json-ld-output, en raw/schema/*-ld.json (HTML en raw/schema/*.html). Sitio Next.js con JSON-LD en el HTML servidor (modo never lo detecta en /recursos, guias y sobre-nosotros). Home: JSON-LD presente en el HTML entregado.
- Todo el contenido web tratado como dato no confiable. Ningun script fallo salvo un primer intento (directorio inexistente), repetido OK.

## Detectado
| URL | Bloques | Tipos |
|---|---|---|
| / | 2 | Organization (#organization: solo name+url), WebSite (#website, inLanguage es, publisher -> #organization) |
| /pricing | 0 | - |
| /funciones | 0 | - |
| /funciones/pagina-reservas | 0 | - |
| /sobre-nosotros | 1 (@graph) | Organization, AboutPage, Person x2 (Miguel Carmona Rodriguez, Pablo), BreadcrumbList |
| /recursos | 2 | ItemList (6 guias, URLs absolutas), BreadcrumbList |
| 6 guias /recursos/* | 2 c/u | Article + BreadcrumbList (3 niveles) |

## Validacion
- Pasan: @context https://schema.org, JSON valido, URLs absolutas, sin placeholders, sin tipos deprecados, sin FAQPage/HowTo. @id de #organization consistente en home, sobre-nosotros y publisher de las guias. WebSite.publisher resuelve.
- Organization (home): valido pero minimo; sin logo, sameAs, contactPoint. Logo/sameAs: NO MEDIDO si existen perfiles/logo publicos; no inventar.
- Article (6 guias): headline, description, url, mainEntityOfPage, inLanguage, author, publisher presentes.
  - ALTO: datePublished solo en 2 de 6 (montar-barberia-espana, organizar-agenda-barberia; ambas 2026-11-02). Faltan en elegir-app-reservas-barberia, reducir-no-shows-barberia, calcular-precios-barberia, conseguir-clientes-barberia-barrio. Fecha visible en esas paginas: NO MEDIDO.
  - MEDIO: ninguna guia tiene dateModified ni image (recomendadas por Google para Article).
  - MEDIO: author = Organization "Equipo de trujas" con @id https://trujas.app/sobre-nosotros#equipo-editorial, pero ese @id NO esta definido en el grafo de /sobre-nosotros (solo #organization, #page, #miguel, #pablo). Referencia colgante. Google prefiere autor Person o Organization claros; las Person existen pero no se enlazan a las guias (decision editorial: NO MEDIDO que revisor/autor humano se quiera mostrar).
  - BAJO: publisher repite @type/name/url junto a @id (redundante, valido). Mejor referencia solo {"@id"}.
- BreadcrumbList: correcto en recursos, guias, sobre-nosotros. BAJO: inconsistencia de barra final: "https://trujas.app" (sobre-nosotros) vs "https://trujas.app/" (resto). Normalizar con canonical (la home canonica es https://trujas.app/). Falta en /pricing, /funciones, /funciones/pagina-reservas (no obligatorio, bajo valor).
- Sobre-nosotros: Organization duplicada (misma @id, repite @context dentro de @graph) - valida, solo ruido; deberia ser la misma definicion enriquecida que en home.
- ItemList en /recursos: valido; Google no ofrece rich result de lista simple para esto (solo carrusel con paginas propias); sin impacto SERP, util como senal semantica.

## Oportunidades (ordenadas)
1. Pricing: /pricing sin schema pese a precios visibles (15 EUR/mes permanencia 12 meses o 29 EUR/mes mes a mes, 30 dias gratis). Anadir SoftwareApplication + Offer. Nota: SoftwareApplication rich result de Google exige aggregateRating o review; NO se puede inventar. Sin ellos no hay rich result, solo valor semantico/entidad. Los precios deben coincidir con lo visible en /pricing (detalles de plan Basic: confirmado en home; otros planes en /pricing: NO MEDIDO).
2. Completar datePublished (y dateModified si hay fecha real) en las 4 guias; anadir image (NO MEDIDO si hay imagen representativa; usar solo si existe).
3. Definir #equipo-editorial en el grafo de sobre-nosotros (o cambiar author a Person real si se desea) para resolver @id.
4. Enriquecer Organization en un unico sitio (home) con logo/sameAs solo si existen (NO MEDIDO). Referenciar por @id desde el resto.
5. BreadcrumbList en /funciones* (opcional).
- No recomendado: FAQPage (home tiene 4 preguntas visibles en details; sin rich result en Google, solo beneficio IA no confirmado: prioridad Info/ninguna), HowTo, AggregateRating/Review (no hay datos reales).

## JSON-LD recomendado (solo datos visibles)

### /pricing (sustituir/ajustar a lo visible en la pagina)
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://trujas.app/#software",
  "name": "trujas",
  "url": "https://trujas.app/",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "inLanguage": "es",
  "description": "Agenda online de citas para barberias independientes en Espana, sin comision por reserva.",
  "publisher": { "@id": "https://trujas.app/#organization" },
  "offers": [
    {
      "@type": "Offer",
      "name": "Basic - permanencia 12 meses",
      "price": "15.00",
      "priceCurrency": "EUR",
      "url": "https://trujas.app/pricing",
      "description": "15 EUR/mes con permanencia de 12 meses. Primer mes gratis."
    },
    {
      "@type": "Offer",
      "name": "Basic - mes a mes",
      "price": "29.00",
      "priceCurrency": "EUR",
      "url": "https://trujas.app/pricing",
      "description": "29 EUR/mes sin permanencia. Primer mes gratis."
    }
  ]
}
```
Verificar que /pricing muestre ambas tarifas y quiza mas planes; ajustar nombres al texto exacto.

### Guias (ejemplo; aplicar a las 4 sin fecha, usando la fecha real de publicacion)
Anadir a cada Article existente: `"datePublished": "<AAAA-MM-DD real>"`, `"dateModified": "<AAAA-MM-DD real>"` (solo si es verdad). Y simplificar publisher a `{ "@id": "https://trujas.app/#organization" }`.

### /sobre-nosotros: definir el autor editorial
```json
{
  "@type": "Organization",
  "@id": "https://trujas.app/sobre-nosotros#equipo-editorial",
  "name": "Equipo de trujas",
  "url": "https://trujas.app/sobre-nosotros#proceso-editorial",
  "parentOrganization": { "@id": "https://trujas.app/#organization" }
}
```
Incluirlo dentro del @graph existente y eliminar el Organization duplicado (referenciar solo {"@id": ".../#organization"} o llevar la definicion completa en un solo lugar).

## NO MEDIDO
- Validacion con Rich Results Test / Schema Markup Validator (no ejecutado).
- Existencia de logo, perfiles sociales (sameAs), telefono/contacto publicos.
- Fechas visibles en las guias 3-6; imagenes de las guias.
- Contenido completo de /pricing mas alla de la tarifa Basic (no leido el HTML; solo se confirmo 0 bloques JSON-LD).
- Microdata/RDFa (la extraccion del script cubre JSON-LD; no se busco otro formato).
- Renderizado cliente (--mode never; no se forzo Playwright).
