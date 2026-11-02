import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import nextTesting from 'next/experimental/testing/server.js'
// Next 16.2.9 documents doesProxyMatch but its Node helper exports the legacy name.
const { unstable_doesMiddlewareMatch: unstable_doesProxyMatch } = nextTesting

// Read the actual matcher literal, without importing auth/clients or reading env.
const source = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8')
const literal = source.match(/matcher:\s*\[\s*'([^']+)'/)?.[1]
assert.ok(literal, 'Expected one explicit matcher literal in proxy.ts')
const config = { matcher: [JSON.parse(`"${literal}"`)] }
const matches = (url) => unstable_doesProxyMatch({ config, nextConfig: {}, url })

test('exact crawl metadata paths bypass proxy with or without queries', () => {
  for (const url of ['/robots.txt', '/sitemap.xml', '/robots.txt?v=1', '/sitemap.xml?utm_source=qa']) {
    assert.equal(matches(url), false, url)
  }
})

test('near-matches, subroutes and product routes retain proxy matching', () => {
  for (const url of [
    '/robots.txt-extra', '/sitemap.xml-extra', '/robots.txt/other', '/sitemap.xml/other',
    '/robotsXtxt', '/sitemapXxml', '/dashboard', '/dashboard/agenda', '/seo-smoke-shop',
    '/recursos', '/recursos/montar-barberia-espana',
  ]) assert.equal(matches(url), true, url)
})
