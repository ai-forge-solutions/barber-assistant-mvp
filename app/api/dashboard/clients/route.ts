import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ClientMetadata = {
  full_name?: string
  name?: string
  phone?: string
  phone_number?: string
  mobile?: string
}

type AppointmentRow = {
  id: string
  client_id: string | null
  starts_at: string
  status: string
}

type ClientSummary = {
  id: string
  fullName: string
  email: string
  phone: string
  appointmentCount: number
  lastAppointmentAt: string | null
}

function metadataString(metadata: ClientMetadata, keys: Array<keyof ClientMetadata>) {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (shopError) return Response.json({ error: shopError.message }, { status: 500 })
  if (!shop) return Response.json([])

  const { data: barbers, error: barbersError } = await supabaseAdmin
    .from('barbers')
    .select('id')
    .eq('shop_id', shop.id)

  if (barbersError) return Response.json({ error: barbersError.message }, { status: 500 })

  const barberIds = (barbers ?? []).map((barber: { id: string }) => barber.id)
  if (barberIds.length === 0) return Response.json([])

  const { data: appointments, error: appointmentsError } = await supabaseAdmin
    .from('appointments')
    .select('id, client_id, starts_at, status')
    .in('barber_id', barberIds)
    .not('client_id', 'is', null)
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: false })

  if (appointmentsError) return Response.json({ error: appointmentsError.message }, { status: 500 })

  const byClient = new Map<string, { count: number; lastAppointmentAt: string | null }>()

  for (const appointment of (appointments ?? []) as AppointmentRow[]) {
    if (!appointment.client_id) continue
    const current = byClient.get(appointment.client_id)
    if (!current) {
      byClient.set(appointment.client_id, {
        count: 1,
        lastAppointmentAt: appointment.starts_at,
      })
      continue
    }
    current.count += 1
    if (!current.lastAppointmentAt || appointment.starts_at > current.lastAppointmentAt) {
      current.lastAppointmentAt = appointment.starts_at
    }
  }

  const clients = await Promise.all(
    Array.from(byClient.entries()).map(async ([clientId, stats]): Promise<ClientSummary> => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(clientId)
      const client = data?.user
      const metadata = (client?.user_metadata ?? {}) as ClientMetadata
      const fullName = metadataString(metadata, ['full_name', 'name']) || client?.email || 'Cliente'
      const email = client?.email ?? ''
      const metadataPhone = metadataString(metadata, ['phone', 'phone_number', 'mobile'])
      const phone = metadataPhone || client?.phone || ''

      return {
        id: clientId,
        fullName,
        email,
        phone,
        appointmentCount: stats.count,
        lastAppointmentAt: stats.lastAppointmentAt,
      }
    })
  )

  clients.sort((a, b) => {
    if (b.appointmentCount !== a.appointmentCount) return b.appointmentCount - a.appointmentCount
    return a.fullName.localeCompare(b.fullName, 'es')
  })

  return Response.json(clients)
}
