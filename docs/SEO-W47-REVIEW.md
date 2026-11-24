# Recuperación W47 · Informe y revisión editorial

Ciclo: 2026-W47, recuperado el 24/11/2026 por autorización manual de Miguel. Rama `seo/2026-W47` desde `develop`; no hay autorización de merge ni de despliegue a producción. No se reabre W46.

## Qué se entrega

Cinco borradores completos de nueva creación, no cinco briefs ni cinco publicaciones. Todos permanecen `pending_review`, sin fecha de publicación y sin atribución a un autor humano que no los haya revisado. Autoría: equipo de trujas, con ayuda de IA (Hermes). La selección, investigación y redacción complementarias se distinguen de los hallazgos parciales del plugin.

| Pieza | Decisión / artefacto útil | Destino propuesto |
|---|---|---|
| Cambiar de agenda sin perder citas | Corte de sistema y ficha de reconciliación | `/recursos/migrar-agenda-barberia` |
| Calcular duración de servicios | Hoja de observación y bloque con transición | `/recursos/calcular-duracion-servicios-barberia` |
| Atender clientes sin cita | Regla de admisión y disponibilidad real | `/recursos/gestionar-clientes-sin-cita-barberia` |
| Vacaciones | Lista de citas afectadas y reapertura | `/recursos/vacaciones-barberia-reservas` |
| Cierre de caja | Hoja de recuento, sin certificación fiscal | `/recursos/cierre-caja-barberia` |

Los textos están en `content/reviews/2026-w47`. La revisión implementada es `/revision-seo/2026-w47` y sus cinco subrutas. Todas son `noindex,nofollow,noarchive`, fuera de sitemap, `llms.txt`, home, pricing y catálogo público. `noindex` no es un control de acceso: una preview puede ser visitada por quien conozca la URL. Los borradores no contienen analítica privada ni datos de clientes. Los destinos `/recursos/...` propuestos devuelven 404 hasta aprobación e integración autorizada.

No se han modificado textos, rutas, estilos ni enlaces de la home, pricing o guías existentes. Se reutiliza el renderizador seguro de Markdown y CSS de recursos. No se han cambiado autenticación, permisos, base de datos, cobros, correo transaccional ni infraestructura.

## Procedencia del plugin original: parcial y preservada

`docs/seo/2026-w47/plugin-original-partial/` contiene los Markdown de hallazgos reales producidos por el plugin original en la misma ejecución W47. Se conservaron byte a byte; sus hashes y el recibo original están al lado. No es un nuevo informe de auditoría confeccionado por Hermes.

La ejecución interrumpida se reconcilió comprobando procesos, lock y recibo; se archivaron las trazas anteriores y se usó `--resume`. El plugin alcanzó cuota de Claude con reinicio comunicado para las **12:10 UTC del 24/11**. El recibo terminó `failed`: no hay workflow completo verificado, calendario/briefs completos ni informe consolidado final acreditado. No se ha reintentado ni usado fallback de pago.

Leer los documentos originales con estas salvedades:
- Scores del plugin son heurísticas, no notas de Google ni resultados de adquisición.
- PSI fue limitado por cuota y CrUX pidió clave. Sus CWV de producción permanecen no medidos.
- Permisos de scripts externos y señales off-site dejaron cobertura parcial. No se ampliaron permisos.
- Una propuesta de atribuir un texto a una persona no demuestra que esa persona lo haya escrito o revisado. No se ha aplicado.
- Preguntas literales, número de palabras, imagen social o `llms.txt` no garantizan citas ni ranking. No se han aplicado recomendaciones automáticamente.

### Mapa de evidencia a decisiones (sin aplicar cambios fuera de alcance)

| Origen y cita exacta | Lo que sí sostiene | Decisión de esta PR |
|---|---|---|
| `findings/technical.md`, H1: «/privacidad y /terminos: sin canonical, title/description genericos de la home» | Candidato técnico del snapshot auditado | No aplicado; verificar separadamente antes de tocar legales |
| `findings/geo.md`, geo-draft-notice: «Borrador pendiente de revision editorial, no de publicacion.» | Hay avisos visibles en páginas ya públicas | W45 se reconcilia como publicado, no como pendiente de despliegue; no se retiran avisos ni se inventa aprobación |
| `findings/performance.md`: «Score Performance: NO MEDIDO (ni lab Lighthouse ni field).» | No hay medición CWV original válida | QA local complementaria antes/después, explícitamente no field |
| `findings/content.md`: hallazgos editoriales reales del plugin | Insumo parcial, no cinco briefs aprobados | Selección complementaria propia, sin atribuir títulos al plugin |

## Reconciliación de ciclos anteriores

La evidencia privada de conciliación comprobó que main y develop tenían árboles equivalentes al inicio; PR #29 y #34 ya estaban fusionadas y los contenidos W45 servían 200. Por tanto no se copian ni se cuentan como borradores W47. Las cinco piezas W46 conservadas localmente siguen fuera de develop y respondían 404: se registran como deuda de integración, sin recuperarlas en esta autorización. No se reescribe ninguna decisión histórica ni fecha de publicación conocida.

## Verificación real

- `npm ci --ignore-scripts --no-audit --no-fund`, lint y build de producción: correctos. Variables de backend inválidas de prueba; sin credenciales de producción.
- `npm run test:seo` con `SEO_TEST_BASE_URL=http://127.0.0.1:3147`: 13 tests, 11 pasan y 2 omitidos por depender de fixtures de identidad privada.
- Marketing: 25/25; recursos: 7/7; analítica: 12/12; MCP: 43 pasan, 3 omitidos dependientes de DB. No se han falseado los omitidos como verdes.
- Contratos HTTP marketing/recursos locales: 19 pasan, 2 omitidos. El proyecto no define `npm test`; no se presenta como suite ejecutada.
- Playwright Chromium: 16 comprobaciones, 390 y 1365 px, ocho rutas (home, pricing, hub y cinco piezas). HTTP 200, un H1, sin errores de consola/hidratación ni overflow de página; tablas desplazables. Navegación y CTA internas reales. Preview desconocida: 404; destinos editoriales propuestos: 404.
- Canonical de preview autorreferencial, `noindex` comprobado, ausencia de previews en sitemap/llms, originales de discovery sin cambios. No confundir canonical de revisión con publicación final.
- Auth: se comprobó el acceso sin sesión/redirección al login de dashboard. No se ha iniciado sesión como cliente/barbero ni probado altas, reservas reales o pagos. Los contratos de rol/MCP son tests, no una sesión real de DB. Es limitación explícita y no un bloqueo reproducido de los flujos existentes.
- Inspección visual real del artículo de migración: legible, jerarquía y marca trujas preservadas. Capturas desktop/móvil y JSON de QA bajo el run privado W47.

### Rendimiento local (medianas de tres ejecuciones móviles por URL)

| Ruta | Score antes → después | LCP ms antes → después | CLS antes → después | TBT ms antes → después | Transferencia delta |
|---|---|---|---|---|---|
| `/` | 99 → 99 | 806 → 779 | 0,0366 → 0,0366 | 136,5 → 127,5 | +43 bytes |
| `/pricing` | 99 → 99 | 768 → 770 | 0,0454 → 0,0454 | 106,9 → 89,0 | +23 bytes |

Mismo equipo, Chromium, builds de producción y throttling móvil Lighthouse. No se ve regresión material de las superficies protegidas en este laboratorio; las diferencias pequeñas no son mejoras causales demostradas. No es medida de producción, datos de campo ni INP. No se alteraron fuentes o componentes compartidos para perseguir una nota.

## Separación privada

GA4, diagnóstico GSC, scorecard, recibos de permisos y correo se conservan en el proyecto operativo y Drive privado, no en esta PR. La recuperación mantiene el Sheet existente y su historial inmutable; la pestaña «Recuperación W47» tiene lectura de vuelta íntegra. GSC sigue bloqueado por `invalid_grant`, distinto del Drive reparado.

Estado editorial final de esta PR: cinco borradores implementados y verificados para revisión, cero nuevas publicaciones. Requiere revisión de Miguel y autorización separada para merge/despliegue. Resultado global del ciclo: parcial por cobertura nativa/GSC; no se declara éxito completo por haber creado la PR o enviado correo.
