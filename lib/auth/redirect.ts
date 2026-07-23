export const AUTH_NEXT_COOKIE = 'trujas_auth_next'

export function safeAuthNext(value: string | null | undefined, fallback = '/dashboard') {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

function canonicalAppOrigin(origin: string) {
  const normalized = origin.replace(/\/$/, '')

  try {
    const url = new URL(normalized)

    if (url.hostname === 'barber-assitant.netlify.app') {
      return 'https://trujas.app'
    }
  } catch {
    return normalized
  }

  return normalized
}

export function appOrigin(fallbackOrigin: string) {
  const fallback = canonicalAppOrigin(fallbackOrigin)
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configured?.startsWith('http://') || configured?.startsWith('https://')) {
    return canonicalAppOrigin(configured)
  }

  return fallback
}

export function authCallbackUrl(origin: string) {
  return `${appOrigin(origin)}/auth/callback`
}

export function readAuthNextCookie(value: string | undefined, fallback = '/dashboard') {
  if (!value) return fallback

  try {
    return safeAuthNext(decodeURIComponent(value), fallback)
  } catch {
    return fallback
  }
}

export function rememberAuthNext(next: string, fallback = '/dashboard') {
  if (typeof document === 'undefined') return

  const safeNext = encodeURIComponent(safeAuthNext(next, fallback))
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${AUTH_NEXT_COOKIE}=${safeNext}; Path=/; Max-Age=600; SameSite=Lax${secure}`
}
