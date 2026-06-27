import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ─── Shared helper: verify requester is the shop owner ───────────────────────
async function requireOwner(shopId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .maybeSingle()
  return !!data
}

// PATCH /api/shops/[id]
// Body: { name?, address?, logo_url? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  if (!(await requireOwner(id, user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, address, logo_url } = body

  const updates: Record<string, string> = {}
  if (name !== undefined) updates.name = name
  if (address !== undefined) updates.address = address
  if (logo_url !== undefined) updates.logo_url = logo_url

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('shops')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: 'Failed to update shop' }, { status: 500 })
  }

  return Response.json(data)
}
