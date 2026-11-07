// Real HTTP + Supabase smoke. Uses controlled accounts; never creates appointments.
// MCP_SMOKE_ENV=/path/.env.local MCP_SMOKE_ACCOUNTS=/path/.test-accounts.json node scripts/mcp-live-smoke.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomBytes, createHash } from 'node:crypto'
import { setDefaultResultOrder } from 'node:dns'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
setDefaultResultOrder('ipv4first')
assert.ok(process.env.MCP_SMOKE_ENV && process.env.MCP_SMOKE_ACCOUNTS, 'Set explicit env/account file paths')
Object.assign(process.env, (await import('node:util')).parseEnv(await readFile(process.env.MCP_SMOKE_ENV, 'utf8')))
const origin = process.env.MCP_SMOKE_ORIGIN || 'http://localhost:3124'
const target = new URL(origin)
assert.equal(target.origin, origin, 'Use an origin without a path or embedded credentials')
assert.ok(['localhost', '127.0.0.1', 'feat-mcp-booking-pilot--barber-assitant.netlify.app', 'deploy-preview-33--barber-assitant.netlify.app'].includes(target.hostname), 'Only loopback or the explicit pilot preview is allowed')
if (!['localhost', '127.0.0.1'].includes(target.hostname)) assert.equal(target.protocol, 'https:')
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'gnskwavxxipvwpznzzdh.supabase.co')
const accounts = JSON.parse(await readFile(process.env.MCP_SMOKE_ACCOUNTS, 'utf8'))
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const clients = [], sessions = [], protocolClients = []
const initial = await admin.from('appointments').select('id', { count: 'exact', head: true })
assert.ifError(initial.error)
const jsonPost = (path, data) => fetch(origin + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
const formPost = (path, data) => fetch(origin + path, { method: 'POST', body: new URLSearchParams(data) })
const random = () => randomBytes(32).toString('base64url')
const smokeName = `Hermes controlled HTTP smoke ${randomBytes(6).toString('hex')}`
async function authorize(account, scope) {
  const cookies = new Map()
  const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...cookies].map(([name, value]) => ({ name, value })), setAll: items => items.forEach(c => cookies.set(c.name, c.value)) },
  })
  const signed = await auth.auth.signInWithPassword({ email: account.clientEmail, password: account.password })
  assert.ifError(signed.error)
  sessions.push(auth)
  assert.equal(signed.data.user.id, account.clientId)
  const redirect_uri = 'http://127.0.0.1:54325/callback'
  const registration = await jsonPost('/oauth/register', { client_name: smokeName, redirect_uris: [redirect_uri] })
  assert.equal(registration.status, 201, 'Dynamic registration')
  const registrationData = await registration.json()
  const client_id = registrationData.client_id
  clients.push(client_id)
  const code_verifier = random(), state = random()
  const params = new URLSearchParams({ response_type: 'code', client_id, redirect_uri, resource: origin + '/mcp', scope, state, code_challenge: createHash('sha256').update(code_verifier).digest('base64url'), code_challenge_method: 'S256' })
  const path = '/oauth/authorize?' + params
  const cookieHeader = () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; ')
  const consent = await fetch(origin + path, { headers: { Cookie: cookieHeader() }, redirect: 'manual' })
  assert.equal(consent.status, 200, 'Authenticated consent page')
  const html = await consent.text()
  const nonce = html.match(/name="nonce" value="([^"]+)"/)?.[1]
  assert.ok(nonce, 'Consent nonce')
  for (const value of consent.headers.getSetCookie()) {
    const item = value.split(';')[0], split = item.indexOf('=')
    cookies.set(item.slice(0, split), item.slice(split + 1))
  }
  const approved = await fetch(origin + path, { method: 'POST', headers: { Origin: origin, Cookie: cookieHeader() }, body: new URLSearchParams({ nonce, decision: 'approve' }), redirect: 'manual' })
  assert.equal(approved.status, 303, 'Consent approval')
  const callback = new URL(approved.headers.get('location'))
  assert.equal(callback.searchParams.get('state'), state)
  const grant = { grant_type: 'authorization_code', client_id, redirect_uri, resource: origin + '/mcp', code_verifier, code: callback.searchParams.get('code') }
  const exchange = await formPost('/oauth/token', grant)
  assert.equal(exchange.status, 200, 'PKCE exchange')
  const tokens = await exchange.json()
  assert.equal((await formPost('/oauth/token', grant)).status, 400, 'Authorization code replay denied')
  return { tokens, client_id }
}
async function connect(access) {
  const client = new Client({ name: 'hermes-real-http-smoke', version: '1.0.0' })
  await client.connect(new StreamableHTTPClientTransport(new URL(origin + '/mcp'), { requestInit: { headers: { Authorization: `Bearer ${access}` } } }))
  protocolClients.push(client)
  return client
}
async function bearerStatus(token) {
  return (await fetch(origin + '/mcp', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'tools/list', params: {} }) })).status
}
try {
  assert.equal((await fetch(origin + '/mcp', { method: 'POST' })).status, 401)
  const first = await authorize(accounts['1'], 'bookings:read bookings:write')
  const second = await authorize(accounts['2'], 'bookings:read')
  console.log('PASS: two real test-account logins, consent, PKCE and code replay protection')
  for (const [i, auth] of [first, second].entries()) {
    const account = accounts[String(i + 1)], client = await connect(auth.tokens.access_token)
    const tools = await client.listTools()
    assert.equal(tools.tools.some(t => t.name === 'confirm_booking'), i === 0)
    assert.equal(tools.tools.some(t => t.name === 'set_preferred_barbershop'), false)
    const actual = await client.callTool({ name: 'list_my_appointments', arguments: {} })
    assert.ok(!actual.isError)
    const data = JSON.parse(actual.content.find(b => b.type === 'text').text)
    const expected = await admin.from('appointments').select('id').eq('client_id', account.clientId)
    assert.ifError(expected.error)
    assert.deepEqual(data.appointments.map(a => a.id).sort(), expected.data.map(a => a.id).sort())
    const injected = await client.callTool({ name: 'list_my_appointments', arguments: { userId: accounts[String(i === 0 ? 2 : 1)].clientId } })
    assert.equal(injected.isError, true)
    console.log(`PASS: account ${i + 1}, exact own appointments, identity injection denied, scoped tools`)
  }
  const rotated = await formPost('/oauth/token', { grant_type: 'refresh_token', client_id: first.client_id, resource: origin + '/mcp', refresh_token: first.tokens.refresh_token })
  assert.equal(rotated.status, 200)
  const next = await rotated.json()
  assert.equal(await bearerStatus(first.tokens.access_token), 401)
  assert.equal((await formPost('/oauth/token', { grant_type: 'refresh_token', client_id: first.client_id, resource: origin + '/mcp', refresh_token: first.tokens.refresh_token })).status, 400)
  const revoked = await formPost('/oauth/revoke', { client_id: first.client_id, token: next.access_token })
  assert.equal(revoked.status, 200)
  assert.equal(await bearerStatus(next.access_token), 401)
  console.log('PASS: refresh rotation, old access/refresh rejected, revocation enforced')
} finally {
  for (const client of protocolClients) await client.close().catch(() => {})
  for (const id of clients) {
    const deleted = await admin.from('mcp_oauth_clients').delete().eq('client_id', id).eq('client_name', smokeName)
    assert.ifError(deleted.error)
  }
  for (const auth of sessions) await auth.auth.signOut({ scope: 'local' })
  const final = await admin.from('appointments').select('id', { count: 'exact', head: true })
  assert.ifError(final.error)
  assert.equal(final.count, initial.count)
  const leftover = clients.length ? await admin.from('mcp_oauth_clients').select('client_id').in('client_id', clients) : { data: [], error: null }
  assert.ifError(leftover.error)
  assert.equal(leftover.data.length, 0)
  console.log(`CLEANUP: temporary OAuth clients/grants removed; appointment count unchanged (${final.count})`)
}
