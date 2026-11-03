import type { CookieOptionsWithName } from '@supabase/ssr'

export const SUPABASE_SESSION_MAX_AGE_SECONDS = 400 * 24 * 60 * 60

export const supabaseSessionCookieOptions = {
  path: '/',
  sameSite: 'lax',
  maxAge: SUPABASE_SESSION_MAX_AGE_SECONDS,
  secure: process.env.NODE_ENV === 'production',
} satisfies CookieOptionsWithName
