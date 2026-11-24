import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import test from 'node:test'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { JSDOM } = require('jsdom')
const root = path.resolve(import.meta.dirname, '..')

// Execute real TS/TSX and the installed React runtime, like pricing-trust.test.mjs.
// Only the Next navigation hook needs a router context substitute during SSR.
function loader(overrides = {}) {
  const cache = new Map()
  function load(relativePath) {
    const filename = path.resolve(root, relativePath)
    if (cache.has(filename)) return cache.get(filename).exports
    const mod = { exports: {} }
    cache.set(filename, mod)
    const source = overrides[path.relative(root, filename)] ?? readFileSync(filename, 'utf8')
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      fileName: filename,
    }).outputText
    const localRequire = (specifier) => {
      if (specifier === 'next/navigation') return { useRouter: () => ({}) }
      if (specifier.startsWith('@/') || specifier.startsWith('.')) {
        const base = specifier.startsWith('@/') ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(filename), specifier)
        const resolved = [base, `${base}.ts`, `${base}.tsx`].find(existsSync)
        if (resolved) return load(resolved)
      }
      return require(specifier)
    }
    new Function('require', 'module', 'exports', compiled)(localRequire, mod, mod.exports)
    return mod.exports
  }
  return load
}

function pricingDocument(load = loader()) {
  return new JSDOM(renderToStaticMarkup(React.createElement(load('app/pricing/page.tsx').default))).window.document
}

test('/pricing renders four real monthly-priced software offers, including the commitment conditions', () => {
  const load = loader()
  const document = pricingDocument(load)
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
  assert.equal(scripts.length, 1, 'Pricing must render its SoftwareApplication JSON-LD')
  const schema = JSON.parse(scripts[0].textContent)
  const { PRICING_PLANS, TRIAL_PERIOD_DAYS, getPlanPrice, getPlanBillingLabel } = load('lib/billing/pricing.ts')
  assert.equal(schema['@context'], 'https://schema.org')
  assert.equal(schema['@type'], 'SoftwareApplication')
  assert.equal(schema.name, 'trujas')
  assert.equal(schema.url, 'https://trujas.app/pricing')
  assert.equal(schema.applicationCategory, 'BusinessApplication')
  assert.match(schema.description, new RegExp(`${TRIAL_PERIOD_DAYS} días gratis`))
  assert.match(schema.description, /cancela.*primeros 30 días/i)
  assert.match(schema.description, /después.*modalidad elegida/i)
  assert.equal(schema.offers.length, 4)
  const expected = PRICING_PLANS.flatMap((plan) => ['monthly', 'annual'].map((cadence) => ({ plan, cadence })))
  schema.offers.forEach((offer, i) => {
    const { plan, cadence } = expected[i]
    assert.equal(offer['@type'], 'Offer')
    assert.ok(offer.name.includes(plan.name))
    assert.equal(offer.price, getPlanPrice(plan, cadence))
    assert.ok(offer.price > 0, 'The limited trial must not be a lasting zero-price offer')
    assert.equal(offer.priceCurrency, 'EUR')
    assert.equal(offer.url, schema.url)
    assert.ok(offer.description.includes(getPlanBillingLabel(plan, cadence)))
    assert.deepEqual(offer.priceSpecification, {
      '@type': 'UnitPriceSpecification', price: offer.price, priceCurrency: 'EUR', billingDuration: 'P1M',
    })
    if (cadence === 'annual') assert.match(offer.description, /permanencia de 12 meses/)
    else assert.match(offer.description, /Mes a mes/)
  })
  assert.deepEqual(schema.offers.map(({ price }) => price), [29, 15, 39, 32])
  assert.doesNotMatch(JSON.stringify(schema), /aggregateRating|review|STRIPE_|LookupKey|lookupKey|price_barberia|price_\w+|P12M|valueAddedTaxIncluded|tax/)
})


test('pricing reuses the shared serializer and keeps malicious plan text inside its script', () => {
  const load = loader()
  const billing = load('lib/billing/pricing.ts')
  const plan = billing.PRICING_PLANS[0]
  const original = plan.name
  const payload = '</script><script id="injected">alert(1)</script>'
  try {
    plan.name = payload
    const document = pricingDocument(load)
    const scripts = [...document.querySelectorAll('script')]
    assert.equal(scripts.length, 1)
    assert.equal(document.querySelector('#injected'), null)
    assert.ok(scripts[0].textContent.includes('\\u003c/script>'))
    assert.ok(JSON.parse(scripts[0].textContent).offers[0].name.includes(payload))
    const source = readFileSync(path.join(root, 'app/pricing/page.tsx'), 'utf8')
    assert.match(source, /import JsonLd from ['"]@\/components\/seo\/JsonLd['"]/)
    assert.doesNotMatch(source, /dangerouslySetInnerHTML|JSON\.stringify/)
  } finally {
    plan.name = original
  }
})

test('adding pricing JSON-LD leaves the pre-existing visible page DOM and metadata unchanged', () => {
  const originalSource = execFileSync('git', ['show', 'HEAD:app/pricing/page.tsx'], { cwd: root, encoding: 'utf8' })
  const previous = loader({ 'app/pricing/page.tsx': originalSource })
  const current = loader()
  const originalDocument = pricingDocument(previous)
  const currentDocument = pricingDocument(current)
  for (const document of [originalDocument, currentDocument]) {
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => script.remove())
  }
  assert.equal(currentDocument.body.innerHTML, originalDocument.body.innerHTML)
  assert.deepEqual(current('app/pricing/page.tsx').metadata, previous('app/pricing/page.tsx').metadata)
})

test('the pricing schema is mounted on /pricing only, never in shared layouts or home', () => {
  const users = []
  for (const directory of ['app', 'components']) {
    for (const entry of readdirSync(path.join(root, directory), { recursive: true })) {
      if (!/\.[jt]sx?$/.test(entry)) continue
      const relative = `${directory}/${entry}`
      if (/pricingSoftwareSchema|pricing-structured-data/.test(readFileSync(path.join(root, relative), 'utf8'))) users.push(relative)
    }
  }
  assert.deepEqual(users, ['app/pricing/page.tsx'])
})
