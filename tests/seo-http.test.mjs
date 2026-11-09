import assert from 'node:assert/strict'
import test from 'node:test'

// Run against `next start` after a build (see docs/SEO.md). No backend writes.
const base = process.env.SEO_TEST_BASE_URL ?? 'http://127.0.0.1:3214'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) {
  throw new Error('SEO HTTP tests must target a local server')
}
const get = (path) => fetch(new URL(path, base), { redirect: 'manual' })

function canonical(html) {
  return html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1]
}

test('robots is public plain text, not a shop/login redirect', async () => {
  const response = await get('/robots.txt')
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') ?? '', /^text\/plain/)
  assert.equal(response.headers.get('location'), null)
  assert.equal(response.headers.get('set-cookie'), null)
  const body = await response.text()
  assert.match(body, /User-Agent: \*/)
  assert.match(body, /Allow: \//)
  assert.match(body, /Sitemap: https:\/\/trujas\.app\/sitemap\.xml/)
  assert.doesNotMatch(body, /<html/i)
  for (const path of ['/api/', '/auth/', '/dashboard', '/billing', '/onboarding', '/cuenta/', '/cancel/']) {
    assert.ok(body.includes(`Disallow: ${path}`), `Missing private crawl exclusion: ${path}`)
  }
})

test('sitemap is XML with an explicit marketing-only URL allowlist', async () => {
  const response = await get('/sitemap.xml')
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') ?? '', /(?:application|text)\/xml/)
  assert.equal(response.headers.get('location'), null)
  assert.equal(response.headers.get('set-cookie'), null)
  const body = await response.text()
  assert.match(body, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
  assert.deepEqual([...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]), [
    'https://trujas.app/', 'https://trujas.app/pricing',
    'https://trujas.app/sobre-nosotros',
    'https://trujas.app/recursos',
    'https://trujas.app/recursos/montar-barberia-espana',
    'https://trujas.app/recursos/organizar-agenda-barberia',
  ])
  assert.doesNotMatch(body, /<lastmod>/, 'Do not fabricate modification dates on each build')
})

test('home canonical and social metadata are in the initial HTML', async () => {
  const response = await get('/')
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.equal(canonical(html), 'https://trujas.app/')
  assert.match(html, /property="og:url" content="https:\/\/trujas\.app\/"/)
  assert.match(html, /property="og:locale" content="es_ES"/)
  assert.match(html, /Agenda online para barberías/)
  assert.match(html, /href="\/pricing"/)
  assert.match(html, /href="\/recursos"/, 'The editorial index must be discoverable from home')
})

test('pricing has its own canonical and title without changing the trial offer', async () => {
  const response = await get('/pricing')
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.equal(canonical(html), 'https://trujas.app/pricing')
  assert.match(html, /<title>Precios y planes para barberías — trujas<\/title>/)
  assert.match(html, /property="og:url" content="https:\/\/trujas\.app\/pricing"/)
  assert.match(html, /primer mes gratis/i)
  assert.match(html, /30 días gratis/)
})

// Root paths resolve shop existence before auth. These two checks require
// working read-only Supabase credentials; do not fabricate a shop fixture.
const shopSlug = process.env.SEO_TEST_SHOP_SLUG

test('a real shop retains the client login boundary', { skip: !shopSlug }, async () => {
  const path = `/${shopSlug}`
  const response = await get(path)
  assert.equal(response.status, 307, path)
  assert.equal(response.headers.get('location'), `/auth/client?next=${encodeURIComponent(path)}`)
})

test('unknown root slugs and metadata near-matches are real 404s', {
  skip: process.env.SEO_TEST_DATABASE_READS !== '1',
}, async () => {
  for (const path of ['/seo-missing-shop-9e26f4b7', '/robots.txt-extra', '/sitemap.xml-extra']) {
    const response = await get(path)
    assert.equal(response.status, 404, path)
    assert.equal(response.headers.get('location'), null, path)
  }
})

test('protected app still requires barber authentication', async () => {
  for (const path of ['/dashboard', '/dashboard/agenda']) {
    const response = await get(path)
    assert.equal(response.status, 307, path)
    assert.equal(response.headers.get('location'), '/auth/barber?next=/dashboard')
  }
})

test('global layout does not canonicalize login pages to the marketing homepage', async () => {
  const response = await get('/auth/barber')
  assert.equal(response.status, 200)
  assert.equal(canonical(await response.text()), undefined)
})
