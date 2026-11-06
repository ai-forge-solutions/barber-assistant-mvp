# Piloto MCP de reservas de trujas

## Estado verificado · 2026-11-06

Las tres migraciones ya están aplicadas al proyecto de trujas. Se verificaron permisos, reserva/idempotencia/solapes con rollback en Supabase real, y OAuth + MCP HTTP con dos cuentas de prueba. Suite MCP: **67 pruebas correctas, ninguna saltada**; lint y build correctos usando explícitamente el entorno de trujas. Local `/api/mcp/status`: HTTP 200, `ready: true`.

La rama pública todavía devuelve 404. Esto **no** acredita despliegue ni conexión desde Claude/ChatGPT. Evidencia, cambios heredados y comando reproducible: [MCP-PILOT-VERIFICATION.md](MCP-PILOT-VERIFICATION.md).

## Estado y alcance

Rama de pruebas: `feat/mcp-booking-pilot`, basada en `develop`. No promueve producción.

Recorrido: asistente compatible → descubrimiento OAuth → login individual de trujas → consentimiento → MCP `/mcp` → propuesta persistente → confirmación transaccional → cita.

Este código **no activa por sí solo el piloto**: las tres migraciones deben aplicarse al proyecto Supabase de trujas y probarse con cuentas controladas. Una barbería de pruebas en la base compartida no es un entorno aislado. `/api/mcp/status` comprueba acceso al esquema, no una conexión E2E en ChatGPT/Claude. `/conectar` informa del estado y muestra el endpoint del dominio actual. No hay publicación en directorios.

## Modelo multibarbería

- No había mapa, favoritos ni relación de pertenencia cliente–barberías en el modelo auditado.
- `get_my_barbershops` obtiene las barberías del historial **del usuario autenticado**. Las reservas canceladas también forman parte del historial: no son visitas verificadas.
- Compatibilidad con citas antiguas sin `shop_id`: se resuelve por servicio y, como último recurso, por profesional.
- El historial no limita dónde puede reservar el cliente: `get_barbershop` resuelve el slug exacto de otra barbería pública.
- No se usa automáticamente la última barbería. Con varias sin elección/preferencia explícita se pide aclaración.
- `customer_shop_preferences` guarda una preferencia explícita por usuario, compartida entre sus asistentes. No se rellena desde el historial y no elimina el acceso a otras barberías. La web actual no dispone aún de un editor de esta preferencia.
- Toda operación de disponibilidad/propuesta lleva `shopId`, `barberId` y `serviceId`; PostgreSQL valida la pertenencia de los tres. Una preferencia no es autorización ni una selección implícita en las operaciones de escritura.
- Las citas propias se filtran por usuario y barbería **antes** de limitar el historial a 200; se indica truncamiento.

## Auth y permisos

OAuth público con registro dinámico, código de autorización y PKCE S256; resource audience ligado al origen `/mcp`. Tokens opacos independientes de la sesión Supabase, solo hashes persistidos. Código de un solo uso, acceso de una hora, refresh rotatorio, revocación; consulta de la concesión en cada petición. Cerrar sesión en la web **no** revoca los asistentes: `/oauth/connections` permite hacerlo expresamente.

Scopes: `bookings:read`, `bookings:write`, `preferences:write`. El listado de herramientas se restringe a los scopes concedidos. El MCP nunca acepta un `user_id`/`client_id` del modelo. El cliente OAuth no es una persona verificada por su nombre: en consentimiento se muestran cuenta, nombre declarado y URL de retorno.

El consentimiento usa sesión Supabase validada con `getUser`, nonce ligado a solicitud y usuario, cookie HttpOnly, comprobación Origin y protección contra framing. Los redirects deben estar registrados exactamente; solo HTTPS o loopback HTTP para desarrollo. No hay fetch de URLs de clientes (sin SSRF de metadatos). Registro limitado por instancia y con límite persistente global; antes de exposición pública masiva, revisar política/rate limiting a nivel de plataforma.

Transporte SDK oficial MCP Streamable HTTP, JSON y sin sesiones de proceso: apto para funciones Netlify. No canal SSE GET permanente. Peticiones sin bearer devuelven `401` + `WWW-Authenticate` de descubrimiento, no redirección HTML. Origins de navegador explícitos; clientes backend pueden omitir Origin. CORS no es autorización.

## Reservas y límites

`prepare_booking` valida y persiste una propuesta de 10 minutos **sin bloquear hueco ni crear cita**. Devuelve precio, servicio, barbería, profesional, horas UTC/locales y zona IANA. `confirm_booking` requiere propuesta + `confirmed:true`; las instrucciones exigen mostrar detalles y obtener consentimiento. El booleano no demuestra por sí mismo un gesto humano: dependemos también de las políticas de confirmación del cliente MCP. No presentar esto como firma humana criptográfica.

La confirmación vincula usuario/recurso, revalida perfil completo, suscripción del local, servicio y profesional activos, precio/duración/nombres, horario, descansos y bloqueos. Rechaza tiempos locales inexistentes o ambiguos por DST. Reintentar la misma propuesta devuelve la misma cita incluso tras caducar, si ya fue confirmada. Inserción con `shop_id` explícito. No utiliza el POST legado de citas.

Una exclusión GiST en `appointments` evita solapamientos también contra escrituras de la web. La migración bloquea brevemente la tabla al instalarla y **falla si encuentra solapamientos históricos no cancelados**, sin borrar ni corregir filas. Las funciones usan locks conservadores de profesional/horarios/bloqueos/suscripciones para este piloto; revisar granularidad antes de escalar.

No incluye pagos, cambios ni cancelación. La creación MCP no ejecuta el envío de confirmación inmediata de la ruta web; no prometer paridad de notificaciones. No se ha probado todavía una reserva desde una cuenta real de ChatGPT/Claude ni distribuido el conector en sus directorios.

## Cambios de base de datos: revisión y activación

**Proyecto esperado:** `gnskwavxxipvwpznzzdh` (trujas). La conexión SQL global del agente pertenece a otro producto: NO utilizarla ni inferir acceso correcto por tener credenciales globales.

Orden:
1. `supabase/migrations/20261106184405_mcp_oauth.sql`: tablas de clientes, códigos y concesiones OAuth + RPCs de registro/exchange/refresh.
2. `supabase/migrations/20261106184407_mcp_booking.sql`: extensión `btree_gist`, exclusión en `appointments`, tabla de propuestas y funciones de disponibilidad/preparación/confirmación.
3. `supabase/migrations/20261106184409_customer_shop_preferences.sql`: preferencias explícitas y lecturas seguras de historial/citas.

No hay backfill de preferencias ni limpieza de citas. Nuevas tablas/RPCs solo accesibles al rol de servicio; RLS activada. Revisar SQL e impacto de locks/constraint antes de aplicar contra la base compartida. La service-role REST existente no es una conexión SQL ni permiso para crear un ejecutor SQL improvisado.

Aplicar con acceso SQL/management al proyecto correcto o mediante su SQL Editor tras revisión. No automatizado ni aplicado por este cambio. Conservar el registro normal de migraciones del proyecto y no ejecutar las funciones como RPCs públicas.

Después:
- comprobar `/api/mcp/status` y metadatos `.well-known` con el **dominio exacto de la rama**;
- comprobar login/callback Supabase en ese dominio (redirect allowlist del proyecto debe permitirlo);
- conectar dos cuentas de prueba, autorizar scopes distintos, comprobar que no ven ni confirman citas/propuestas de la otra;
- reservar únicamente con datos de prueba y permiso explícito, probar reintento/concurrencia/revocación y recuperar la cita persistida;
- conectar y probar de forma independiente desde Claude y ChatGPT. Compatibilidad de cliente/plan/workspace no garantizada por un handshake técnico.

## Validación reproducible

Node 22+ para tests TypeScript directos:

```sh
npm ci
npm run test:mcp
npm run lint
npm run build
```

Los tests `mcp-*-db` se omiten si no se facilita `MCP_TEST_MODULES`. Para ejecutar PostgreSQL real **local y desechable**, sin tocar Supabase:

```sh
npm install --prefix /tmp/mcp-pg --no-save embedded-postgres pg
MCP_TEST_MODULES=/tmp/mcp-pg/node_modules npm run test:mcp
```

Los tests usan puertos locales distintos, fixtures sintéticos explícitos y directorios temporales. Nunca interpretar estos fixtures como datos reales de trujas. Los tests de protocolo ejecutan SDK real y servicios inyectados; no sustituyen el smoke con cuentas reales.

Para regresiones HTTP existentes, levantar `next start` con las variables de trujas cargadas de forma segura y usar `SEO_TEST_BASE_URL=http://localhost:<puerto>` al ejecutar los tests HTTP. No pegar ni subir `.env.local`, contraseñas o tokens.
