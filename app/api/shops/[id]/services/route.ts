import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function requireOwner(shopId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .maybeSingle()
  return !!data
}

// POST /api/shops/[id]/services
// Body: { name, duration_min, price }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: shopId } = await params

  if (!(await requireOwner(shopId, user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, duration_min, price } = body

  if (!name || !duration_min || price === undefined) {
    return Response.json(
      { error: 'name, duration_min, and price are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({ shop_id: shopId, name, duration_min, price })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/shops/[id]/services] insert error:', error)
    return Response.json({ error: error.message ?? 'Failed to create service' }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}

// PATCH /api/shops/[id]/services
// Body: { serviceId, name?, duration_min?, price? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: shopId } = await params

  if (!(await requireOwner(shopId, user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { serviceId, name, duration_min, price } = body

  if (!serviceId) {
    return Response.json({ error: 'serviceId is required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (duration_min !== undefined) updates.duration_min = duration_min
  if (price !== undefined) updates.price = price

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('services')
    .update(updates)
    .eq('id', serviceId)
    .eq('shop_id', shopId)
    .select()
    .single()

  if (error) {
    return Response.json({ error: 'Failed to update service' }, { status: 500 })
  }

  return Response.json(data)
}

// GET /api/shops/[id]/services — public
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: shopId } = await params
  const { data, error } = await supabaseAdmin
    .from('services')
    .select('id, name, duration_min, price')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('name')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

// DELETE /api/shops/[id]/services
// Body: { serviceId }
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: shopId } = await params

  if (!(await requireOwner(shopId, user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { serviceId } = body

  if (!serviceId) {
    return Response.json({ error: 'serviceId is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('services')
    .delete()
    .eq('id', serviceId)
    .eq('shop_id', shopId)

  if (error) {
    return Response.json({ error: 'Failed to delete service' }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
