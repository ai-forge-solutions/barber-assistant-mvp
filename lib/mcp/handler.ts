import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createBookingServer } from './server.ts'
import type { BookingServices } from './server.ts'

type Identity = { userId: string; scope: string; grantId?: string }
const browserOrigins = new Set(['https://claude.ai', 'https://chatgpt.com', 'https://chat.openai.com'])

/** Per-request transport, no process-local sessions: safe on Netlify serverless. */
export async function mcpHandler(request: Request, authenticate: (request: Request) => Promise<Identity | null>, services: BookingServices) {
  const url = new URL(request.url)
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' }
  if (origin && origin !== url.origin && !browserOrigins.has(origin)) {
    return Response.json({ error: 'forbidden_origin' }, { status: 403, headers })
  }
  if (origin) Object.assign(headers, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id',
    'Access-Control-Expose-Headers': 'WWW-Authenticate, MCP-Protocol-Version',
  })
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  const identity = await authenticate(request)
  if (!identity) return Response.json({ error: 'unauthorized' }, { status: 401, headers: {
    ...headers,
    'WWW-Authenticate': `Bearer resource_metadata="${url.origin}/.well-known/oauth-protected-resource"`,
  } })
  // No long-lived SSE GET channel or session DELETE in stateless JSON mode.
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { ...headers, Allow: 'POST, OPTIONS' } })
  const server = createBookingServer({ userId: identity.userId, scope: identity.scope, resource: `${url.origin}/mcp`, services })
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 65536 })
  try {
    await server.connect(transport)
    const response = await transport.handleRequest(request)
    const result = new Response(response.body, { status: response.status, statusText: response.statusText, headers: response.headers })
    for (const [key, value] of Object.entries(headers)) result.headers.set(key, value)
    return result
  } catch {
    return Response.json({ error: 'service_unavailable' }, { status: 503, headers })
  } finally {
    await server.close()
  }
}
