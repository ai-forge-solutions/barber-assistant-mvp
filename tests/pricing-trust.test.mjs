import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import test from 'node:test'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const React = require('react')
const { JSDOM } = require('jsdom')
const { renderToStaticMarkup } = require('react-dom/server')
const rootDir = path.resolve(import.meta.dirname, '..')
const cache = new Map()

// Transpile only the components under test; use the installed React/Next runtime.
function load(relativePath) {
  const filename = path.resolve(rootDir, relativePath)
  if (cache.has(filename)) return cache.get(filename).exports
  const loadedModule = { exports: {} }
  cache.set(filename, loadedModule)
  const source = readFileSync(filename, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText
  const localRequire = (specifier) => {
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      const base = specifier.startsWith('@/') ? path.join(rootDir, specifier.slice(2)) : path.resolve(path.dirname(filename), specifier)
      const resolved = [base, `${base}.ts`, `${base}.tsx`].find(existsSync)
      if (resolved) return load(resolved)
    }
    return require(specifier)
  }
  new Function('require', 'module', 'exports', compiled)(localRequire, loadedModule, loadedModule.exports)
  return loadedModule.exports
}

async function mountPricing(run) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' })
  const previous = { window: globalThis.window, document: globalThis.document, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT }
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const { createRoot } = require('react-dom/client')
  const root = createRoot(document.getElementById('root'))
  try {
    await React.act(() => root.render(React.createElement(load('components/pricing/PricingBlocks.tsx').PricingCards)))
    await run(document, async (button) => React.act(() => button.click()))
  } finally {
    await React.act(() => root.unmount())
    Object.assign(globalThis, previous)
    dom.window.close()
  }
}

function cadenceButton(document, label) {
  const labels = { Anual: ['Anual', 'Con permanencia de 12 meses'], Mensual: ['Mensual', 'Mes a mes'] }
  return [...document.querySelectorAll('button')].find((button) => (labels[label] ?? [label]).includes(button.textContent.trim()))
}


test('Pro conserva 32€/mes con permanencia y no muestra porcentajes de ahorro sin base visible', async () => {
  await mountPricing(async (document) => {
    const pro = document.querySelectorAll('article')[1]
    assert.match(pro.textContent, /32€\/mes con permanencia de 12 meses\. Primer mes gratis/)
    assert.doesNotMatch(pro.textContent, /Ahorra\s*\d+%/)
  })
})

test('el selector existente cambia Basic 15→29 y Pro 32→39 y actualiza el formulario sin enviar pagos', async () => {
  await mountPricing(async (document, click) => {
    const cards = [...document.querySelectorAll('article')]
    assert.match(cards[0].textContent, /15€/)
    assert.match(cards[1].textContent, /32€/)
    assert.deepEqual([...document.querySelectorAll('input[name="cadence"]')].map((input) => input.value), ['annual', 'annual'])
    await click(cadenceButton(document, 'Mensual'))
    assert.match(cards[0].textContent, /29€/)
    assert.match(cards[1].textContent, /39€/)
    assert.deepEqual([...document.querySelectorAll('input[name="cadence"]')].map((input) => input.value), ['monthly', 'monthly'])
    await click(cadenceButton(document, 'Anual'))
    assert.match(cards[0].textContent, /15€/)
    assert.match(cards[1].textContent, /32€/)
    assert.deepEqual([...document.querySelectorAll('input[name="plan"]')].map((input) => input.value), ['basic', 'pro'])
  })
})

test('la modalidad seleccionada expone su estado y aclara permanencia sin confundirla con pago anual', async () => {
  await mountPricing(async (document, click) => {
    const annual = [...document.querySelectorAll('button')].find((button) => /12 meses/.test(button.textContent))
    assert.ok(annual, 'El selector debe decir Con permanencia de 12 meses')
    assert.equal(annual.getAttribute('aria-pressed'), 'true')
    const monthly = cadenceButton(document, 'Mes a mes')
    assert.ok(monthly)
    assert.equal(monthly.getAttribute('aria-pressed'), 'false')
    assert.match(document.body.textContent, /Basic: 15€\/mes con permanencia de 12 meses o 29€\/mes mes a mes/)
    await click(monthly)
    assert.equal(annual.getAttribute('aria-pressed'), 'false')
    assert.equal(monthly.getAttribute('aria-pressed'), 'true')
    assert.match(document.querySelectorAll('article')[1].textContent, /Mes a mes\. Primer mes gratis/)
  })
})

test('el teaser de landing muestra Basic con permanencia de 12 meses y alternativa mes a mes', () => {
  const html = renderToStaticMarkup(React.createElement(load('components/pricing/PricingTeaser.tsx').default))
  const document = new JSDOM(html).window.document
  assert.match(document.body.textContent, /15€\/mes con permanencia de 12 meses/)
  assert.match(document.body.textContent, /29€\/mes mes a mes/)
  assert.equal(document.querySelector('input[name="plan"]').value, 'basic')
  assert.equal(document.querySelector('input[name="cadence"]').value, 'annual')
})

test('la comparación de landing describe qué comprobar sin atribuir precios o prácticas a terceros', () => {
  const file = 'components/landing/TrustComparison.tsx'
  assert.ok(existsSync(path.join(rootDir, file)), 'Falta la comparación honesta de landing')
  const html = renderToStaticMarkup(React.createElement(load(file).default))
  const document = new JSDOM(html).window.document
  assert.match(document.body.textContent, /Qué revisar en otras herramientas/)
  assert.match(document.body.textContent, /Consulta la tarifa y la permanencia/)
  assert.match(document.body.textContent, /15€\/mes con permanencia de 12 meses/)
  assert.match(document.body.textContent, /29€\/mes mes a mes/)
  assert.doesNotMatch(document.body.textContent, /400|500|Apps genéricas|Cadenas, salones|A veces/)
})

test('los mockups se etiquetan como ejemplos y el chat no suplanta a Pablo ni usa su foto', () => {
  const file = 'components/landing/ExampleMockup.tsx'
  assert.ok(existsSync(path.join(rootDir, file)), 'Falta el etiquetado de ejemplos')
  const { ExampleMockup, WhatsappExample } = load(file)
  const html = renderToStaticMarkup(React.createElement(ExampleMockup, { label: 'Agenda de ejemplo' }, React.createElement('div', null, 'Marcos Ruiz')))
  const document = new JSDOM(html).window.document
  assert.match(document.querySelector('figcaption').textContent, /Agenda de ejemplo.*Datos ficticios/)
  const chatHtml = renderToStaticMarkup(React.createElement(WhatsappExample))
  const chat = new JSDOM(chatHtml).window.document
  assert.match(chat.querySelector('figcaption').textContent, /Conversación ficticia.*No es un testimonio/)
  assert.match(chat.body.textContent, /Cliente de ejemplo/)
  assert.doesNotMatch(chatHtml, /Pablo|unsplash\.com/)
})
