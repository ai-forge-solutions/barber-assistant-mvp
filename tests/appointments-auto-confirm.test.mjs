import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)

// Same transpile-and-execute approach as the OAuth route tests. Only the
// Supabase and Resend boundaries are replaced; all local application code runs.
function loadRoute(seams) {
  const cache = new Map()
  function load(url) {
    if (cache.has(url.href)) return cache.get(url.href).exports
    const mod = { exports: {} }
    cache.set(url.href, mod)
    const js = ts.transpileModule(readFileSync(url, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText
    const localRequire = (id) => {
      if (Object.hasOwn(seams, id)) return seams[id]
      if (id.startsWith('@/')) return load(new URL(`../${id.slice(2)}.ts`, import.meta.url))
      return require(id)
    }
    new Function('require', 'exports', 'module', js)(localRequire, mod.exports, mod)
    return mod.exports
  }
  return load(new URL('../app/api/appointments/route.ts', import.meta.url))
}

test('new web reservations are inserted and returned confirmed without barber acceptance', { timeout: 5000 }, async (t) => {
  const previousSecret = process.env.CANCEL_JWT_SECRET
  process.env.CANCEL_JWT_SECRET = 'offline-test-only-cancel-token-secret'
  t.after(() => {
    if (previousSecret === undefined) delete process.env.CANCEL_JWT_SECRET
    else process.env.CANCEL_JWT_SECRET = previousSecret
  })

  const body = {
    barberId: 'barber-test', serviceId: 'service-test', clientId: 'client-test',
    startsAt: '2030-06-10T10:00:00.000Z',
  }
  const inserts = []
  const emails = []
  let finishEmails
  const emailsFinished = new Promise((resolve) => { finishEmails = resolve })
  const service = { id: body.serviceId, name: 'Corte', duration_min: 30, price: 20, shop_id: 'shop-test' }
  const users = {
    'client-test': { id: body.clientId, email: 'client@example.test', user_metadata: {} },
    'barber-user-test': { id: 'barber-user-test', email: 'barber@example.test', user_metadata: {} },
  }
  const db = {
    auth: { admin: { getUserById: async (id) => ({ data: { user: users[id] }, error: null }) } },
    from(table) {
      let inserted
      const result = () => {
        switch (table) {
          case 'services': return { data: service, error: null }
          case 'appointments': return { data: inserted ? { id: 'appointment-test', ...inserted } : [], error: null }
          case 'blocked_slots': return { data: [], error: null }
          case 'barbers': return { data: { user_id: 'barber-user-test', display_name: 'Barbero', notification_email: true }, error: null }
          case 'shops': return { data: { name: 'Barbería de prueba' }, error: null }
          case 'customers': return { data: { id: body.clientId, full_name: 'Cliente', phone: '+34600000000' }, error: null }
          default: throw new Error(`Unexpected database table: ${table}`)
        }
      }
      const query = {
        select: () => query, eq: () => query, not: () => query, lt: () => query, gt: () => query,
        insert(value) { assert.equal(table, 'appointments'); inserts.push(value); inserted = value; return query },
        maybeSingle: async () => result(), single: async () => result(),
        then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject) },
      }
      return query
    },
  }
  const { POST } = loadRoute({
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: users['client-test'] } }) } }) },
    '@/lib/supabase/admin': { supabaseAdmin: db },
    resend: { Resend: class {
      emails = { send: async (message) => { emails.push(message); if (emails.length === 2) finishEmails(); return { data: { id: 'offline' }, error: null } } }
    } },
  })
  const response = await POST(new Request('https://app.example.test/api/appointments', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }))
  await emailsFinished
  assert.equal(response.status, 201)
  const appointment = await response.json()
  assert.equal(inserts.length, 1)
  assert.equal(inserts[0].status, 'confirmed', 'persist new web bookings as confirmed')
  assert.equal(appointment.status, 'confirmed', 'return the confirmed persisted booking')
  assert.deepEqual(appointment, { id: 'appointment-test', ...inserts[0] })
  assert.equal(appointment.client_id, body.clientId)
  assert.equal(appointment.ends_at, '2030-06-10T10:30:00.000Z')
  assert.equal(appointment.reminder_sent, false)
  assert.equal(emails.length, 2)
  assert.match(emails[0].subject, /Cita confirmada/)
  assert.match(emails[0].html, /Cita confirmada/)
  for (const email of emails) assert.doesNotMatch(email.html, /pendiente|aceptaci[oó]n/i)
})
