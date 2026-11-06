import test from 'node:test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'

async function connect(scopes, overrides = {}) {
  const { createBookingServer } = await import('../lib/mcp/server.ts')
  const calls = []
  const services = new Proxy(overrides, { get: (target, name) => target[name] ?? (async (...args) => { calls.push([name, ...args]); return { ok: true } }) })
  const server = createBookingServer({ userId: 'authenticated-user', scope: scopes, resource: 'https://pilot.example/mcp', services })
  const [left, right] = InMemoryTransport.createLinkedPair()
  await server.connect(right)
  const client = new Client({ name: 'test-client', version: '1' })
  await client.connect(left)
  return { client, calls, close: async () => { await client.close(); await server.close() } }
}

test('MCP rejects caller-supplied customer identity without invoking services', async () => {
  const ctx = await connect('bookings:read bookings:write')
  try {
    const result = await ctx.client.callTool({ name: 'list_my_appointments', arguments: { userId: 'victim' } })
    assert.equal(result.isError, true)
    assert.equal(ctx.calls.length, 0)
    await ctx.client.callTool({ name: 'list_my_appointments', arguments: {} })
    assert.deepEqual(ctx.calls, [['myAppointments', 'authenticated-user', undefined]])
  } finally { await ctx.close() }
})

test('MCP confirmation requires explicit true and only accepts an immutable proposal ID', async () => {
  const ctx = await connect('bookings:write')
  try {
    const proposalId = '01234567-1234-4123-8123-012345678901'
    for (const args of [{ proposalId }, { proposalId, confirmed: false }, { proposalId, confirmed: true, shopId: proposalId }]) {
      const result = await ctx.client.callTool({ name: 'confirm_booking', arguments: args })
      assert.equal(result.isError, true)
    }
    assert.equal(ctx.calls.length, 0)
    await ctx.client.callTool({ name: 'confirm_booking', arguments: { proposalId, confirmed: true } })
    assert.deepEqual(ctx.calls, [['confirm', 'authenticated-user', proposalId, 'https://pilot.example/mcp']])
  } finally { await ctx.close() }
})

test('MCP read-only scope cannot call a write tool even if its name is known', async () => {
  const ctx = await connect('bookings:read')
  try {
    const result = await ctx.client.callTool({ name: 'set_preferred_barbershop', arguments: { shopId: null, confirmed: true } })
    assert.equal(result.isError, true)
    assert.equal(ctx.calls.length, 0)
  } finally { await ctx.close() }
})

test('MCP service errors do not leak SQL or customer data', async () => {
  const ctx = await connect('bookings:read', { myShops: async () => { throw new Error('SQL password=secret victim@example.com') } })
  try {
    const result = await ctx.client.callTool({ name: 'get_my_barbershops', arguments: {} })
    assert.equal(result.isError, true)
    assert.ok(!JSON.stringify(result).includes('victim@example.com'))
    assert.ok(!JSON.stringify(result).includes('secret'))
  } finally { await ctx.close() }
})

test('MCP read-only scope never advertises booking or preference writes', async () => {
  const ctx = await connect('bookings:read')
  try {
    const names = (await ctx.client.listTools()).tools.map(t => t.name)
    assert.ok(names.includes('get_my_barbershops'))
    assert.ok(names.includes('list_my_appointments'))
    assert.ok(!names.includes('confirm_booking'))
    assert.ok(!names.includes('set_preferred_barbershop'))
  } finally { await ctx.close() }
})
