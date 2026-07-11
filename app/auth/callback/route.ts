import { AUTH_NEXT_COOKIE, readAuthNextCookie, safeAuthNext } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = safeAuthNext(
    request.nextUrl.searchParams.get('next') ?? readAuthNextCookie(request.cookies.get(AUTH_NEXT_COOKIE)?.value),
    '/dashboard'
  )
  const appOrigin = request.nextUrl.origin.replace(/\/$/, '')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const response = NextResponse.redirect(`${appOrigin}${next}`)
  response.cookies.set(AUTH_NEXT_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
