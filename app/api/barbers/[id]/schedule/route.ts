import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface ScheduleEntry {
  day_of_week: number        // 0=Sun … 6=Sat
  start_time: string         // "HH:MM"
  end_time: string           // "HH:MM"
  break_start?: string | null
  break_end?: string | null
}

// PUT /api/barbers/[id]/schedule
// Body: { schedule: ScheduleEntry[] }  — replaces the full weekly schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: barberId } = await params

  // Fetch barber to verify it exists and get shop_id for owner check
  const { data: barber } = await supabaseAdmin
    .from('barbers')
    .select('id, user_id, shop_id')
    .eq('id', barberId)
    .maybeSingle()

  if (!barber) {
    return Response.json({ error: 'Barber not found' }, { status: 404 })
  }

  const isSelf = barber.user_id === user.id

  // Check if requester is the shop owner
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

  const body = await request.json()
  const { schedule } = body as { schedule: ScheduleEntry[] }

  if (!Array.isArray(schedule)) {
    return Response.json({ error: 'schedule must be an array' }, { status: 400 })
  }

  // Delete existing schedule rows for this barber
  const { error: deleteError } = await supabaseAdmin
    .from('schedules')
    .delete()
    .eq('barber_id', barberId)

  if (deleteError) {
    return Response.json({ error: 'Failed to replace schedule' }, { status: 500 })
  }

  if (schedule.length === 0) {
    return Response.json([])
  }

  const rows = schedule.map((entry) => ({
    barber_id: barberId,
    day_of_week: entry.day_of_week,
    start_time: entry.start_time,
    end_time: entry.end_time,
    break_start: entry.break_start ?? null,
    break_end: entry.break_end ?? null,
  }))

  const { data, error: insertError } = await supabaseAdmin
    .from('schedules')
    .insert(rows)
    .select()

  if (insertError) {
    return Response.json({ error: 'Failed to save schedule' }, { status: 500 })
  }

  return Response.json(data)
}
