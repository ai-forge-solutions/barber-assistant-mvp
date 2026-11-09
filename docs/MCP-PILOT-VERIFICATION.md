# Piloto MCP: verificación real de activación

Fecha: 2026-11-06. Rama: `feat/mcp-booking-pilot`. Proyecto Supabase: `gnskwavxxipvwpznzzdh`.

## Migraciones remotas aplicadas

Ejecutadas a través del MCP oficial de Supabase, con OAuth individual del propietario, limitado al proyecto de trujas. No se utilizó la conexión SQL de Velz.

| Versión remota | Nombre |
| --- | --- |
| 20261106184405 | mcp_oauth |
| 20261106184407 | mcp_booking |
| 20261106184409 | customer_shop_preferences |

Los archivos del repositorio y sus pruebas se renombraron a esas versiones efectivamente registradas por Supabase. El SQL no cambió.

### Datos heredados

Antes de crear la exclusión se detectaron 2 intervalos invertidos entre 13 citas existentes. Se corrigió únicamente `appointments.ends_at`, conservando el resto de columnas:

- `490677c6-25a2-4183-9f15-b4c5bf7623b1`: 2026-06-30 04:45:00Z → 2026-06-30 12:45:00Z; inicio 12:00Z, servicio de 45 minutos.
- `c35f88cd-3b22-4731-89f7-f2e4ba853d02`: 2026-07-07 04:30:00Z → 2026-07-07 12:30:00Z; inicio 12:00Z, servicio de 30 minutos.

La operación exigió coincidencia con identificadores, inicios, finales y estados anteriores; si no afectaba exactamente a esas dos filas, abortaba. Las otras 11 citas conservaron el checksum previo `759903ff31106283b8f8055e51c97834`.

No se deben restaurar ciegamente los intervalos inválidos: son incompatibles con la exclusión actualmente instalada. El registro anterior conserva la trazabilidad, no es una instrucción de rollback automático.

## Verificación de base real

- Las cinco tablas nuevas tienen RLS y no permiten SELECT/INSERT/UPDATE/DELETE a `anon`/`authenticated`.
- Los RPC `mcp_%` no son ejecutables por esos roles; `service_role` conserva acceso.
- `appointments_barber_no_overlap`: instalada y validada.
- 13 citas, 0 intervalos invertidos y 0 solapamientos activos.

Ensayo transaccional sobre `Hermes Shop MIG-7`, con cuenta de cliente de pruebas existente:

1. Inserción de una suscripción sintética **solo dentro de la transacción**; la tienda no tenía registro de suscripción.
2. Preparar reserva no crea cita.
3. Otra identidad o audiencia no puede confirmar la propuesta.
4. Confirmar crea una cita real dentro de la transacción.
5. Reintentar devuelve la misma cita, sin duplicados.
6. Una inserción web directa solapada se rechaza por la exclusión común.
7. ROLLBACK completo y nueva consulta de verificación.

Resultado: 13 citas, 0 propuestas, suscripción de prueba no persistida. Checksum de todas las citas después de la corrección y del ensayo: `04f76eb92db1c38810fbe1a4bfbdb148`.

## HTTP OAuth + MCP real

Ejecutado contra `http://localhost:3124`, con la base Supabase real y dos cuentas de prueba distintas. No son mocks y no implica una conexión ya probada desde ChatGPT o Claude.

```bash
MCP_SMOKE_ENV=/ruta/segura/.env.local \
MCP_SMOKE_ACCOUNTS=/ruta/segura/.test-accounts.json \
node scripts/mcp-live-smoke.mjs
```

El archivo de cuentas debe contener `1` y `2`, cada una con `clientEmail`, `password`, `clientId`. Nunca se imprimen las credenciales ni los tokens. El smoke usa explícitamente los valores del archivo de entorno para no heredar una clave de otro proyecto del proceso padre.

Comprobado:

- Acceso sin bearer: 401.
- Login real de dos cuentas mediante Supabase Auth.
- Registro dinámico, pantalla y aprobación de consentimiento, nonce, PKCE y code exchange por HTTP.
- Reutilizar un código de autorización: rechazado.
- Inicialización y llamadas mediante el SDK MCP real sobre Streamable HTTP.
- Para cada cuenta, `list_my_appointments` coincide exactamente con sus citas de base de datos.
- Inyección de `userId` en argumentos: rechazada.
- Scope solo lectura no expone herramientas de reserva; no se expone escritura de preferencias sin su scope.
- Rotación de refresh; access y refresh anteriores dejan de valer.
- Revocación aplicada: acceso posterior 401.
- Eliminación de los clientes OAuth de ensayo y de sus códigos/concesiones por cascada.
- Recuento de citas sin cambios (13).

La comprobación final encontró **0 clientes, 0 códigos, 0 concesiones, 0 propuestas y 0 preferencias** en las tablas nuevas. No se guardó ninguna cita ni preferencia de ensayo.

## Readiness y límites

- Local: `/api/mcp/status` devuelve HTTP 200, `ready: true`, `status: schema_available`.
- Mantiene deliberadamente `endToEndVerified: false`: no representa por sí mismo la comprobación con un asistente externo.
- `/conectar` y discovery OAuth responden 200 en local.
- El ensayo de reserva completa se hizo en la base real con rollback. El smoke HTTP no crea citas, modifica suscripciones ni realiza cargos.
- La URL pública de rama devolvía 404 al comenzar esta verificación. No se puede dar por desplegado ni afirmar una conexión real desde Claude/ChatGPT hasta comprobar el alojamiento público y completar ese recorrido.
