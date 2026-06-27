import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { toMinutes } from '@/lib/utils/time'
import { signCancelToken } from '@/lib/utils/jwt'
import { Resend } from 'resend'
import { confirmationEmailHtml } from '@/lib/emails/confirmation'
import { newAppointmentEmailHtml } from '@/lib/emails/new-appointment'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── POST /api/appointments ───────────────────────────────────────────────────
// Body: { barberId, serviceId, clientId, startsAt }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { barberId, serviceId, clientId, startsAt } = body

  if (!barberId || !serviceId || !clientId || !startsAt) {
    return Response.json(
      { error: 'barberId, serviceId, clientId, and startsAt are required' },
      { status: 400 }
    )
  }

  // Fetch service to get duration
  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id, name, duration_min, price, shop_id')
    .eq('id', serviceId)
    .maybeSingle()

  if (serviceError || !service) {
    return Response.json({ error: 'Service not found' }, { status: 404 })
  }

  const startsAtDate = new Date(startsAt)
  const endsAtDate = new Date(startsAtDate.getTime() + service.duration_min * 60 * 1000)
  const endsAt = endsAtDate.toISOString()

  // Race condition check: verify no overlapping appointment exists
  const { data: conflicts } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('barber_id', barberId)
    .not('status', 'in', '("cancelled")')
    .lt('starts_at', endsAt)
    .gt('ends_at', startsAt)

  if (conflicts && conflicts.length > 0) {
    return Response.json({ error: 'This slot is no longer available' }, { status: 409 })
  }

  // Insert appointment
  const { data: appointment, error: insertError } = await supabaseAdmin
    .from('appointments')
    .insert({
      barber_id: barberId,
      service_id: serviceId,
      client_id: clientId,
      starts_at: startsAt,
      ends_at: endsAt,
      status: 'pending',
      reminder_sent: false,
    })
    .select()
    .single()

  if (insertError || !appointment) {
    return Response.json({ error: 'Failed to create appointment' }, { status: 500 })
  }

  // Trigger emails (fire and forget — don't block response on email delivery)
  triggerEmails(appointment, service).catch(console.error)

  return Response.json(appointment, { status: 201 })
}

// ─── GET /api/appointments ────────────────────────────────────────────────────
// Query: barberId?, shopId?, clientId?, date?
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const barberId = searchParams.get('barberId')
  const shopId = searchParams.get('shopId')
  const clientId = searchParams.get('clientId')
  const date = searchParams.get('date')

  let effectiveClientId = clientId
  if (!barberId && !shopId && !effectiveClientId) {
    effectiveClientId = user.id
  }

  // Verify the requester is authorized for the requested scope
  if (effectiveClientId && effectiveClientId !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (barberId) {
    const { data: barberRow } = await supabaseAdmin
      .from('barbers')
      .select('id, user_id, shop_id')
      .eq('id', barberId)
      .maybeSingle()

    if (!barberRow) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const isBarber = barberRow.user_id === user.id
    let isOwner = false

    if (!isBarber && barberRow.shop_id) {
      const { data: shopRow } = await supabaseAdmin
        .from('shops')
        .select('id')
        .eq('id', barberRow.shop_id)
        .eq('owner_id', user.id)
        .maybeSingle()

      isOwner = !!shopRow
    }

    if (!isBarber && !isOwner) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (shopId) {
    const { data: shopRow } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('id', shopId)
      .eq('owner_id', user.id)
      .maybeSingle()
    if (!shopRow) return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabaseAdmin
    .from('appointments')
    .select(`
      *,
      service:service_id ( id, name, duration_min, price, shop_id ),
      barber:barber_id ( id, display_name, user_id )
    `)

  if (barberId) query = query.eq('barber_id', barberId)
  if (effectiveClientId) query = query.eq('client_id', effectiveClientId)
  if (date) {
    query = query
      .gte('starts_at', `${date}T00:00:00`)
      .lte('starts_at', `${date}T23:59:59`)
  }

  if (shopId) {
    // Filter by shop via service
    const { data: serviceIds } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('shop_id', shopId)
    const ids = (serviceIds ?? []).map((s: { id: string }) => s.id)
    if (ids.length === 0) return Response.json([])
    query = query.in('service_id', ids)
  }

  const { data, error } = await query.order('starts_at', { ascending: true })

  if (error) {
    return Response.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }

  return Response.json(data)
}

// ─── Email helper ─────────────────────────────────────────────────────────────
async function triggerEmails(
  appointment: { id: string; barber_id: string; service_id: string; client_id: string; starts_at: string },
  service: { name: string; price: number; shop_id: string }
) {
  // Fetch all details needed for emails
  const [barberResult, shopResult, clientResult] = await Promise.all([
    supabaseAdmin
      .from('barbers')
      .select('user_id, notification_email')
      .eq('id', appointment.barber_id)
      .maybeSingle(),
    supabaseAdmin
      .from('shops')
      .select('name')
      .eq('id', service.shop_id)
      .maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(appointment.client_id),
  ])

  const barber = barberResult.data
  const shop = shopResult.data
  const clientUser = clientResult.data?.user

  if (!barber || !shop || !clientUser) return

  // Fetch barber's user email
  const barberUserResult = await supabaseAdmin.auth.admin.getUserById(barber.user_id)
  const barberUser = barberUserResult.data?.user

  const clientEmail = clientUser.email
  const clientName = clientUser.user_metadata?.full_name ?? clientUser.email ?? 'Cliente'
  const barberName = barberUser?.user_metadata?.full_name ?? barberUser?.email ?? 'Barbero'

  const cancelToken = await signCancelToken(appointment.id)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const cancelUrl = `${appUrl}/api/cancel/${cancelToken}`

  const emailPromises: Promise<unknown>[] = []

  // Confirmation to client
  if (clientEmail) {
    emailPromises.push(
      resend.emails.send({
        from: `${shop.name} <noreply@${process.env.RESEND_DOMAIN ?? 'resend.dev'}>`,
        to: clientEmail,
        subject: `Cita confirmada — ${shop.name}`,
        html: confirmationEmailHtml({
          clientName,
          shopName: shop.name,
          barberName,
          serviceName: service.name,
          servicePrice: service.price,
          startsAt: appointment.starts_at,
          cancelUrl,
        }),
      })
    )
  }

  // Notification to barber (if notifications enabled)
  if (barber.notification_email && barberUser?.email) {
    emailPromises.push(
      resend.emails.send({
        from: `Barber Assistant <noreply@${process.env.RESEND_DOMAIN ?? 'resend.dev'}>`,
        to: barberUser.email,
        subject: `Nueva cita: ${clientName}`,
        html: newAppointmentEmailHtml({
          barberName,
          clientName,
          serviceName: service.name,
          startsAt: appointment.starts_at,
        }),
      })
    )
  }

  await Promise.allSettled(emailPromises)
}
