import { createClient } from '@/lib/supabase/server'
import { getDashboardAccess } from '@/lib/dashboard/access'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { shop } = await getDashboardAccess(user.id)
    return Response.json(shop)
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
