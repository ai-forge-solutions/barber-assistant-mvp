import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  // Verify the barber belongs to a shop owned by this user
  const { data: barber } = await supabaseAdmin
    .from('barbers')
    .select('id, shop_id')
    .eq('id', id)
    .maybeSingle()

  if (!barber) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: shop } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('id', barber.shop_id)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!shop) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('barbers')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
