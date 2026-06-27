import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateSlots, toMinutes, OccupiedRange } from '@/lib/utils/time'

// GET /api/availability?barberId=&serviceId=&date=YYYY-MM-DD
// Public — no auth required
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const barberId = searchParams.get('barberId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date')

  if (!barberId || !serviceId || !date) {
    return Response.json(
      { error: 'barberId, serviceId, and date are required' },
      { status: 400 }
    )
  }

  // Validate date format
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return Response.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
  }

  // day_of_week: 0=Sun, 1=Mon, ..., 6=Sat
  const dayOfWeek = dateObj.getUTCDay()

  // 1. Fetch barber schedule for that day
  const { data: scheduleRows, error: scheduleError } = await supabaseAdmin
    .from('schedules')
    .select('start_time, end_time, break_start, break_end')
    .eq('barber_id', barberId)
    .eq('day_of_week', dayOfWeek)
    .limit(1)

  if (scheduleError) {
    return Response.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }

  const schedule = scheduleRows?.[0] ?? null

  // Barber has no schedule for this day
  if (!schedule) {
    return Response.json({ date, barberId, slots: [] })
  }

  // 2. Fetch service duration
  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('duration_min')
    .eq('id', serviceId)
    .maybeSingle()

  if (serviceError || !service) {
    return Response.json({ error: 'Service not found' }, { status: 404 })
  }

  const durationMin: number = service.duration_min

  // 3. Fetch existing appointments that day (not cancelled)
  const dayStart = `${date}T00:00:00`
  const dayEnd = `${date}T23:59:59`

  const { data: appointments, error: apptError } = await supabaseAdmin
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('barber_id', barberId)
    .not('status', 'in', '("cancelled")')
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)

  if (apptError) {
    return Response.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }

  // 4. Fetch blocked slots that day (optional; ignore if the table is unavailable)
  let blockedSlots: Array<{ start_time: string; end_time: string }> = []
  const { data: blockedRows, error: blockedError } = await supabaseAdmin
    .from('blocked_slots')
    .select('start_time, end_time')
    .eq('barber_id', barberId)
    .eq('date', date)

  if (!blockedError && blockedRows) {
    blockedSlots = blockedRows as Array<{ start_time: string; end_time: string }>
  }

  // 5. Build occupied ranges (all in minutes from midnight)
  const occupied: OccupiedRange[] = []

  for (const appt of appointments ?? []) {
    // starts_at / ends_at are ISO timestamps — extract time portion
    const start = toMinutes(appt.starts_at.slice(11, 16))
    const end = toMinutes(appt.ends_at.slice(11, 16))
    occupied.push({ start, end })
  }

  for (const slot of blockedSlots ?? []) {
    occupied.push({
      start: toMinutes(slot.start_time),
      end: toMinutes(slot.end_time),
    })
  }

  // 6. Generate available slots
  const slots = generateSlots(
    schedule.start_time,
    schedule.end_time,
    durationMin,
    schedule.break_start ?? null,
    schedule.break_end ?? null,
    occupied
  )

  return Response.json({ date, barberId, slots })
}
