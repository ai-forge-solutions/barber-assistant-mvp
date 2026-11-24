# SXO: análisis de experiencia de búsqueda de trujas.app

Fecha: 2026-11-24 · Auditoría claude-seo 2.5.0 (skill seo-sxo) · Estado: COMPLETO
Puntuación: **SXO Gap Score 49/100** para la home frente a "agenda online barbería". Es independiente del SEO Health Score.

## 0. Evidencia usada
- Home: `raw/render-home.json` (Next.js; el HTML trae marca `BAILOUT_TO_CLIENT_SIDE_RENDERING`, pero el contenido principal sale en el HTML servido) y `raw/pages/home.html`, analizadas con `parse_html.py`.
- Analizadas con `parse_html.py`: pricing, funciones, funciones/pagina-reservas, recursos, sobre-nosotros y recursos/elegir-app-reservas-barberia. También se revisaron con Grep las guías reducir-no-shows y conseguir-clientes.
- Captura `screenshots/trujas_app_mobile.png`. Corresponde a la guía de no-shows y no a la home, así que **la mitad superior de la home en móvil está NO MEDIDA**.
- SERP: herramienta WebSearch el 2026-11-24, con 7 consultas y unos 9 resultados cada una. **No es una SERP de Google localizada en España.** No aporta posiciones fiables, anuncios, PAA, AI Overview ni volúmenes, así que todo eso queda **NO MEDIDO**. Los órdenes de la lista no deben leerse como rankings.

## 1. Hallazgo principal: el tipo de página encaja, pero la página no se diferencia, y la guía comparativa no coincide con lo que pide la SERP

| Keyword | Tipo dominante observado (taxonomía) | Consenso aprox. | Página trujas candidata | Tipo trujas | Severidad del mismatch |
|---|---|---|---|---|---|
| agenda online barbería | Landing Page de SaaS | 9/9 landings de proveedor (100 %) | `/` | Landing Page | **ALIGNED** (con brechas de contenido y confianza) |
| programa citas peluquería barbería | Landing Page de SaaS | 8/9 landings + 1 ficha App Store (89 %) | `/` | Landing | **ALIGNED/MEDIUM**: la SERP mezcla peluquería y barbería; trujas solo habla de barbería |
| app reservas barbería | Landing (6/9) + ficha App Store (2/9) + listicle (1/9) | 67 % | `/` o `/funciones/pagina-reservas` | Landing / Hybrid | **MEDIUM**: la palabra "app" atrae intención de app instalable y trujas es web |
| software gestión barbería | Landing de suite de gestión (7/9) + directorios GetApp/Capterra (2/9) | 78 % | `/` | Landing (solo agenda) | **MEDIUM-HIGH**: la SERP espera TPV, caja, comisiones, inventario y VeriFactu, y trujas no lo ofrece |
| mejores apps reservas barbería España / comparativa | Comparison (listicles de fabricantes y notas patrocinadas) | 9/9 (100 %) | `/recursos/elegir-app-reservas-barberia` | Blog Post (método, sin nombrar alternativas) | **HIGH** |
| alternativa a Booksy sin comisión | Comparison ("X vs Booksy") | 9/9 (100 %) | ninguna | n/a | **HIGH**: falta la página |

Conclusiones:
1. En las keywords transaccionales la home tiene el tipo de página correcto. Lo que falla es la diferenciación. Lo que trujas destaca como ventaja ("0 comisión", "sin marketplace", "1 mes gratis", 15 €/mes) es lo mínimo que ofrecen los demás en la SERP:
   - ControlAgenda (España): "desde 14,95 €/mes, 30 días gratis, sin comisión".
   - Hueco: "sin comisiones, todo tu equipo por 10 €/mes".
   - Reservada: "desde 9,90 €/mes, sin comisiones".
   - MyBarb: "gratis para un barbero solo".
   - Apúntalo: "sin marketplace".
   - Turnito, ReservaSimple y DunaSoft tienen plan gratuito.

   Además, trujas cuesta **15 €/mes con 12 meses de permanencia**, frente a 14,95 € de ControlAgenda, que en el resultado no menciona permanencia. Para el persona sensible al precio, trujas no queda como la opción más barata ni como la más flexible.
2. La SERP comparativa la ocupan listicles de fabricantes como Turnito, Wylectra, Zentro, EasyWeek y ReservaSimple, y cada uno se pone primero. La guía de trujas descarta de forma explícita nombrar proveedores ("no es un ranking… sin inventar precios ajenos"). Es honesto, pero no da a la SERP lo que pide: alternativas con nombre, una tabla y un "mejor para…".
3. **No se confirmó la hipótesis de los marketplaces.** En los resultados observados no salió ninguna página de consumidor de Booksy o Treatwell. Booksy aparece como `biz.booksy.com`, que es una landing B2B. Treatwell solo aparece citado dentro de listicles (Zentro le atribuye un 35 % de comisión, dato de un tercero no verificado). Los marketplaces aparecen como competidores a comparar, no como el tipo de página que gana la SERP.
4. La SERP observada tiene mucho contenido latinoamericano: mibarberia.com.ar, agendalibre.cl, agendapro.com/mx, reservasimple, turnito. En una SERP localizada en España eso puede cambiar (**NO MEDIDO**).
5. Con la consulta de marca "trujas agenda barbería", trujas.app **no aparece** en los resultados observados. Solo sale un PR de GitHub (`github.com/ai-forge-solutions/barber-assistant-mvp/pull/29`). Puede indicar indexación o autoridad débil todavía (ver `/seo technical` y GSC, **NO MEDIDO**).

## 2. Inventario de la página objetivo (home)
- Title: "trujas — Agenda online para barberías". Contiene la keyword.
- H1: "¿Y si pudieras olvidarte de agendar citas en tu tiempo libre?". **No contiene ninguna keyword** (agenda online / reservas / barbería). La categoría solo aparece en la etiqueta "Para barberos independientes en España".
- 748 palabras. Orden de secciones: hero → dolor (libreta/WhatsApp/no-show) → 3 pasos → precio → por qué encaja → tabla genérica → FAQ (4) → CTA.
- CTAs: "Empezar gratis" (hero y final), que lleva a `/pricing` y no al alta. "Empezar con primer mes gratis" envía un POST a `/api/billing/checkout` con plan basic y cadencia **anual**. También "¿Ya tienes cuenta?" y "Ver todos los planes".
- Media: mockups HTML con la leyenda "Datos ficticios" y una imagen (recordatorio en pantalla bloqueada). No hay vídeo, demo ni capturas reales.
- Schema: solo Organization (name y url) y WebSite. **No hay SoftwareApplication, Offer ni FAQPage**, aunque la página tiene precio y FAQ visibles.
- Prueba social: **ninguna**. No hay testimonios, número de barberías ni reseñas. Sobre-nosotros dice expresamente que Pablo (Trubarber, Galicia) no valida las guías.
- Enlazado: la home **no enlaza** a `/funciones` ni a `/funciones/pagina-reservas`. Solo hay links en el footer, sin cabecera de navegación.
- Recordatorios: solo por email ("Recordatorio de ejemplo por email"). Casi todos los competidores de la SERP destacan los recordatorios por **WhatsApp**.

Otras páginas:
- `/funciones`: 90 palabras y sin schema, contenido escaso (thin).
- `/funciones/pagina-reservas`: 1177 palabras con FAQ, pero sin schema.
- `/pricing`: 421 palabras, H1 genérico ("Elige cómo quieres llevar tu agenda") y sin schema Offer.
- `/recursos/elegir-app-reservas-barberia`: 2120 palabras, con Article y BreadcrumbList pero sin datePublished/dateModified. En el texto visible dice: **"Borrador pendiente de revisión editorial, no de publicación."** La misma frase aparece en `reducir-no-shows-barberia`. Eso daña la confianza de cualquier lector y evaluador.

## 3. User stories (derivadas de señales observadas)
1. **Barbero de una silla que mira el precio (consideración).** Quiere una agenda online barata y sin ataduras, porque factura poco y desconfía de las cuotas. Le frena la sensibilidad al precio: la SERP le ofrece opciones gratis o a 10–15 € sin permanencia, y trujas pide 12 meses para llegar a 15 €.
   *Señales:* plan gratuito de Turnito y ReservaSimple; "gratis para barbero solo" de MyBarb; "10 €/mes" de Hueco; "desde 14,95 €, 30 días gratis" de ControlAgenda.
2. **Barbero que pasa de la libreta o WhatsApp a lo digital (awareness → consideración).** Quiere que sus clientes reserven solos con un enlace que pueda pegar en WhatsApp o Instagram, porque pierde tiempo libre contestando mensajes. Le frena no saber si sus clientes tendrán que instalar una app y si los recordatorios llegan por WhatsApp.
   *Señales:* "enlace para compartir en WhatsApp o Instagram" (Mi Barbería, ReservaSimple, Setmore); "recordatorios por WhatsApp" (AgendaLibre, Apúntalo, Turnito); "los clientes no instalan app" (ReservaSimple).
3. **Dueño de barbería de tres sillas (consideración → decisión).** Quiere una agenda por barbero, con horarios distintos y precio por equipo, porque coordina a varias personas. Le falta claridad sobre si el plan "Barbería basic" cubre a 3 barberos y qué cuesta cada uno.
   *Señales:* "agenda por barbero" (ControlAgenda); "+2.990 por barbero extra" (AgendaLibre); "todo tu equipo por 10 €" (Hueco); "el coste crece por profesional" (crítica de EasyWeek a Booksy).
4. **Barbero que quiere dejar Booksy, Treatwell o Fresha (decisión).** Quiere comparar alternativas sin comisión con nombre y precio, porque siente que paga por clientes que ya eran suyos. Le frena la fatiga comparativa: todos los listicles son de fabricantes.
   *Señales:* SERP "alternativa a Booksy" con 9/9 páginas vs; "Treatwell 35 % comisión" (Zentro); "Boost de Booksy" (Reservada, MyBarb).
5. **Dueño que busca "software de gestión" (consideración).** Quiere caja, TPV y VeriFactu además de la agenda, porque la normativa fiscal de 2026 le preocupa. Le falta información: no sabe si trujas cubre facturación.
   *Señales:* "VeriFactu" (ControlAgenda, Doscar, Zentro); "caja al céntimo" (Mi Barbería); TPV en Prolyam, Booksy biz y Barberly.

## 4. SXO Gap Score: home frente a "agenda online barbería"

| Dimensión | Puntos | Evidencia |
|---|---|---|
| Page Type | 12/15 | Es una landing, igual que el 100 % de la SERP. Resta: el H1 no tiene keyword y la home no enlaza a las páginas de funciones |
| Content Depth | 8/15 | 748 palabras y buen relato del dolor. Faltan funciones concretas (multi-barbero, horarios, cancelación), canal de recordatorio frente a WhatsApp, límites (sin TPV/VeriFactu) y migración desde la libreta |
| UX Signals | 10/15 | CTA visible arriba, precio visible y botones de 44 px. Pero "Empezar gratis" lleva a /pricing en vez de al alta, no hay cabecera de navegación y el checkout es anual por defecto |
| Schema | 4/15 | Solo Organization y WebSite mínimos. Sin SoftwareApplication+Offer, sin FAQPage y sin logo ni sameAs |
| Media | 7/15 | Mockups claros marcados como ficticios. Sin capturas reales, sin vídeo o demo y sin tour interactivo |
| Authority | 3/15 | Cero testimonios, cifras o reseñas. La marca no aparece en la búsqueda observada. Las guías enlazadas llevan "Borrador" visible |
| Freshness | 5/10 | La home no muestra fecha. Precios coherentes entre páginas. Las guías tienen fecha visible pero sin datePublished/dateModified en el schema |
| **Total** | **49/100** | |

## 5. Puntuación por personas (home)

| Persona | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|
| Busca "software de gestión" (TPV/VeriFactu) | 6 | 8 | 10 | 10 | **34** | Critical Mismatch |
| Barbería de 3 sillas | 13 | 11 | 8 | 14 | **46** | Needs Work |
| Comparador "alternativa a Booksy/Treatwell" | 12 | 12 | 10 | 14 | **48** | Needs Work |
| Barbero de 1 silla, sensible al precio | 20 | 19 | 9 | 15 | **63** | Good |
| Barbero que viene de libreta/WhatsApp | 21 | 20 | 10 | 15 | **66** | Good |

Evidencia y arreglo por persona, de la peor a la mejor:
1. **Gestión/TPV (34).** La home no dice que trujas no incluye caja, TPV ni facturación VeriFactu. Llegan visitas que no encajan y se van.
   - *Fix:* añadir a la FAQ "¿trujas hace facturación o TPV? No: es la agenda. Puedes usarlo junto a tu TPV". Crear `/recursos/agenda-o-software-gestion-barberia`, ampliando la H2 que ya existe en la guía de elegir app.
   - No orientar la home a "software gestión barbería".
2. **Tres sillas (46).** La home dice "barberos" en plural pero no aclara cuántos incluye el plan Basic, ni los horarios por barbero, ni el precio por silla.
   - *Fix:* crear un bloque "Para 1, 2 o 3 sillas" con una fila por tamaño: precio, barberos incluidos y horario individual. Añadir un enlace "Ver cómo se configura cada barbero" hacia `/funciones`.
3. **Comparador (48).** La tabla "Qué revisar en otras herramientas" no nombra a nadie.
   - *Fix:* crear la página `/comparar/trujas-vs-booksy` (y `-vs-treatwell`) con una tabla de datos públicos fechados y citados: comisión, permanencia, marketplace, recordatorios y precio por barbero.
   - Añadir a la guía de elegir app una sección "Opciones que verás en Google", con 5–8 proveedores, enlace a sus precios oficiales y fecha de consulta.
4. **Una silla, precio (63).**
   - *Fix:* poner en el hero "15 €/mes con 12 meses o 29 €/mes sin permanencia", hoy en letra pequeña. Responder "¿por qué pagar si hay apps gratis?" (sin marketplace, sin límite de reservas, si es cierto).
   - Revisar que el CTA del hero lleve a un alta con cadencia elegible.
5. **Libreta/WhatsApp (66).** Es el mejor encaje: la sección "Sabes que esto te suena" describe su problema exacto.
   - *Fix:* crear una H2 "Pasa de la libreta a reservas online en una tarde" con 3 pasos de alta y una línea sobre importar contactos.
   - Explicar que el recordatorio va por email y por qué. Si llega a haber WhatsApp, destacarlo.

Problemas que afectan a todas las personas:
- **La confianza es la dimensión más baja (8–10).** Faltan testimonios, una cifra de barberías y el caso Trubarber (aunque sea solo de uso, sin validar las guías).
- Hay que quitar el texto visible "Borrador pendiente de revisión…".

## 6. Acciones priorizadas
1. **(Crítico, confianza)** Quitar "Borrador pendiente de revisión editorial, no de publicación" de `elegir-app-reservas-barberia` y `reducir-no-shows-barberia`, o no indexar esas páginas hasta revisarlas.
2. **(Alto)** Crear una página comparativa con nombres (vs Booksy / Treatwell / ControlAgenda o "alternativas sin comisión") con fuentes y fechas. Es el tipo de página que pide el 100 % de la SERP comparativa.
3. **(Alto)** Diferenciar la home más allá de "sin comisión" o "1 mes gratis", porque eso ya es lo mínimo del mercado. Lo distintivo que ya tiene la página es "hecho para barbero de barrio de 1–3 sillas en España".
   - Ponerlo en el H1, por ejemplo "Agenda online para barberías de barrio: tus clientes reservan solos".
   - Mantener la pregunta actual como subtítulo.
4. **(Alto)** Añadir prueba social real (testimonio, número de barberías, caso Trubarber).
5. **(Medio)** Schema SoftwareApplication con Offer (15 € anual / 29 € mensual), más FAQPage en home y pricing (ver `/seo schema`).
6. **(Medio)** Añadir cabecera de navegación en la home con Funciones, Precios y Guías, y enlazar `/funciones/pagina-reservas`. Ampliar `/funciones`, que tiene 90 palabras.
7. **(Medio)** Aclarar en la home que no es una app instalable y que no hace TPV/VeriFactu, para filtrar el tráfico de "app" y "gestión".
- Cross-skill: `/seo content` (E-E-A-T, autoría con IA, borradores), `/seo schema`, `/seo page` (thin `/funciones`). `/seo local` no aplica: no se observó local pack.

## 7. Datos estructurados (para audit-data.json, categoría Search Experience)
```json
{
  "category": "Search Experience",
  "sxo_gap_score": 49,
  "target": "https://trujas.app/",
  "keyword_primary": "agenda online barbería",
  "findings": [
    {"id":"sxo-01","severity":"critical","title":"Texto 'Borrador pendiente de revisión editorial' visible en guías indexables","urls":["/recursos/elegir-app-reservas-barberia","/recursos/reducir-no-shows-barberia"]},
    {"id":"sxo-02","severity":"high","title":"SERP comparativa 100% Comparison; trujas solo tiene guía de método sin alternativas nombradas","mismatch":"HIGH"},
    {"id":"sxo-03","severity":"high","title":"Diferenciadores (0 comisión, sin marketplace, mes gratis) son estándar en SERP; precio 15€ con permanencia frente a 14,95€ ControlAgenda / 10€ Hueco / gratis MyBarb"},
    {"id":"sxo-04","severity":"high","title":"Sin prueba social en home (0 testimonios/cifras)"},
    {"id":"sxo-05","severity":"medium","title":"H1 de home sin keyword de categoría"},
    {"id":"sxo-06","severity":"medium","title":"'software gestión barbería' espera TPV/caja/VeriFactu; trujas es solo agenda","mismatch":"MEDIUM-HIGH"},
    {"id":"sxo-07","severity":"medium","title":"Sin SoftwareApplication/Offer/FAQPage en home y pricing"},
    {"id":"sxo-08","severity":"medium","title":"Home no enlaza /funciones; /funciones 90 palabras"},
    {"id":"sxo-09","severity":"low","title":"Recordatorios solo email frente a WhatsApp en la mayoría de competidores"}
  ],
  "personas": {"gestion_tpv":34,"barberia_3_sillas":46,"comparador_booksy":48,"barbero_1_silla_precio":63,"libreta_whatsapp":66},
  "not_measured": ["posiciones Google.es","volumen de búsqueda","anuncios","PAA","AI Overview","featured snippet","above-the-fold móvil de la home","CTR/GSC"]
}
```

## 8. Limitaciones (NO MEDIDO)
- WebSearch no equivale a Google.es con geolocalización e idioma españoles. No hay posiciones reales, anuncios, PAA, related searches, featured snippets ni AI Overview, por lo que las user stories salen de títulos y snippets de resultados, no de PAA.
- No hay volúmenes de búsqueda. Los pesos de cada persona son cualitativos.
- No se renderizó la home en móvil: la captura disponible es de una guía.
- No se probaron el alta ni el checkout (no se enviaron formularios, por regla).
- Los precios y afirmaciones de competidores salen de snippets o de su propio marketing. No están verificados y pueden haber cambiado. Las comisiones atribuidas a Treatwell, Booksy y Fresha son afirmaciones de terceros.
- Sin acceso a GSC ni GA4 (sin OAuth): no se sabe si trujas.app está indexada ni para qué consultas recibe impresiones.

## Fuentes SERP observadas (WebSearch, 2026-11-24)
- "agenda online barbería": https://mibarberia.com.ar/ · https://agendalibre.cl/agenda-para-barberias · https://www.barberappbycodex.com/ · https://apuntalo.com/software-para-barberias/ · https://turnito.app/app-turnos-peluqueria/ · https://agendapro.com/es/barberia/software-para-barberias · https://agendapro.com/mx/barberia/software-para-barberias · https://controlagenda.app/programa-barberia · https://noona.app/hq/barbershop-software
- "app reservas barbería": https://es.adalo.com/posts/barber-app/ · https://apps.apple.com/es/app/gobarber/id1458298585 · https://www.barberly.com/es/barber-app · https://www.barberly.com/es/barber-shop-app · https://www.reservasimple.com/app-turnos-barberia-latinoamerica · https://easyweek.es/solutions/barbershop · https://www.setmore.com/es/industries/barber-shops · https://micita.app/ · https://apps.apple.com/es/app/barberia-guadiaro/id1449131324
- "software gestión barbería": https://www.zenoti.com/es/barbershop-software · https://biz.booksy.com/who-loves-us/barber · https://www.barberly.com/?market=es&lang=es · https://prolyam.com/software-para-gestion-de-barberias/ · https://mibarberia.app/ · https://www.getapp.com/retail-consumer-services-software/barbershop/ · https://www.capterra.com/barbershop-software/ · https://www.doscar.com/programa-peluqueria/
- "programa citas peluquería barbería": https://tieneshueco.es/ · https://www.dunasoftpc.com/soluciones/booking-dunasoft/ · https://barbernp.com/ · https://miscitaspeluqueria.com/ · https://barberiaclub.com/ · https://apps.apple.com/do/app/barberky-citas-para-barber%C3%ADas/id6749484510
- "mejores apps reservas barbería España comparativa 2026": https://turnito.app/blog/los-mejores-software-de-reservas-para-barberias-en-espana-2026/ · https://wylectra.com/recursos/barberias/mejor-software-barberias/ · https://zentroestudio.es/software-gestion-barberias-espana-comparativa-2026/ · https://reservasimple.com/mejores-plataformas-gestionar-turnos-espana · https://www.atlanticohoy.com/recomendado/cuatro-sistemas-reservas-online-profesionales-belleza-guia-2026-bc-nprs_1558898_102.html · https://www.diariobahiadecadiz.com/el-resto-del-mundo/las-ocho-mejores-aplicaciones-para-gestionar-una-barberia-en-2026-guia-para-propietarios/ · https://easyweek.es/business/blog/como-elegir-el-software-de-reservas-para-tu-salon-de-belleza-en-2026-la-guia-honesta-para-no-equivocarte/
- "alternativa a Booksy sin comisión barbería": https://zentroestudio.es/zentro-vs-booksy/ · https://reservada.es/blog/reservada-vs-booksy-comparativa-para-peluquerias-y-barberias · https://mybarb.com/booksy-alternative/ · https://wemu.io/blog/booksy-alternative-barbers · https://fadefy.com/blogs/best-barber-booking-apps
- "trujas agenda barbería" (marca): https://github.com/ai-forge-solutions/barber-assistant-mvp/pull/29 (trujas.app no aparece)

¿Generar un informe PDF? Usa `/seo google report`.
