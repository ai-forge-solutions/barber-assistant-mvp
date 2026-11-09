import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
function load(path, router) {
  const url = new URL('../' + path, import.meta.url)
  assert.ok(existsSync(url), `Missing ${path}`)
  const source = ts.transpileModule(readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const loadedModule = { exports: {} }
  new Function('require', 'module', 'exports', source)((id) => id === 'next/navigation' ? { useRouter: () => router } : require(id), loadedModule, loadedModule.exports)
  return loadedModule.exports.default
}

test('pricing arrow returns to the previous page and falls back to home without history', () => {
  const calls = []
  const previous = globalThis.window
  const router = { back: () => calls.push('back'), push: (url) => calls.push(url) }
  try {
    const Back = load('components/pricing/PricingBackButton.tsx', router)
    globalThis.window = { history: { length: 2 } }
    const button = Back()
    assert.equal(button.type, 'button')
    assert.equal(button.props['aria-label'], 'Volver atrás')
    assert.equal(button.props.type, 'button')
    button.props.onClick()
    globalThis.window = { history: { length: 1 } }
    Back().props.onClick()
    assert.deepEqual(calls, ['back', '/'])
    assert.match(renderToStaticMarkup(React.createElement(Back)), /<svg/)
  } finally { globalThis.window = previous }
})

test('pricing FAQs explain the trial, commitment and cancellation without invented penalties', () => {
  const Faq = load('components/pricing/PricingFaq.tsx')
  const html = renderToStaticMarkup(React.createElement(Faq))
  assert.match(html, /Preguntas frecuentes/)
  assert.equal((html.match(/<details/g) || []).length, 4)
  assert.match(html, /30 días/)
  assert.match(html, /29€\/mes/)
  assert.match(html, /15€\/mes/)
  assert.match(html, /12 meses/)
  assert.match(html, /Gestionar suscripción/)
  assert.doesNotMatch(html, /penalización de|pagar todas las cuotas|reembolso garantizado/)
})

test('pricing FAQ identifies email as the reminder channel without promising WhatsApp automation', () => {
  const Faq = load('components/pricing/PricingFaq.tsx')
  const html = renderToStaticMarkup(React.createElement(Faq))
  const reminders = (html.match(/<details[\s\S]*?<\/details>/g) || []).find((item) => item.includes('¿Por dónde se envían los recordatorios?'))
  assert.ok(reminders, 'Missing reminder-channel FAQ')
  assert.match(reminders, /Los recordatorios de citas se envían por email/)
  assert.match(reminders, /no incluye recordatorios automáticos por WhatsApp/)
})
