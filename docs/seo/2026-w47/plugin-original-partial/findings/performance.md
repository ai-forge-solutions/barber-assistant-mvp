# Performance / Core Web Vitals - trujas.app (2026-W47)

## Estado: COMPLETO pero con medición limitada

Score Performance: NO MEDIDO (ni lab Lighthouse ni field). No se asigna un número 0-100 para no inventarlo.

## Intentos de medición (errores exactos)
- pagespeed_check.py https://trujas.app/ --strategy mobile --json -> "PSI rate limit exceeded (240 QPM / 25,000 QPD). Wait and retry." (sin API key; lighthouse_version null)
- pagespeed_check.py https://trujas.app/pricing --strategy mobile --psi-only --json -> mismo error.
- crux_history.py https://trujas.app/ --json -> "Error: API key required. Use --api-key or configure GOOGLE_API_KEY."
- pagespeed_check.py no admite --output (error de argparse), así que no hay JSON persistido de PSI en raw/.
- Glob no estaba disponible en esta sesión, así que no se descubrieron más scripts. No se probó Lighthouse local.
- raw/render-home.json (43k tokens) no se pudo leer entero. Se usó el resumen de la evidencia aportada.

## Tabla de métricas
| Métrica | Home | /pricing | Guía |
|---|---|---|---|
| LCP lab | NO MEDIDO | NO MEDIDO | NO MEDIDO |
| CLS lab | NO MEDIDO | NO MEDIDO | NO MEDIDO |
| TBT (proxy INP) lab | NO MEDIDO | NO MEDIDO | NO MEDIDO |
| INP field | NO MEDIDO | NO MEDIDO | NO MEDIDO |
| LCP/CLS field (CrUX) | NO MEDIDO | NO MEDIDO | NO MEDIDO |

Veredicto CWV pass/fail: NO DETERMINABLE.

## Evidencia indirecta (render-home.json, Playwright; no es una métrica CWV)
- render_ms ~4082 en Playwright. Es tiempo de renderizado de la herramienta, no LCP.
- Cabeceras: Netlify con cache hit y compresión br (positivo para TTFB).
- Google Fonts (Rye, Oswald, DM Sans) cargadas como render-blocking: riesgo para LCP/FCP y CLS por swap de fuentes.
- Imagen next/image con lazy loading. Si es la imagen LCP (hero), lazy la retrasa.
- Varios chunks JS: riesgo para TBT/INP, sin cuantificar.

## Recomendaciones (hipótesis a verificar, por impacto esperado)
1. Autoalojar las fuentes con next/font (subset latin, display swap, preload). Elimina el bloqueo de render de Google Fonts y reduce el CLS por swap.
2. Si la imagen hero es el elemento LCP, usar priority/fetchpriority=high y quitar lazy. Dar width/height explícitos.
3. Auditar los chunks JS (bundle analyzer), usar dynamic import para componentes below-the-fold y diferir terceros.
4. Reducir el número de familias y pesos de fuentes (3 familias es mucho).
5. Reejecutar la medición con API key PSI/CrUX o con Lighthouse local para home, /pricing y una guía, y validar contra datos de campo.

## JSON (audit-data.json, categoría Performance)
{"performance":{"score":null,"score_basis":"not_measured","lab":null,"field":null,"cwv":{"lcp":"NO MEDIDO","inp":"NO MEDIDO","cls":"NO MEDIDO"},"errors":["PSI rate limit exceeded (no API key)","crux_history: API key required"],"indirect_evidence":["render_ms~4082 playwright","render-blocking Google Fonts (Rye, Oswald, DM Sans)","next/image lazy","multiple JS chunks","Netlify cache hit + br"]}}
