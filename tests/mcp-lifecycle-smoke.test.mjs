import assert from 'node:assert/strict'
import test from 'node:test'

const helpers = new URL('../scripts/lib/mcp-lifecycle-smoke-helpers.mjs', import.meta.url)
test('target validation accepts only the literal reviewed HTTPS root', async () => {
  const {validateSupabaseUrl} = await import(helpers)
  const root = 'https://gnskwavxxipvwpznzzdh.supabase.co'
  for (const value of [root, root + '/']) assert.equal(validateSupabaseUrl(value), value)
  for (const value of [undefined, 'http://gnskwavxxipvwpznzzdh.supabase.co',
    'https://user:secret@gnskwavxxipvwpznzzdh.supabase.co', root + '/rest/v1',
    root + '?x=1', root + '#x', root + ':444', root + ':443',
    'https://other.supabase.co', root + '/..', ' ' + root]) {
    assert.throws(() => validateSupabaseUrl(value), /reviewed HTTPS root/)
  }
})

function fixture(failures = []) {
  const calls = []
  const original = {id: 'original', status: 'confirmed'}
  const admin = {from(table) {
    const query = {table, filters: []}
    const chain = {
      select(columns) {query.operation = 'select'; query.columns = columns; return chain},
      delete() {query.operation = 'delete'; return chain},
      eq(key, value) {query.filters.push([key, value]); return chain},
      in(key, value) {query.filters.push([key, value]); return chain},
      order() {return chain},
      then(resolve, reject) {
        calls.push(query)
        const key = table + ':' + query.operation
        if (failures.includes(key)) return Promise.resolve({error: new Error(key)}).then(resolve, reject)
        const data = table === 'mcp_booking_proposals' && query.operation === 'select'
          ? [{appointment_id: 'recovered'}]
          : table === 'appointments' && query.columns === 'business-fields' ? [original] : []
        return Promise.resolve({data, error: null}).then(resolve, reject)
      },
    }
    return chain
  }}
  const context = {admin, account: {clientId: 'client', shopId: 'shop', barberId: 'barber'},
    proposalIds: ['proposal'], appointmentIds: ['known'], originalIds: ['original'],
    subscriptionId: 'generated-sub', scheduleId: 'generated-schedule', marker: 'marker',
    columns: 'business-fields', baseline: {data: [original]}, fingerprint: JSON.stringify,
    sdkClients: [1, 2].map(id => ({async close() {
      calls.push({close: id}); if (id === 1 && failures.includes('close')) throw new Error('close')
    }})), oauthIds: ['oauth1', 'oauth2'],
    sessions: [1, 2].map(id => ({auth: {async signOut() {
      calls.push({signOut: id}); return {error: failures.includes('signOut') ? new Error('signOut') : null}
    }}})),
  }
  return {calls, context}
}

test('cleanup attempts all independent steps and aggregates recovery, delete, close and sign-out failures', async () => {
  const {cleanupLifecycle} = await import(helpers)
  const {context, calls} = fixture(['mcp_booking_proposals:select', 'shop_subscriptions:delete', 'close', 'signOut'])
  await assert.rejects(() => cleanupLifecycle(context), error => {
    assert.ok(error instanceof AggregateError)
    assert.equal(error.errors.length, 5)
    return true
  })
  const deletion = table => calls.find(c => c.table === table && c.operation === 'delete')
  assert.ok(deletion('mcp_booking_proposals'))
  assert.deepEqual(deletion('appointments').filters, [['id', ['known']], ['client_id', 'client'], ['shop_id', 'shop']])
  assert.deepEqual(deletion('shop_subscriptions').filters, [['id', 'generated-sub'], ['shop_id', 'shop']])
  assert.deepEqual(deletion('schedules').filters, [['id', 'generated-schedule'], ['barber_id', 'barber']])
  assert.deepEqual(calls.filter(c => c.close).map(c => c.close), [1, 2])
  assert.equal(calls.filter(c => c.table === 'mcp_oauth_clients').length, 2)
  assert.equal(calls.filter(c => c.signOut).length, 2)
  for (const table of ['appointments', 'shop_subscriptions', 'schedules']) {
    assert.ok(calls.some(c => c.table === table && c.operation === 'select'))
  }
})

test('recovered appointments are deleted even when proposal deletion fails; originals are never deleted', async () => {
  const {cleanupLifecycle} = await import(helpers)
  const {context, calls} = fixture(['mcp_booking_proposals:delete'])
  context.appointmentIds.push('original')
  await assert.rejects(() => cleanupLifecycle(context), AggregateError)
  const deletion = calls.find(c => c.table === 'appointments' && c.operation === 'delete')
  assert.deepEqual(deletion.filters[0], ['id', ['known', 'recovered']])
  assert.ok(calls.some(c => c.signOut === 2))
})

test('baseline and leftover verification failures are accumulated independently', async () => {
  const {cleanupLifecycle} = await import(helpers)
  const {context, calls} = fixture(['appointments:select', 'shop_subscriptions:select', 'schedules:select'])
  await assert.rejects(() => cleanupLifecycle(context), error => {
    assert.ok(error instanceof AggregateError)
    assert.equal(error.errors.length, 4)
    assert.deepEqual(error.errors.map(item => item.message), [
      'verify original appointment baseline', 'verify no generated subscription remains',
      'verify no generated schedule remains', 'verify no generated appointments remain',
    ])
    return true
  })
  assert.ok(calls.some(c => c.table === 'appointments' && c.columns === 'business-fields'))
})

test('successful cleanup verifies baseline and generated fixtures without success flags', async () => {
  const {cleanupLifecycle} = await import(helpers)
  const {context, calls} = fixture()
  await cleanupLifecycle(context)
  assert.deepEqual(context.appointmentIds, ['known', 'recovered'])
  assert.ok(calls.some(c => c.table === 'appointments' && c.columns === 'business-fields'))
})
