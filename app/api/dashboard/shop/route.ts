import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    console.log('[/api/dashboard/shop] user:', user?.id, 'authErr:', authErr)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('shops')
      .select('id, name, slug, logo_url, owner_id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('[/api/dashboard/shop] data:', data, 'error:', error)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  } catch (e) {
    console.error('[/api/dashboard/shop] caught:', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
