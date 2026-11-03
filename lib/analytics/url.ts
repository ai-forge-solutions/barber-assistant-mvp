// Pure URL helpers for analytics. No browser or Next imports so node:test can
// load this file directly (see tests/analytics-url.test.mjs).

// Only these query params may reach GA. Everything else (Supabase `code`,
// Stripe `session_id`, `next`, emails, phones...) is dropped.
const ALLOWED_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'checkout',
  'portal',
  'plan',
  'cadence',
])

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const JWT = /^[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}$/
const LONG_HEX = /^[0-9a-f]{24,}$/i

function sanitizeSegment(segment: string) {
  if (UUID.test(segment)) return '[id]'
  if (JWT.test(segment) || LONG_HEX.test(segment)) return '[token]'
  return segment
}

/** Path with internal IDs and tokens replaced by placeholders. */
export function sanitizePath(pathname: string) {
  return pathname.split('/').map(sanitizeSegment).join('/')
}

/** Same-origin URL safe to send as page_location: allowlisted params, no hash. */
export function sanitizeUrl(input: string | URL) {
  const url = new URL(input.toString())
  const params = new URLSearchParams()
  for (const [key, value] of url.searchParams) {
    if (ALLOWED_PARAMS.has(key)) params.append(key, value)
  }
  const search = params.toString()
  return `${url.origin}${sanitizePath(url.pathname)}${search ? `?${search}` : ''}`
}

/** Referrer for GA: sanitized when internal, origin only when external. */
export function sanitizeReferrer(referrer: string, currentOrigin: string) {
  if (!referrer) return undefined
  try {
    const url = new URL(referrer)
    return url.origin === currentOrigin ? sanitizeUrl(url) : `${url.origin}/`
  } catch {
    return undefined
  }
}

const RESERVED_TOP_LEVEL = new Set([
  'api', 'auth', 'billing', 'cancel', 'cuenta', 'dashboard', 'legal', 'onboarding',
  'pricing', 'privacidad', 'recursos', 'terminos',
])

/** GA4 content_group for each app surface. */
export function contentGroup(pathname: string) {
  const [first = '', second] = pathname.split('/').filter(Boolean)
  if (!first) return 'landing'
  if (first === 'pricing') return 'pricing'
  if (first === 'recursos') return 'resources'
  if (first === 'auth') return 'auth'
  if (first === 'onboarding') return 'onboarding'
  if (first === 'billing') return 'billing'
  if (first === 'dashboard') return 'dashboard'
  if (first === 'cuenta') return 'client_account'
  if (first === 'cancel') return 'booking_cancel'
  if (first === 'privacidad' || first === 'terminos' || first === 'legal') return 'legal'
  if (RESERVED_TOP_LEVEL.has(first)) return 'other'
  return second === 'reservar' ? 'booking' : 'shop'
}
