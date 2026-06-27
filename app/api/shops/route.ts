import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET /api/shops?slug=xxx  — public, no auth required
export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get('slug')
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('shops')
    .select('id, name, address, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(data)
}

// POST /api/shops
// Body: { name, slug, address? }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, slug, address, timezone } = body

  if (!name || !slug) {
    return Response.json({ error: 'name and slug are required' }, { status: 400 })
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return Response.json(
      { error: 'slug must contain only lowercase letters, numbers, and hyphens' },
      { status: 400 }
    )
  }

  // Verify slug uniqueness
  const { data: existing } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return Response.json({ error: 'slug is already taken' }, { status: 409 })
  }

  const insertData: Record<string, unknown> = { name, slug, address: address ?? null, owner_id: user.id }
  if (timezone) insertData.timezone = timezone

  const { data: shop, error } = await supabaseAdmin
    .from('shops')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/shops] insert error:', error)
    return Response.json({ error: error.message ?? 'Failed to create shop' }, { status: 500 })
  }

  return Response.json(shop, { status: 201 })
}
