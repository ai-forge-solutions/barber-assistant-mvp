import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST /api/blocked-slots
// Body: { barberId, date, startTime, endTime }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { barberId, date, startTime, endTime } = body

  if (!barberId || !date || !startTime || !endTime) {
    return Response.json(
      { error: 'barberId, date, startTime, and endTime are required' },
      { status: 400 }
    )
  }

  // Verify requester is the barber or the shop owner
  const { data: barber } = await supabaseAdmin
    .from('barbers')
    .select('id, user_id, shop_id')
    .eq('id', barberId)
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

  const { data, error } = await supabaseAdmin
    .from('blocked_slots')
    .insert({
      barber_id: barberId,
      date,
      start_time: startTime,
      end_time: endTime,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: 'Failed to create blocked slot' }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
