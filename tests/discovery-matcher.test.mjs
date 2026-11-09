import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import nextTesting from 'next/experimental/testing/server.js'

// Use Next's compiled matcher, not a hand-rolled approximation of its regexp.
const { unstable_doesMiddlewareMatch: doesProxyMatch } = nextTesting
const source = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8')
const literal = source.match(/matcher:\s*\[\s*'([^']+)'/)?.[1]
assert.ok(literal)
const config = { matcher: [JSON.parse(`"${literal}"`)] }
const matches = (url) => doesProxyMatch({ config, nextConfig: {}, url })

test('llms.txt bypasses session proxy exactly, including query strings', () => {
  for (const path of ['/llms.txt', '/llms.txt?v=1', '/robots.txt', '/sitemap.xml']) {
    assert.equal(matches(path), false, path)
  }
})

test('near matches and booking/auth/API routes still use the session proxy', () => {
  for (const path of [
    '/llmsXtxt', '/llms.txt-extra', '/llms.txt/other', '/nested/llms.txt', '/LLMS.txt',
    '/real-barberia', '/real-barberia/book', '/auth/client', '/auth/callback',
    '/api/shops?slug=real-barberia', '/api/appointments', '/dashboard',
  ]) assert.equal(matches(path), true, path)
})
