import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getDashboardAccess } from '@/lib/dashboard/access'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { shop } = await getDashboardAccess(user.id)

  if (!shop) return Response.json([])

  const { data, error } = await supabaseAdmin
    .from('services')
    .select('id, name, duration_min, price, is_active')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('name')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}
