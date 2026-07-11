import { supabaseAdmin } from '@/lib/supabase/admin'

export type DashboardAccess = {
  shop: { id: string; name?: string; slug?: string; logo_url?: string | null; owner_id?: string } | null
  barber: { id: string; shop_id: string; user_id: string; is_active?: boolean } | null
  isOwner: boolean
}

export async function getDashboardAccess(userId: string): Promise<DashboardAccess> {
  const { data: ownedShop } = await supabaseAdmin
    .from('shops')
    .select('id, name, slug, logo_url, owner_id')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (ownedShop) {
    return { shop: ownedShop, barber: null, isOwner: true }
  }

  const { data: barber } = await supabaseAdmin
    .from('barbers')
    .select('id, shop_id, user_id, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!barber) {
    return { shop: null, barber: null, isOwner: false }
  }

  const { data: shop } = await supabaseAdmin
    .from('shops')
    .select('id, name, slug, logo_url, owner_id')
    .eq('id', barber.shop_id)
    .maybeSingle()

  return { shop: shop ?? null, barber, isOwner: false }
}
