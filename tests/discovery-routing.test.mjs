import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
function load(path, stubs = {}) {
  const file = new URL(`../${path}`, import.meta.url)
  assert.ok(existsSync(file), `${path} must exist`)
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  })
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', outputText)((name) => {
    if (Object.hasOwn(stubs, name)) return stubs[name]
    assert.ok(['react/jsx-runtime', 'next/navigation', 'next/link'].includes(name), `Unexpected dependency ${name}`)
    return require(name)
  }, loaded, loaded.exports)
  return loaded.exports
}

function shopPage({ exists = true, user = null, profile = true, error = null } = {}) {
  const events = []
  const shop = { id: 'shop-id', name: 'Barbería real', slug: 'barberia-real', address: 'Dirección pública' }
  function query(client, table) {
    const q = {
      select(columns) { events.push([client, table, 'select', columns]); return q },
      eq(column, value) { events.push([client, table, 'eq', column, value]); return q },
      order() { return q },
      maybeSingle() { return Promise.resolve({ data: exists ? shop : null, error }) },
      then(resolve, reject) { return Promise.resolve({ data: [] }).then(resolve, reject) },
    }
    return q
  }
  const page = load('app/[slug]/page.tsx', {
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => { events.push(['auth']); return { data: { user } } } },
      from: (table) => query('session', table),
    }) },
    '@/lib/supabase/admin': { supabaseAdmin: {
      from: (table) => query('admin', table),
      rpc: async (...args) => { events.push(['rpc', ...args]); return { data: true } },
    } },
    '@/lib/auth/customers': {
      getCustomer: async () => { events.push(['customer']); return profile ? { name: 'Cliente' } : null },
      hasRequiredCustomer: (customer) => Boolean(customer),
    },
    '@/components/nav/PublicNav': () => null,
    '@/components/brand/ColorStripe': () => null,
    './BookingButton': () => createElement('button', {}, 'Reservar cita'),
  }).default
  return { run: () => page({ params: Promise.resolve({ slug: 'barberia-real' }) }), events }
}

test('branded not-found gives a clear 404 and a usable return home link', () => {
  const NotFound = load('app/not-found.tsx', {
    '@/components/brand/ColorStripe': () => createElement('div', { 'aria-hidden': true }),
  }).default
  const html = renderToStaticMarkup(createElement(NotFound))
  assert.match(html, /<h1[^>]*>[^<]*Página no encontrada<\/h1>/)
  assert.match(html, /404/)
  assert.match(html, /trujas/)
  assert.match(html, /href="\/"/)
  assert.match(html, /Volver al inicio/)
  assert.match(html, /#C8102E/)
  assert.match(html, /Oswald/)
  assert.match(html, /DM_Sans/)
  assert.match(html, /Rye/)
  assert.doesNotMatch(html, /rounded-(?:lg|xl|full)|font-\['(?:Inter|Arial|Roboto)'\]/)
})

test('database failures are not mislabeled as missing shops or exposed as database details', async () => {
  const { run, events } = shopPage({ exists: false, error: { message: 'SECRET DATABASE DETAIL' } })
  await assert.rejects(run, (e) => e.message === 'No se pudo comprobar la barbería' && !e.digest)
  assert.equal(events.some(([name]) => name === 'auth'), false)
})

test('unknown root slug returns the real Next 404 signal before login or customer lookup', async () => {
  const { run, events } = shopPage({ exists: false })
  await assert.rejects(run, (e) => e.digest === 'NEXT_HTTP_ERROR_FALLBACK;404')
  assert.deepEqual(events, [
    ['admin', 'shops', 'select', 'id'],
    ['admin', 'shops', 'eq', 'slug', 'barberia-real'],
  ])
})

test('real shop still sends anonymous users to client auth preserving next', async () => {
  const { run, events } = shopPage()
  await assert.rejects(run, (e) => e.digest === 'NEXT_REDIRECT;replace;/auth/client?next=%2Fbarberia-real;307;')
  assert.equal(events.some(([name]) => name === 'rpc' || name === 'customer'), false)
})

test('real shop still requires the customer profile', async () => {
  const { run, events } = shopPage({ user: { id: 'user-id' }, profile: false })
  await assert.rejects(run, (e) => e.digest === 'NEXT_REDIRECT;replace;/auth/client/profile?next=%2Fbarberia-real;307;')
  assert.equal(events.some(([name]) => name === 'rpc'), false)
})

test('authenticated real shop preserves catalog, subscription and booking rendering', async () => {
  const { run, events } = shopPage({ user: { id: 'user-id' } })
  const html = renderToStaticMarkup(await run())
  assert.match(html, /Barbería real/)
  assert.match(html, /Reservar cita/)
  assert.ok(events.some(([name, rpc, args]) => name === 'rpc' && rpc === 'shop_has_active_subscription' && args.target_shop_id === 'shop-id'))
  for (const table of ['services', 'barbers', 'schedules']) {
    assert.ok(events.some(([client, name]) => client === 'session' && name === table), table)
  }
})
