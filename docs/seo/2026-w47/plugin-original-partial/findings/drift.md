# SEO Drift: https://trujas.app/

- **URL:** https://trujas.app/
- **Baseline comparado:** id=1, 2026-11-09T11:15:06.925884+00:00
- **Comparación:** id=2, 2026-11-24T09:43:36.266617+00:00 (`drift_compare.py --baseline-id 1 https://trujas.app/`)
- **Nuevo baseline (siguiente ciclo):** id=2, 2026-11-24T09:43:42.877362+00:00 (`drift_baseline.py https://trujas.app/`). El baseline id=1 se conserva.
- **Caché drift:** `~/.cache/claude-seo/drift/baselines.db` (constante `DB_PATH` en drift_baseline.py; `--help` no indica la ruta)
- **JSON crudo:** `trujas.app-audit/raw/drift-compare.json` (copiado de stdout porque el script no tiene `--output`)
- **CWV:** no comparados (`cwv_compared: false`; ninguno de los dos baselines tiene CWV)

## Resumen

**0 CRITICAL / 0 WARNING / 3 INFO** (se dispararon 3 de 17 reglas). Sin regresiones.

| Severidad | Regla | Valor anterior | Valor nuevo | Acción |
|---|---|---|---|---|
| INFO | schema_added | 0 bloques de schema | 2 bloques de schema (hash ce40a049c02b...) | Validar con `/seo schema https://trujas.app/` |
| INFO | h2_structure_changed | 8 H2 | 8 H2 (mismo número, texto/orden distinto) | Revisar con `/seo page https://trujas.app/` si el cambio no era intencionado |
| INFO | content_hash_changed | ef2faece4136... | 5e925e785267... | Esperable por el schema y los H2 nuevos; nada que hacer |

## Sin cambios (reglas no disparadas)

- Title: "trujas — Agenda online para barberías" (sin cambios)
- Meta description: sin cambios
- Canonical: https://trujas.app/ (sin cambios)
- Robots: no hay meta robots y no se ha añadido noindex
- H1: "¿Y si pudieras olvidarte de agendar citas en tu tiempo libre?" (100% igual)
- Status: 200 -> 200
- OG tags: los 6 siguen presentes (og:title, og:description, og:url, og:site_name, og:locale, og:type)
- cwv_regressed / perf_score_dropped: omitidos porque no hay datos

## Notas sobre la salida del script

- El valor `new_value: null` en canonical_removed, h1_removed y title_removed, y `new_value: []` en og_tags_removed, es como el script representa "nada eliminado". El nuevo baseline id=2 confirma que canonical, H1, title y los 6 OG tags siguen presentes.
- schema_removed (no disparada) muestra "0 -> 0", lo que choca con schema_added (0 -> 2). Parece un fallo de presentación del script. El número real actual es 2 (`schema_count: 2` en el baseline id=2).
- Ningún script falló.

## Recomendaciones

- No hay hallazgos CRITICAL ni WARNING, así que no hace falta derivar nada con urgencia.
- Opcional: `/seo schema https://trujas.app/` para validar los 2 bloques de schema nuevos.
- Opcional: capturar el siguiente baseline sin `--skip-cwv` cuando haya cuota/API de PSI, para poder vigilar CWV.
- Se puede generar un informe HTML con `drift_report.py` si se quiere compartir.

## Datos estructurados (categoría SEO Drift, audit-data.json)

```json
{"category": "SEO Drift", "url": "https://trujas.app/", "baseline_compared": {"id": 1, "timestamp": "2026-11-09T11:15:06.925884+00:00"}, "comparison_id": 2, "new_baseline": {"id": 2, "timestamp": "2026-11-24T09:43:42.877362+00:00"}, "summary": {"critical": 0, "warning": 0, "info": 3}, "findings": [{"rule": "schema_added", "severity": "INFO", "old": "0", "new": "2"}, {"rule": "h2_structure_changed", "severity": "INFO", "old": "8 H2s", "new": "8 H2s"}, {"rule": "content_hash_changed", "severity": "INFO", "old": "ef2faece4136...", "new": "5e925e785267..."}], "cwv_compared": false}
```
