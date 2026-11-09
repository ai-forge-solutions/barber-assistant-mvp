// Browser-native consent regression: no appointments; temporary OAuth client is removed.
// Optional MCP_SMOKE_PLAYWRIGHT points at an externally installed playwright module.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import { randomBytes, createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
const { chromium } = await import(process.env.MCP_SMOKE_PLAYWRIGHT || 'playwright')
assert.ok(process.env.MCP_SMOKE_ENV && process.env.MCP_SMOKE_ACCOUNTS)
Object.assign(process.env, parseEnv(await readFile(process.env.MCP_SMOKE_ENV, 'utf8')))
const origin = process.env.MCP_SMOKE_ORIGIN || 'http://localhost:3124'
assert.equal(new URL(origin).origin, origin)
assert.ok(['http://localhost:3124', 'http://localhost:3125', 'https://deploy-preview-33--barber-assitant.netlify.app'].includes(origin))
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'gnskwavxxipvwpznzzdh.supabase.co')
const account = JSON.parse(await readFile(process.env.MCP_SMOKE_ACCOUNTS, 'utf8'))['1']
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const cookies = new Map()
const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => [...cookies].map(([name, value]) => ({ name, value })), setAll: rows => rows.forEach(row => cookies.set(row.name, row.value)) } })
const clientName = 'Hermes browser consent smoke ' + randomBytes(8).toString('hex')
const callbackServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Controlled callback')
})
await new Promise((resolve, reject) => { callbackServer.once('error', reject); callbackServer.listen(0, '127.0.0.1', resolve) })
const redirect = `http://127.0.0.1:${callbackServer.address().port}/callback`
let browser, clientId
try {
  const login = await auth.auth.signInWithPassword({ email: account.clientEmail, password: account.password })
  assert.ifError(login.error)
  const registration = await fetch(origin + '/oauth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_name: clientName, redirect_uris: [redirect] }) })
  assert.equal(registration.status, 201)
  clientId = (await registration.json()).client_id
  const verifier = randomBytes(32).toString('base64url'), state = randomBytes(32).toString('base64url')
  const p = new URLSearchParams({ client_id: clientId, redirect_uri: redirect, response_type: 'code', code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url'), resource: origin + '/mcp', scope: 'bookings:read', state })
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const context = await browser.newContext()
  await context.addCookies([...cookies].map(([name, value]) => ({ name, value, url: origin, sameSite: 'Lax' })))
  const page = await context.newPage()
  await page.addInitScript(() => {
    window.__cspViolations = []
    document.addEventListener('securitypolicyviolation', event => window.__cspViolations.push({ directive: event.effectiveDirective, blockedOrigin: (() => { try { return new URL(event.blockedURI).origin } catch { return 'non-url' } })() }))
  })

  const consent = await page.goto(origin + '/oauth/authorize?' + p)
  assert.equal(consent.status(), 200, 'Consent page')
  console.log('Consent Referrer-Policy:', consent.headers()['referrer-policy'])
  const post = page.waitForRequest(r => new URL(r.url()).pathname === '/oauth/authorize' && r.method() === 'POST')
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/oauth/authorize' && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Autorizar conexión' }).click()
  const request = await post
  console.log('Native browser POST Origin:', (await request.allHeaders()).origin)
  let result
  try { result = await response } catch (error) {
    console.log('Browser CSP diagnostics:', await page.evaluate(() => window.__cspViolations))
    throw error
  }
  console.log('Consent POST status:', result.status())
  if (result.status() !== 303) console.log('Consent rejection:', await result.text())
  assert.equal(result.status(), 303, 'Browser-native consent must succeed without forcing an Origin header')
  const callback = new URL(result.headers().location)
  assert.equal(callback.origin + callback.pathname, redirect)
  assert.equal(callback.searchParams.get('state'), state)
  await page.waitForURL(url => url.origin + url.pathname === redirect, { timeout: 10000 })
  console.log('PASS: browser reached the registered cross-origin callback')
  const exchange = await fetch(origin + '/oauth/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId, redirect_uri: redirect, resource: origin + '/mcp', code_verifier: verifier, code: callback.searchParams.get('code') }) })
  assert.equal(exchange.status, 200, 'Native consent authorization code must exchange via PKCE')
  console.log('PASS: native browser consent and PKCE exchange')
} finally {
  await browser?.close()
  await new Promise(resolve => callbackServer.close(resolve))
  if (clientId) {
    const deleted = await admin.from('mcp_oauth_clients').delete().eq('client_id', clientId).eq('client_name', clientName)
    assert.ifError(deleted.error)
    const remaining = await admin.from('mcp_oauth_clients').select('client_id').eq('client_id', clientId)
    assert.ifError(remaining.error)
    assert.equal(remaining.data.length, 0)
  }
  await auth.auth.signOut({ scope: 'local' })
  console.log('CLEANUP: temporary client/codes/grants removed; no appointments created')
}
