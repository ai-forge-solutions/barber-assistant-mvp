import test from 'node:test'
import assert from 'node:assert/strict'

test('readiness requires every table to be accessible and never claims assistant E2E verification', async () => {
  const { mcpReadiness } = await import('../lib/mcp/readiness.ts')
  const db = { from() { return { select() { return { limit: async () => ({ error: null, status: 200, data: [] }) } } } } }
  const result = await mcpReadiness(db)
  assert.equal(result.ready, true)
  assert.equal(result.endToEndVerified, false)
})

test('readiness uses GET limit=0: PostgREST JS normalizes a bodyless HEAD 404 to a false 204 success', async () => {
  const { mcpReadiness } = await import('../lib/mcp/readiness.ts')
  const db = { from() { return { select(_column, options) { return { limit: async (limit) => {
    if (options?.head) return { error: null, status: 204 }
    assert.equal(limit, 0, 'readiness must not read any customer rows')
    return { error: { code: 'PGRST205' }, status: 404 }
  } } } } } }
  const result = await mcpReadiness(db)
  assert.equal(result.ready, false)
  assert.equal(result.status, 'database_setup_required')
})
