import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { signCancelToken } from '@/lib/utils/jwt'
import { Resend } from 'resend'
import { reminderEmailHtml } from '@/lib/emails/reminder'

const resend = new Resend(process.env.RESEND_API_KEY)

// GET /api/reminders
// Called by a cron job. Requires Authorization: Bearer REMINDER_CRON_SECRET
export async function GET(request: NextRequest) {
  const secret = process.env.REMINDER_CRON_SECRET
  const authHeader = request.headers.get('Authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()

  // Fetch appointments in the 23–25h window that haven't been reminded yet
  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id,
      client_id,
      barber_id,
      service_id,
      starts_at,
      service:service_id ( name, shop_id ),
      barber:barber_id ( user_id )
    `)
    .gte('starts_at', windowStart)
    .lte('starts_at', windowEnd)
    .not('status', 'in', '("cancelled")')
    .eq('reminder_sent', false)

  if (error) {
    return Response.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }

  if (!appointments || appointments.length === 0) {
    return Response.json({ sent: 0 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  let sent = 0
  const ids: string[] = []

  await Promise.allSettled(
    appointments.map(async (appt) => {
      try {
        // Narrow joins (they come as arrays from PostgREST joins when using select)
        const service = Array.isArray(appt.service) ? appt.service[0] : appt.service
        const barber = Array.isArray(appt.barber) ? appt.barber[0] : appt.barber

        if (!service || !barber) return

        // Fetch shop and users in parallel
        const [shopResult, clientResult, barberUserResult] = await Promise.all([
          supabaseAdmin.from('shops').select('name').eq('id', service.shop_id).maybeSingle(),
          supabaseAdmin.auth.admin.getUserById(appt.client_id),
          supabaseAdmin.auth.admin.getUserById(barber.user_id),
        ])

        const shop = shopResult.data
        const clientUser = clientResult.data?.user
        const barberUser = barberUserResult.data?.user

        if (!shop || !clientUser?.email) return

        const clientName = clientUser.user_metadata?.full_name ?? clientUser.email ?? 'Cliente'
        const barberName = barberUser?.user_metadata?.full_name ?? barberUser?.email ?? 'Barbero'

        const cancelToken = await signCancelToken(appt.id)
        const cancelUrl = `${appUrl}/api/cancel/${cancelToken}`

        await resend.emails.send({
          from: `${shop.name} <noreply@${process.env.RESEND_DOMAIN ?? 'resend.dev'}>`,
          to: clientUser.email,
          subject: `Recordatorio de cita mañana — ${shop.name}`,
          html: reminderEmailHtml({
            clientName,
            shopName: shop.name,
            barberName,
            serviceName: service.name,
            startsAt: appt.starts_at,
            cancelUrl,
          }),
        })

        ids.push(appt.id)
        sent++
      } catch {
        // Individual failure — continue with others
      }
    })
  )

  // Mark reminded appointments
  if (ids.length > 0) {
    await supabaseAdmin
      .from('appointments')
      .update({ reminder_sent: true })
      .in('id', ids)
  }

  return Response.json({ sent })
}
