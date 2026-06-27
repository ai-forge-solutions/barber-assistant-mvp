import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// DELETE /api/blocked-slots/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Fetch the blocked slot to verify ownership before deleting
  const { data: slot } = await supabaseAdmin
    .from('blocked_slots')
    .select('id, barber_id')
    .eq('id', id)
    .maybeSingle()

  if (!slot) {
    return Response.json({ error: 'Blocked slot not found' }, { status: 404 })
  }

  // Verify requester is the barber or the shop owner
  const { data: barber } = await supabaseAdmin
    .from('barbers')
    .select('user_id, shop_id')
    .eq('id', slot.barber_id)
    .maybeSingle()

  if (!barber) {
    return Response.json({ error: 'Barber not found' }, { status: 404 })
  }

  const isSelf = barber.user_id === user.id

  const { data: shopRow } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('id', barber.shop_id)
    .eq('owner_id', user.id)
    .maybeSingle()
  const isOwner = !!shopRow

  if (!isSelf && !isOwner) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('blocked_slots')
    .delete()
    .eq('id', id)

  if (error) {
    return Response.json({ error: 'Failed to delete blocked slot' }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
