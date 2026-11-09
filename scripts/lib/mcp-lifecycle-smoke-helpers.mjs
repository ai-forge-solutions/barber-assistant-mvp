import assert from 'node:assert/strict'

export function validateSupabaseUrl(value) {
  const root = 'https://gnskwavxxipvwpznzzdh.supabase.co'
  assert.ok(value === root || value === root + '/', 'Only the reviewed HTTPS root is allowed')
  return value
}

// Each step is isolated: a lost insert/confirmation response must not skip known-ID cleanup.
export async function cleanupLifecycle({admin, account, proposalIds, appointmentIds,
  originalIds, subscriptionId, scheduleId, sdkClients, oauthIds, marker, sessions,
  columns, baseline, fingerprint}) {
  const errors = []
  const attempt = async (label, action) => {
    try { await action() } catch (cause) { errors.push(new Error(label, {cause})) }
  }
  if (proposalIds.length) {
    await attempt('recover appointments from proposals', async () => {
      const result = await admin.from('mcp_booking_proposals').select('appointment_id').in('id', proposalIds).eq('user_id', account.clientId)
      assert.ifError(result.error)
      for (const row of result.data) {
        if (row.appointment_id && !appointmentIds.includes(row.appointment_id)) appointmentIds.push(row.appointment_id)
      }
    })
    await attempt('delete generated proposals', async () => {
      const result = await admin.from('mcp_booking_proposals').delete().in('id', proposalIds).eq('user_id', account.clientId)
      assert.ifError(result.error)
    })
  }
  await attempt('protect original appointments', async () => {
    assert.ok(appointmentIds.every(id => !originalIds.includes(id)), 'Refuse to delete original appointments')
  })
  const disposableIds = [...new Set(appointmentIds.filter(id => !originalIds.includes(id)))]
  if (disposableIds.length) await attempt('delete generated appointments', async () => {
    const result = await admin.from('appointments').delete().in('id', disposableIds).eq('client_id', account.clientId).eq('shop_id', account.shopId)
    assert.ifError(result.error)
  })
  await attempt('delete generated subscription', async () => {
    const result = await admin.from('shop_subscriptions').delete().eq('id', subscriptionId).eq('shop_id', account.shopId)
    assert.ifError(result.error)
  })
  await attempt('delete generated schedule', async () => {
    const result = await admin.from('schedules').delete().eq('id', scheduleId).eq('barber_id', account.barberId)
    assert.ifError(result.error)
  })
  for (const sdk of sdkClients) await attempt('close SDK client', () => sdk.close())
  for (const id of oauthIds) await attempt('delete OAuth client ' + id, async () => {
    const result = await admin.from('mcp_oauth_clients').delete().eq('client_id', id).eq('client_name', marker)
    assert.ifError(result.error)
  })
  for (const auth of sessions) await attempt('sign out session', async () => {
    const result = await auth.auth.signOut({scope: 'local'})
    assert.ifError(result.error)
  })
  await attempt('verify original appointment baseline', async () => {
    const after = await admin.from('appointments').select(columns).in('id', originalIds).order('id')
    assert.ifError(after.error)
    assert.equal(fingerprint(after.data), fingerprint(baseline.data), 'Original appointments remain byte-for-byte unchanged across selected business fields')
  })
  await attempt('verify no generated subscription remains', async () => {
    const result = await admin.from('shop_subscriptions').select('id').eq('id', subscriptionId)
    assert.ifError(result.error)
    assert.equal(result.data.length, 0)
  })
  await attempt('verify no generated schedule remains', async () => {
    const result = await admin.from('schedules').select('id').eq('id', scheduleId)
    assert.ifError(result.error)
    assert.equal(result.data.length, 0)
  })
  if (disposableIds.length) await attempt('verify no generated appointments remain', async () => {
    const result = await admin.from('appointments').select('id').in('id', disposableIds)
    assert.ifError(result.error)
    assert.equal(result.data.length, 0)
  })
  if (errors.length) throw new AggregateError(errors, 'Lifecycle cleanup failed: ' + errors.map(error => error.message).join('; '))
}
