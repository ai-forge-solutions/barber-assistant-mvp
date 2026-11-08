import test from 'node:test'
import assert from 'node:assert/strict'

function fakeDb(results) {
  const calls = []
  const db = { calls, rpc: (name, args) => { calls.push(['rpc', name, args]); return Promise.resolve(results[name]) }, from: (table) => {
    calls.push(['from', table])
    const query = new Proxy({}, { get: (_, method) => method === 'then' ? (resolve, reject) => Promise.resolve(results[table]).then(resolve, reject) : (...args) => { calls.push([method, ...args]); return query } })
    return query
  } }
  return db
}

test('known barber shops are derived from authenticated-user history and explicit preference only', async () => {
  const { createShopServices } = await import('../lib/mcp/shops.ts')
  const db = fakeDb({ mcp_known_shops: { data: [{ id: 'a', name: 'Centro', slug: 'centro' }, { id: 'b', name: 'Norte', slug: 'norte' }] }, customer_shop_preferences: { data: null } })
  const result = await createShopServices(db).myShops('signed-in-user')
  assert.equal(result.selection, 'ask_customer')
  assert.deepEqual(db.calls.find(c => c[0] === 'rpc'), ['rpc', 'mcp_known_shops', { p_user_id: 'signed-in-user' }])
  assert.ok(db.calls.some(c => c[0] === 'eq' && c[1] === 'user_id' && c[2] === 'signed-in-user'))
})
