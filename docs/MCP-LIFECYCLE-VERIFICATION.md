# Ciclo de citas MCP · verificación 2026-11-07

## Alcance

Solicitud de Miguel: eliminar la aceptación posterior del barbero y permitir cancelar desde el asistente. Rama `feat/mcp-booking-pilot`, PR #33 → `develop`. No merge a `develop`/`main`, ni despliegue de código a producción.

- Web POST y `mcp_confirm_booking` crean nuevas citas `confirmed`; no se convierten citas existentes.
- Nueva herramienta `cancel_booking`, identidad/audiencia inyectadas por el servidor, entrada estricta `appointmentId` + `confirmed:true`.
- Permiso OAuth nuevo `bookings:cancel`, no heredado por conexiones anteriores de creación. Para añadirlo, reautorizar la conexión desde Claude con el mismo endpoint.
- Solo citas propias, futuras y `pending`/`confirmed`. Cancelación atómica con bloqueo de fila; reintento `cancelled` no reescribe la fila. Rechaza otros clientes, citas pasadas y otros estados terminales; admite citas propias de web sin propuesta MCP.
- Cancelar conserva la cita y libera el hueco; no depende de suscripción activa, catálogo o perfil completo. No pagos ni reprogramación.

## Base compartida: autorización, aplicación y preservación

Se explicó el alcance antes de escribir. Proyecto confirmado por configuración del checkout y MCP oficial acotado: `gnskwavxxipvwpznzzdh`. Sin usar credenciales globales de otro producto.

`apply_migration` devolvió `success:true`. `list_migrations` registró:

```text
20261107130917 mcp_booking_lifecycle
```

El archivo local usa esa misma versión. Contiene únicamente el reemplazo de `mcp_confirm_booking`, nueva `mcp_cancel_booking`, ACL solo service-role y recarga de PostgREST. No backfill de `appointments`, ni tablas nuevas, ni modificación de datos existentes.

Smoke SQL real en una transacción finalizada con `ROLLBACK`: confirmación automática, retry de confirmación, cancelación, retry de cancelación, rechazo entre clientes, hueco liberado y privilegios. Resultado:

```text
PASS: confirm/cancel/isolation/idempotency/availability/privileges, rolled back
original_appointment_count: 15
temporary_entitlements_remaining: 0
controlled_proposals_remaining: 0
```

El primer intento abortó por ausencia de horarios en el local controlado; se verificó rollback sin habilitación residual. Se añadió una franja únicamente dentro de la siguiente transacción de prueba. El segundo intento pasó. Comparación de huellas de filas completas antes/después: las 15 citas originales permanecen idénticas. Las dos funciones existen con execute para service-role, no anon/authenticated.

## Pruebas locales ejecutadas

```sh
MCP_TEST_MODULES=/tmp/mcp-pg/node_modules \
SEO_TEST_BASE_URL=http://localhost:3127 \
node --experimental-strip-types \
 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
 --disable-warning=ExperimentalWarning --test tests/*.test.mjs
```

Resultado final tras añadir las defensas del harness de smoke: **117 aprobadas, 0 fallos, 0 omitidas**. PostgreSQL local desechable real; incluye concurrencia, DST, aislamiento, preservación de `pending` antiguas y compatibilidad del slot web/MCP. Revisión independiente final aprobada, sin hallazgos de seguridad o lógica; se corrigieron y probaron los dos problemas iniciales del harness (validación HTTPS y cleanup resistente a errores). El test de POST web ejecuta el handler y código local reales con seams de Supabase/Resend; acredita inserción/respuesta y copy de emails, no entrega real de correos.

`npm run lint`: 0 errores, 7 warnings heredados fuera de archivos modificados. Build completo con el entorno de trujas cargado explícitamente: correcto, compilación/TypeScript y 50 páginas. Intentos de los workers sin entorno/integración completa habían fallado; no son el resultado final del build del coordinador.

Chromium a 375 px en `/conectar` local: copy de confirmación automática y cancelación renderizado; sin overflow horizontal ni errores de página. No rediseño ni cambios de estilos.

## Preview y smoke HTTP

Endpoint previsto: `https://deploy-preview-33--barber-assitant.netlify.app/mcp`.

Estado en este punto: SQL y pruebas locales verificados; publicación de esta revisión y smoke HTTP de cancelación pendientes. El primer test HTTP contra la preview antigua dio RED esperado (400 al solicitar el scope nuevo); las 15 citas originales quedaron intactas y no se creó ningún fixture de reservas.

Harness opt-in: `scripts/mcp-lifecycle-smoke.mjs`. Solo preview exacta + URL HTTPS exacta de Supabase + cuentas controladas. Crea un permiso temporal y una franja únicamente para la barbería de prueba, genera una cita propia para 2028, verifica confirmación y cancelación desde el MCP real y elimina solo IDs de este run. No toca `carmona2`, Stripe ni reservas originales. El cleanup debe seguir con los demás pasos si uno falla y reportar los errores, nunca fingir éxito.

```sh
MCP_LIFECYCLE_WRITE=1 \
MCP_SMOKE_ORIGIN=https://deploy-preview-33--barber-assitant.netlify.app \
MCP_SMOKE_ENV=<ruta-segura-env-trujas> \
MCP_SMOKE_ACCOUNTS=<ruta-segura-cuentas-controladas> \
node scripts/mcp-lifecycle-smoke.mjs
```

## Límites de la evidencia

Miguel confirmó conexión y reserva nativas desde Claude antes de este cambio; la cita persistida se verificó read-only. Este documento no acredita todavía cancelación dentro de Claude ni ChatGPT. Un smoke HTTP con SDK real tampoco implica haber pilotado la UI del proveedor. No envíos reales de email ni pagos durante estos tests. Las reservas originales, incluida la anterior pendiente de Miguel, no se transforman automáticamente.
