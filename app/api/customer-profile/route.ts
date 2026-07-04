import { createClient } from '@/lib/supabase/server'
import { getCustomer, hasRequiredCustomer, upsertCustomer } from '@/lib/auth/customers'
import { normalizePhone } from '@/lib/auth/client-profile'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const customer = await getCustomer(user)
  return Response.json({ customer, complete: hasRequiredCustomer(customer) })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const fullName = String(body.fullName ?? '').trim()
  const phoneCountryCode = String(body.phoneCountryCode ?? '').trim() || null
  const phoneDialCode = String(body.phoneDialCode ?? '').trim()
  const rawPhone = String(body.phone ?? '').trim()
  const phone = phoneDialCode ? normalizePhone(phoneDialCode, rawPhone) : rawPhone

  if (!fullName || !phone) {
    return Response.json({ error: 'fullName and phone are required' }, { status: 400 })
  }

  const customer = await upsertCustomer({
    id: user.id,
    full_name: fullName,
    phone,
    phone_country_code: phoneCountryCode,
    phone_dial_code: phoneDialCode || null,
  })

  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      phone,
      phone_country_code: phoneCountryCode,
      phone_dial_code: phoneDialCode || null,
    },
  })

  return Response.json({ customer, complete: true })
}
