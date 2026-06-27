import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyCancelToken } from '@/lib/utils/jwt'

// GET /api/cancel/[token]
// Public — accessible from email link
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  let appointmentId: string
  try {
    const payload = await verifyCancelToken(token)
    appointmentId = payload.appointmentId
  } catch {
    return Response.json({ error: 'Invalid or expired cancel link' }, { status: 400 })
  }

  // Fetch appointment to verify it exists and is not already cancelled
  const { data: appointment, error: fetchError } = await supabaseAdmin
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .maybeSingle()

  if (fetchError || !appointment) {
    return Response.json({ error: 'Appointment not found' }, { status: 404 })
  }

  if (appointment.status === 'cancelled') {
    return Response.redirect(`${appUrl}/cancel/already-cancelled`)
  }

  const { error: updateError } = await supabaseAdmin
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)

  if (updateError) {
    return Response.json({ error: 'Failed to cancel appointment' }, { status: 500 })
  }

  return Response.redirect(`${appUrl}/cancel/success`)
}
