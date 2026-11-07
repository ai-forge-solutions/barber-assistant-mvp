import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export class OAuthError extends Error {
  error: string
  status: number
  constructor(error: string, status = 400) { super(error); this.error = error; this.status = status }
}
export function normalizeScope(value: string | null) {
  const scopes = value === null ? [...SCOPES] : [...new Set(value.split(' ').filter(Boolean))]
  if (!scopes.length || scopes.some(s => !(SCOPES as readonly string[]).includes(s))) throw new OAuthError('invalid_scope')
  return scopes.join(' ')
}
export function validateAuthorization(p: URLSearchParams, client: {client_id: string; redirect_uris: string[]}, resource: string) {
  for (const key of new Set(p.keys())) if (p.getAll(key).length !== 1) throw new OAuthError('invalid_request')
  if (p.toString().length > 8192 || p.get('client_id') !== client.client_id || !client.redirect_uris.includes(p.get('redirect_uri') || '')) throw new OAuthError('invalid_request')
  if (p.get('response_type') !== 'code' || p.get('code_challenge_method') !== 'S256' || !/^[A-Za-z0-9_-]{43}$/.test(p.get('code_challenge') || '')) throw new OAuthError('invalid_request')
  if (p.get('resource') !== resource) throw new OAuthError('invalid_target')
  if ((p.get('state') || '').length > 1024) throw new OAuthError('invalid_request')
  return {client_id:client.client_id,redirect_uri:p.get('redirect_uri')!,challenge:p.get('code_challenge')!,resource,scope:normalizeScope(p.get('scope'))}
}
export function pkceChallenge(verifier: string) {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) throw new OAuthError('invalid_grant')
  return createHash('sha256').update(verifier).digest('base64url')
}
export const consentBinding = (nonce: string, p: URLSearchParams, userId: string) => hashToken(JSON.stringify([nonce,p.toString(),userId]))
export function checkConsent(origin: string | null, expectedOrigin: string, cookie: string | undefined, nonce: string, p: URLSearchParams, userId: string) {
  if (origin !== expectedOrigin || !cookie || !/^[A-Za-z0-9_-]{43}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(cookie)) return false
  return timingSafeEqual(Buffer.from(cookie),Buffer.from(consentBinding(nonce,p,userId)))
}
export function bearerToken(header: string | null) {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(header || '')
  return match ? match[1] : null
}
export type Grant = {id: string; user_id: string; resource: string; scope: string; access_expires_at: string; revoked_at: string | null}
export function validateGrant(g: Grant | null, resource: string, now = Date.now()) {
  if (!g || g.revoked_at || g.resource !== resource || !(Date.parse(g.access_expires_at) > now)) return null
  return {userId:g.user_id,grantId:g.id,scope:g.scope}
}
// Per-instance guard plus a durable global registration cap in SQL. No outbound client URL fetches.
export function createRegistrationLimiter(limit = 20, windowMs = 3600000, capacity = 1000) {
  const entries = new Map<string,{count:number;expires:number}>()
  return (key: string, now = Date.now()) => {
    for (const [k,v] of entries) if (v.expires <= now) entries.delete(k)
    const item = entries.get(key)
    if (item) { if (item.count >= limit) return false; item.count++; return true }
    if (entries.size >= capacity) return false
    entries.set(key,{count:1,expires:now+windowMs}); return true
  }
}
export const SCOPES = ['bookings:read', 'bookings:write', 'preferences:write'] as const
export const opaqueToken = () => randomBytes(32).toString('base64url')
export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex')
// Pin Netlify's public preview origin at build time; the adapter may expose an
// internal deploy permalink in request.url. Never derive identity from spoofable headers.
export const requestOrigin = (request: Request) => new URL(process.env.TRUJAS_DEPLOY_ORIGIN || request.url).origin
export const publicRequestUrl = (request: Request) => {
  const url = new URL(request.url)
  return new URL(url.pathname + url.search, requestOrigin(request))
}
export const resourceFor = (request: Request) => `${requestOrigin(request)}/mcp`
export function validRedirect(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    const u = new URL(value)
    return !u.username && !u.password && !u.hash && !value.includes('#') &&
      (u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)))
  } catch { return false }
}
export function validateRegistration(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new OAuthError('invalid_client_metadata')
  const v = value as Record<string, unknown>
  if (typeof v.client_name !== 'string' || !v.client_name.trim() || v.client_name.length > 120 || /[\x00-\x1f\x7f]/.test(v.client_name)) throw new OAuthError('invalid_client_metadata')
  if (!Array.isArray(v.redirect_uris) || !v.redirect_uris.length || v.redirect_uris.length > 10 || !v.redirect_uris.every(validRedirect)) throw new OAuthError('invalid_redirect_uri')
  if (v.token_endpoint_auth_method !== undefined && v.token_endpoint_auth_method !== 'none') throw new OAuthError('invalid_client_metadata')
  for (const [key, allowed] of [['grant_types', ['authorization_code', 'refresh_token']], ['response_types', ['code']]] as const) {
    const entry = v[key]
    if (entry !== undefined && (!Array.isArray(entry) || !entry.length || !entry.every(x => (allowed as readonly unknown[]).includes(x)))) throw new OAuthError('invalid_client_metadata')
  }
  return { client_name: v.client_name.trim(), redirect_uris: [...new Set(v.redirect_uris as string[])] }
}
