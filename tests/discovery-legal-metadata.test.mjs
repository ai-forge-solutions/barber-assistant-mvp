import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import test from 'node:test'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = path.resolve(import.meta.dirname, '..')
function load(file) {
  const loaded = { exports: {} }
  const compiled = ts.transpileModule(readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  new Function('require', 'module', 'exports', compiled)((name) => {
    if (name === '@/lib/seo') return load('lib/seo.ts')
    if (name.startsWith('@/components/')) return { default: () => null }
    return require(name)
  }, loaded, loaded.exports)
  return loaded.exports
}
for (const [route, title] of [['privacidad', 'Política de privacidad'], ['terminos', 'Términos de uso']]) {
  test(`${route}: metadata propia y canonical de producción sin noindex`, () => {
    const { metadata } = load(`app/${route}/page.tsx`)
    assert.ok(metadata, 'La página legal necesita metadata propia')
    assert.equal(metadata.title, `${title} — trujas`)
    assert.equal(metadata.alternates.canonical, `https://trujas.app/${route}`)
    assert.ok(metadata.description.length > 40)
    assert.equal(metadata.openGraph.url, `https://trujas.app/${route}`)
    assert.notEqual(metadata.robots?.index, false)
    assert.doesNotMatch(JSON.stringify(metadata.robots ?? {}), /noindex/)
  })
}
