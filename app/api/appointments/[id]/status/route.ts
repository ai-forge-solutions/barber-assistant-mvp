import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED_STATUSES = ['confirmed', 'cancelled', 'completed', 'no_show'] as const
type AppointmentStatus = typeof ALLOWED_STATUSES[number]

// PATCH /api/appointments/[id]/status
// Body: { status }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { status } = body as { status: AppointmentStatus }

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return Response.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // Fetch the appointment and its associated barber/shop to determine permissions
  const { data: appointment, error: fetchError } = await supabaseAdmin
    .from('appointments')
    .select('id, client_id, barber_id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !appointment) {
    return Response.json({ error: 'Appointment not found' }, { status: 404 })
  }

  // Determine user role for this appointment
  const isClient = appointment.client_id === user.id

  // Check if user is the barber
  const { data: barberRow } = await supabaseAdmin
    .from('barbers')
    .select('id, shop_id')
    .eq('id', appointment.barber_id)
    .eq('user_id', user.id)
    .maybeSingle()
  const isBarber = !!barberRow

  // Check if user is the shop owner
  let isOwner = false
  if (barberRow) {
    const { data: shopRow } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('id', barberRow.shop_id)
      .eq('owner_id', user.id)
      .maybeSingle()
    isOwner = !!shopRow
  }

  // Clients can only cancel their own appointments
  if (isClient && !isBarber && !isOwner) {
    if (status !== 'cancelled') {
      return Response.json(
        { error: 'Clients can only cancel their own appointments' },
        { status: 403 }
      )
    }
    if (appointment.client_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (!isClient && !isBarber && !isOwner) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return Response.json({ error: 'Failed to update appointment' }, { status: 500 })
  }

  return Response.json(updated)
}
