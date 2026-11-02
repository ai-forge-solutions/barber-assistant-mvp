import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('resources use the canonical brand red and scope their styles to their own shell', () => {
  const css = readFileSync(new URL('../app/recursos/resources.css', import.meta.url), 'utf8')
  const brand = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
  const canonicalRed = brand.match(/--color-rojo:\s*(#[\da-f]+)/i)?.[1]
  assert.equal(canonicalRed, '#C8102E')
  assert.equal(css.match(/--resources-red:\s*(#[\da-f]+)/i)?.[1], canonicalRed)
  assert.doesNotMatch(css, /box-shadow|linear-gradient|radial-gradient/)
  assert.doesNotMatch(css, /(^|\n)\s*(body|html|h1|a)\s*\{/)
  assert.match(css, /font-family: 'Oswald', 'trujas Oswald Fallback', sans-serif/)
  const fallback = css.match(/@font-face\s*\{([^}]+)\}/)?.[1]
  assert.ok(fallback, 'Condensed local fallback avoids heading reflow while Oswald loads')
  assert.match(fallback, /font-family: 'trujas Oswald Fallback'/)
  assert.match(fallback, /size-adjust: 80\.15%/)
  assert.doesNotMatch(fallback, /url\(/)
})
