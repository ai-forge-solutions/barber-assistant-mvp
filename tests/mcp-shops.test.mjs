import test from 'node:test'
import assert from 'node:assert/strict'

const policy = () => import('../lib/mcp/shop-policy.ts')
const a = { id: 'shop-a', name: 'Centro', slug: 'centro' }
const b = { id: 'shop-b', name: 'Norte', slug: 'norte' }

test('multiple historical shops without an explicit preference require clarification', async () => {
  const { shopContext } = await policy()
  const result = shopContext([a, b], null)
  assert.equal(result.selection, 'ask_customer')
  assert.equal(result.preferred, null)
  assert.deepEqual(result.known, [a, b])
  assert.equal(result.historyIsAccessRestriction, false)
})
