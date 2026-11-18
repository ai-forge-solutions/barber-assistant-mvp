import { supabaseAdmin } from '@/lib/supabase/admin'

type SubscriptionSummary = {
  status: string
  current_period_end: string | null
  stripe_customer_id: string | null
  source: 'stripe' | 'comp'
  plan_key: string
}

export type DashboardAccess = {
  shop: { id: string; name?: string; slug?: string; logo_url?: string | null; owner_id?: string } | null
  barber: { id: string; shop_id: string; user_id: string; is_active?: boolean } | null
  isOwner: boolean
  subscription: SubscriptionSummary | null
  hasActiveSubscription: boolean
}

function hasActiveSubscription(subscription: { status: string; current_period_end: string | null } | null) {
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) return false
  if (!subscription.current_period_end) return true
  return new Date(subscription.current_period_end).getTime() > Date.now()
}

async function getSubscription(shopId: string) {
  const query = (columns: string) => supabaseAdmin
    .from('shop_subscriptions')
    .select(columns)
    .eq('shop_id', shopId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await query('status, current_period_end, stripe_customer_id, source, plan_key')
  if (!error) return data as unknown as SubscriptionSummary | null

  // Comp-access migration not applied yet: keep access working with the legacy columns.
  if (error.code === '42703' || error.code === 'PGRST204') {
    const legacy = await query('status, current_period_end, stripe_customer_id, plan_key')
    return legacy.data ? ({ ...(legacy.data as object), source: 'stripe' } as SubscriptionSummary) : null
  }

  return null
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
    const subscription = await getSubscription(ownedShop.id)
    return { shop: ownedShop, barber: null, isOwner: true, subscription, hasActiveSubscription: hasActiveSubscription(subscription) }
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
    return { shop: null, barber: null, isOwner: false, subscription: null, hasActiveSubscription: false }
  }

  const { data: shop } = await supabaseAdmin
    .from('shops')
    .select('id, name, slug, logo_url, owner_id')
    .eq('id', barber.shop_id)
    .maybeSingle()

  const subscription = shop ? await getSubscription(shop.id) : null
  return { shop: shop ?? null, barber, isOwner: false, subscription, hasActiveSubscription: hasActiveSubscription(subscription) }
}
