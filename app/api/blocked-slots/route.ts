import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface BarberRow {
  id: string
  user_id: string
  shop_id: string
}

async function canManageBarber(barberId: string, userId: string) {
  const { data: barber } = await supabaseAdmin
    .from('barbers')
    .select('id, user_id, shop_id')
    .eq('id', barberId)
    .maybeSingle<BarberRow>()

  if (!barber) return { allowed: false, status: 404, error: 'Barber not found' }

  const isSelf = barber.user_id === userId

  const { data: shopRow } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('id', barber.shop_id)
    .eq('owner_id', userId)
    .maybeSingle()

  if (!isSelf && !shopRow) return { allowed: false, status: 403, error: 'Forbidden' }

  return { allowed: true, status: 200, error: null }
}

function normalizeIso(value: unknown) {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return value
}

// GET /api/blocked-slots?barberId=&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const barberId = searchParams.get('barberId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!barberId) {
    return Response.json({ error: 'barberId is required' }, { status: 400 })
  }

  const auth = await canManageBarber(barberId, user.id)
  if (!auth.allowed) return Response.json({ error: auth.error }, { status: auth.status })

  let query = supabaseAdmin
    .from('blocked_slots')
    .select('id, barber_id, starts_at, ends_at, reason')
    .eq('barber_id', barberId)

  if (from) query = query.gte('ends_at', `${from}T00:00:00`)
  if (to) query = query.lte('starts_at', `${to}T23:59:59`)

  const { data, error } = await query.order('starts_at', { ascending: true })

  if (error) return Response.json({ error: 'Failed to fetch blocked slots' }, { status: 500 })

  return Response.json(data ?? [])
}

// POST /api/blocked-slots
// Body: { barberId, startsAt, endsAt, reason? }
// Legacy body also accepted: { barberId, date, startTime, endTime, reason? }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { barberId, reason } = body

  let startsAt = normalizeIso(body.startsAt)
  let endsAt = normalizeIso(body.endsAt)

  if (!startsAt && !endsAt && body.date && body.startTime && body.endTime) {
    startsAt = normalizeIso(`${body.date}T${body.startTime}:00`)
    endsAt = normalizeIso(`${body.date}T${body.endTime}:00`)
  }

  if (!barberId || !startsAt || !endsAt) {
    return Response.json(
      { error: 'barberId, startsAt, and endsAt are required' },
      { status: 400 }
    )
  }

  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return Response.json({ error: 'endsAt must be after startsAt' }, { status: 400 })
  }

  const auth = await canManageBarber(barberId, user.id)
  if (!auth.allowed) return Response.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await supabaseAdmin
    .from('blocked_slots')
    .insert({
      barber_id: barberId,
      starts_at: startsAt,
      ends_at: endsAt,
      reason: typeof reason === 'string' && reason.trim() ? reason.trim() : null,
    })
    .select('id, barber_id, starts_at, ends_at, reason')
    .single()

  if (error) {
    return Response.json({ error: 'Failed to create blocked slot' }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
