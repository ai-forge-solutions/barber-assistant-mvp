import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function requireOwner(shopId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .maybeSingle()
  return !!data
}

// POST /api/shops/[id]/barbers
// Body: { email }  — invite barber by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: shopId } = await params

  if (!(await requireOwner(shopId, user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, displayName } = body

  if (!email) {
    return Response.json({ error: 'email is required' }, { status: 400 })
  }

  // Look up the user by email in auth.users via admin API
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

  if (listError) {
    return Response.json({ error: 'Failed to look up user' }, { status: 500 })
  }

  const invitedUser = users.find((u) => u.email === email)

  if (!invitedUser) {
    return Response.json(
      { error: 'No account found with that email. The barber must sign up first.' },
      { status: 404 }
    )
  }

  // Check if barber row already exists for this shop + user
  const { data: existing } = await supabaseAdmin
    .from('barbers')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', invitedUser.id)
    .maybeSingle()

  if (existing) {
    return Response.json({ error: 'Barber already belongs to this shop' }, { status: 409 })
  }

  const { data: barber, error: insertError } = await supabaseAdmin
    .from('barbers')
    .insert({
      shop_id: shopId,
      user_id: invitedUser.id,
      notification_email: true,
      ...(displayName ? { display_name: displayName } : {}),
    })
    .select()
    .single()

  if (insertError) {
    return Response.json({ error: 'Failed to add barber' }, { status: 500 })
  }

  return Response.json(barber, { status: 201 })
}
