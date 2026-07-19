export const AUTH_NEXT_COOKIE = 'trujas_auth_next'

export function safeAuthNext(value: string | null | undefined, fallback = '/dashboard') {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

export function authCallbackUrl(origin: string) {
  return `${origin.replace(/\/$/, '')}/auth/callback`
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
