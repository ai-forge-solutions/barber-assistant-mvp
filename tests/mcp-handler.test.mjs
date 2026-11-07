import test from 'node:test'
import assert from 'node:assert/strict'

const createHandler = async (auth = async () => null) => {
  const { mcpHandler } = await import('../lib/mcp/handler.ts')
  return (request) => mcpHandler(request, auth, {})
}
test('authenticated Streamable HTTP initializes and lists tools across separate stateless requests', async () => {
  const handle = await createHandler(async () => ({ userId: 'u1', scope: 'bookings:read' }))
  const send = (message) => handle(new Request('https://pilot.example/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18' }, body: JSON.stringify(message) }))
  const init = await send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } })
  assert.equal(init.status, 200)
  assert.equal((await init.json()).result.serverInfo.name, 'trujas')
  const tools = await send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
  assert.equal(tools.status, 200)
  assert.ok((await tools.json()).result.tools.some(t => t.name === 'get_my_barbershops'))
})

test('hostile browser Origin is rejected before authentication', async () => {
  let called = false
  const handle = await createHandler(async () => { called = true; return null })
  const response = await handle(new Request('https://pilot.example/mcp', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: '{}' }))
  assert.equal(response.status, 403)
  assert.equal(called, false)
})

test('allowed browser origin receives an unauthenticated CORS preflight', async () => {
  const handle = await createHandler()
  const response = await handle(new Request('https://pilot.example/mcp', { method: 'OPTIONS', headers: { Origin: 'https://claude.ai' } }))
  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://claude.ai')
  assert.match(response.headers.get('access-control-allow-headers'), /Authorization/)
})

test('pinned origin keeps the challenge public and rejects forged forwarding headers', async () => {
  const previous=process.env.TRUJAS_DEPLOY_ORIGIN
  process.env.TRUJAS_DEPLOY_ORIGIN='https://public.example'
  try {
    const handle=await createHandler()
    const response=await handle(new Request('https://internal.example/mcp',{method:'POST',headers:{'x-forwarded-host':'evil.example'},body:'{}'}))
    assert.equal(response.status,401)
    assert.match(response.headers.get('www-authenticate'),/https:\/\/public\.example\/\.well-known/)
    assert.doesNotMatch(response.headers.get('www-authenticate'),/internal|evil/)
  } finally {if(previous===undefined)delete process.env.TRUJAS_DEPLOY_ORIGIN;else process.env.TRUJAS_DEPLOY_ORIGIN=previous}
})

test('unauthenticated MCP returns an OAuth discovery challenge, never a login HTML redirect', async () => {
  const handle = await createHandler()
  const response = await handle(new Request('https://pilot.example/mcp', { method: 'POST', body: '{}' }))
  assert.equal(response.status, 401)
  assert.match(response.headers.get('www-authenticate'), /resource_metadata="https:\/\/pilot.example\/\.well-known\/oauth-protected-resource"/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})
