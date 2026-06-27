import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const appOrigin = (process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000').replace(/\/$/, '')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${appOrigin}${next.startsWith('/') ? next : `/${next}`}`)
}
