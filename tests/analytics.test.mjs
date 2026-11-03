import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const source = (path) => readFileSync(fileURLToPath(new URL(path, root)), 'utf8')

// Transpile lib/analytics into a temp dir so each test gets a fresh module
// (its consent state is module-level) without a Next build.
function loadAnalytics(measurementId) {
  const dir = mkdtempSync(join(tmpdir(), 'trujas-analytics-'))
  const compile = (code) =>
    ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  writeFileSync(join(dir, 'url.mjs'), compile(source('lib/analytics/url.ts')))
  const index = compile(source('lib/analytics/index.ts'))
    .replace("from './url'", "from './url.mjs'")
    .replace('process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID', JSON.stringify(measurementId ?? null))
  writeFileSync(join(dir, 'index.mjs'), index)
  return Promise.all([import(pathToFileURL(join(dir, 'index.mjs'))), import(pathToFileURL(join(dir, 'url.mjs')))])
}

function fakeBrowser(href, { stored = null, referrer = '' } = {}) {
  const storage = new Map(stored ? [['trujas_consent_v1', stored]] : [])
  const scripts = []
  const cookies = new Map([['_ga', 'GA1.1.123'], ['_ga_TEST', 'GS1.1'], ['sb-auth', 'keep']])
  const location = new URL(href)
  globalThis.window = {
    location,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  }
  globalThis.document = {
    referrer,
    head: { appendChild: (node) => scripts.push(node) },
    createElement: (tag) => ({ tag }),
    get cookie() {
      return [...cookies].map(([k, v]) => `${k}=${v}`).join('; ')
    },
    set cookie(value) {
      const [pair] = value.split(';')
      const [name] = pair.split('=')
      if (/Max-Age=0/.test(value)) cookies.delete(name.trim())
    },
  }
  return { storage, scripts, cookies, location }
}

// dataLayer holds `arguments` objects; turn them into plain arrays.
const layer = () => (globalThis.window.dataLayer ?? []).map((args) => Array.from(args))
const events = () => layer().filter(([kind]) => kind === 'event').map(([, name, params]) => [name, params])
const lastSet = () => layer().filter(([kind]) => kind === 'set').at(-1)?.[1]

test('sanitizeUrl keeps only allowlisted params and drops the hash', async () => {
  const [, { sanitizeUrl }] = await loadAnalytics('G-TEST123')
  assert.equal(
    sanitizeUrl('https://trujas.app/billing?checkout=success&session_id=cs_live_abc123#x'),
    'https://trujas.app/billing?checkout=success',
  )
  assert.equal(
    sanitizeUrl('https://trujas.app/auth/callback?code=secret&next=%2Fdashboard&utm_source=ig'),
    'https://trujas.app/auth/callback?utm_source=ig',
  )
  assert.equal(
    sanitizeUrl('https://trujas.app/auth/client?email=ana%40mail.com&phone=600000000'),
    'https://trujas.app/auth/client',
  )
  assert.equal(sanitizeUrl('https://trujas.app/#access_token=abc&refresh_token=def'), 'https://trujas.app/')
})

test('sanitizePath replaces UUIDs and tokens but keeps shop slugs', async () => {
  const [, { sanitizePath }] = await loadAnalytics('G-TEST123')
  assert.equal(
    sanitizePath('/dashboard/barberos/2f1b6a0e-8c1d-4c5e-9f3a-1b2c3d4e5f60/horario'),
    '/dashboard/barberos/[id]/horario',
  )
  assert.equal(sanitizePath('/api/cancel/eyJhbGciOiJIUzI1NiJ9.eyJhcHBvaW50bWVudElkIjoiMSJ9.c2lnbmF0dXJl'), '/api/cancel/[token]')
  assert.equal(sanitizePath('/barberia-norte-madrid-centro-2024/reservar'), '/barberia-norte-madrid-centro-2024/reservar')
})

test('sanitizeReferrer reduces external referrers to their origin', async () => {
  const [, { sanitizeReferrer }] = await loadAnalytics('G-TEST123')
  assert.equal(sanitizeReferrer('https://checkout.stripe.com/c/pay/cs_live_abc#fid', 'https://trujas.app'), 'https://checkout.stripe.com/')
  assert.equal(sanitizeReferrer('https://trujas.app/billing?session_id=cs_x', 'https://trujas.app'), 'https://trujas.app/billing')
  assert.equal(sanitizeReferrer('', 'https://trujas.app'), undefined)
})

test('contentGroup maps every surface', async () => {
  const [, { contentGroup }] = await loadAnalytics('G-TEST123')
  const cases = {
    '/': 'landing', '/pricing': 'pricing', '/recursos/organizar-agenda-barberia': 'resources',
    '/auth/barber/signup': 'auth', '/onboarding': 'onboarding', '/billing': 'billing',
    '/dashboard/agenda': 'dashboard', '/cuenta/citas': 'client_account', '/cancel/success': 'booking_cancel',
    '/privacidad': 'legal', '/legal/proteccion-datos': 'legal', '/barberia-norte': 'shop', '/barberia-norte/reservar': 'booking',
  }
  for (const [path, group] of Object.entries(cases)) assert.equal(contentGroup(path), group, path)
})

test('without a measurement ID nothing loads and no banner opens', async () => {
  const browser = fakeBrowser('https://trujas.app/')
  const [analytics] = await loadAnalytics(null)
  assert.equal(analytics.analyticsEnabled, false)
  analytics.initAnalytics()
  analytics.setConsent('granted')
  analytics.track('cta_click', { cta_id: 'x' })
  assert.equal(analytics.consentSnapshot().bannerOpen, false)
  assert.equal(browser.scripts.length, 0)
  assert.equal(globalThis.window.dataLayer, undefined)
})

test('before consent: banner open, gtag.js not loaded, events dropped', async () => {
  const browser = fakeBrowser('https://trujas.app/')
  const [analytics] = await loadAnalytics('G-TEST123')
  analytics.initAnalytics()
  analytics.trackPageView()
  analytics.track('cta_click', { cta_id: 'start_free' })
  assert.equal(analytics.consentSnapshot().bannerOpen, true)
  assert.equal(browser.scripts.length, 0)
  assert.deepEqual(events(), [])
  assert.deepEqual(layer(), [['consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
  }]])
})

test('accepting loads gtag.js once and sends a sanitized page_view', async () => {
  const browser = fakeBrowser('https://trujas.app/billing?checkout=success&session_id=cs_live_secret', {
    referrer: 'https://checkout.stripe.com/c/pay/cs_live_secret',
  })
  const [analytics] = await loadAnalytics('G-TEST123')
  analytics.initAnalytics()
  analytics.setConsent('granted')

  assert.equal(browser.storage.get('trujas_consent_v1'), 'granted')
  assert.equal(analytics.consentSnapshot().bannerOpen, false)
  assert.equal(browser.scripts.length, 1)
  assert.equal(browser.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-TEST123')
  const config = layer().find(([kind]) => kind === 'config')
  assert.equal(config[2].send_page_view, false)
  assert.equal(config[2].allow_google_signals, false)
  assert.deepEqual(lastSet(), {
    page_location: 'https://trujas.app/billing?checkout=success',
    page_referrer: 'https://checkout.stripe.com/',
    content_group: 'billing',
  })
  assert.deepEqual(events(), [['page_view', undefined]])
  assert.ok(!JSON.stringify(layer()).includes('cs_live_secret'), 'Stripe session id must never reach the dataLayer')

  // Same URL again (e.g. React re-render) is not a new page view.
  analytics.trackPageView()
  // Client-side navigation: referrer is the previous sanitized page.
  browser.location.href = 'https://trujas.app/dashboard/barberos/2f1b6a0e-8c1d-4c5e-9f3a-1b2c3d4e5f60/horario'
  analytics.trackPageView()
  assert.deepEqual(lastSet(), {
    page_location: 'https://trujas.app/dashboard/barberos/[id]/horario',
    page_referrer: 'https://trujas.app/billing?checkout=success',
    content_group: 'dashboard',
  })
  assert.equal(events().filter(([name]) => name === 'page_view').length, 2)
})

test('a stored "granted" choice loads gtag on init, even if an event arrives first', async () => {
  const browser = fakeBrowser('https://trujas.app/pricing', { stored: 'granted' })
  const [analytics] = await loadAnalytics('G-TEST123')
  // A page effect can run before the root Analytics effect.
  analytics.track('begin_checkout', { plan: 'basic' })
  analytics.initAnalytics()
  assert.equal(analytics.consentSnapshot().bannerOpen, false)
  assert.equal(browser.scripts.length, 1)
  assert.deepEqual(events(), [['page_view', undefined], ['begin_checkout', { plan: 'basic' }]])
})

test('rejecting never loads gtag; withdrawing later disables GA and clears _ga cookies', async () => {
  const browser = fakeBrowser('https://trujas.app/', { stored: 'denied' })
  const [analytics] = await loadAnalytics('G-TEST123')
  analytics.initAnalytics()
  assert.equal(analytics.consentSnapshot().bannerOpen, false)
  assert.equal(browser.scripts.length, 0)

  analytics.openConsentBanner()
  assert.equal(analytics.consentSnapshot().bannerOpen, true)
  analytics.setConsent('granted')
  assert.equal(browser.scripts.length, 1)

  analytics.openConsentBanner()
  analytics.setConsent('denied')
  analytics.track('cta_click', { cta_id: 'after_withdrawal' })
  assert.equal(globalThis.window['ga-disable-G-TEST123'], true)
  assert.deepEqual(layer().filter(([kind, action]) => kind === 'consent' && action === 'update').at(-1)[2], { analytics_storage: 'denied' })
  assert.ok(!events().some(([, params]) => params?.cta_id === 'after_withdrawal'))
  assert.deepEqual([...browser.cookies.keys()], ['sb-auth'])
  assert.equal(browser.storage.get('trujas_consent_v1'), 'denied')
})

test('click delegation maps data-ga-* attributes to snake_case params', async () => {
  fakeBrowser('https://trujas.app/', { stored: 'granted' })
  const [analytics] = await loadAnalytics('G-TEST123')
  analytics.initAnalytics()
  const element = { dataset: { gaEvent: 'begin_checkout', gaPlan: 'basic', gaBillingCadence: 'annual', gaCtaLocation: 'landing_pricing' } }
  globalThis.Element = class {}
  const target = Object.assign(new globalThis.Element(), { closest: () => element })
  analytics.trackDelegatedClick({ target })
  assert.deepEqual(events().at(-1), ['begin_checkout', { plan: 'basic', billing_cadence: 'annual', cta_location: 'landing_pricing' }])
})

test('event call sites never pass personal data', () => {
  const files = [
    'components/auth/BarberAuthForm.tsx', 'app/auth/client/page.tsx', 'app/onboarding/page.tsx',
    'app/[slug]/reservar/page.tsx',
  ]
  for (const path of files) {
    const calls = source(path).match(/track\([^)]*\)/g) ?? []
    assert.ok(calls.length > 0, `${path} should track its funnel step`)
    for (const call of calls) {
      // Ignore string literals such as method: 'email'; check the values passed.
      const code = call.replace(/'[^']*'/g, "''")
      assert.doesNotMatch(code, /email|phone|name|Name|user\.id|clientId|barberId|serviceId|slug/, `${path}: ${call}`)
    }
  }
})

test('root layout mounts Analytics and the privacy page documents GA cookies', () => {
  assert.match(source('app/layout.tsx'), /<Analytics \/>/)
  const privacy = source('app/privacidad/page.tsx')
  assert.match(privacy, /id="cookies"/)
  assert.match(privacy, /Google Analytics/)
  assert.match(privacy, /_ga, _ga_<ID>/)
  assert.match(privacy, /CookieSettingsButton/)
})
