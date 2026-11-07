import type { SupabaseClient } from '@supabase/supabase-js'
import { shopContext } from './shop-policy.ts'
import type { PublicShop } from './shop-policy.ts'

const publicColumns = 'id,name,slug,address,timezone'

export function createShopServices(db: SupabaseClient) {
  async function findShop(shopId: string): Promise<PublicShop> {
    const { data, error } = await db.from('shops').select(publicColumns).eq('id', shopId).maybeSingle()
    if (error || !data) throw new Error('Barbería no encontrada')
    return data
  }
  return {
    async myShops(userId: string) {
      const [history, preference] = await Promise.all([
        db.rpc('mcp_known_shops', { p_user_id: userId }),
        db.from('customer_shop_preferences').select('preferred_shop_id').eq('user_id', userId).maybeSingle(),
      ])
      if (history.error || preference.error) throw new Error('No se pudieron consultar tus barberías')
      const preferred = preference.data?.preferred_shop_id ? await findShop(preference.data.preferred_shop_id) : null
      return { ...shopContext(history.data ?? [], preferred), serverTime: new Date().toISOString() }
    },
    async resolveShop(slug: string) {
      const { data, error } = await db.from('shops').select(publicColumns).eq('slug', slug).maybeSingle()
      if (error || !data) throw new Error('Barbería no encontrada')
      return { shop: data, savedAsPreferred: false }
    },
    async catalog(shopId: string) {
      const shop = await findShop(shopId)
      const [barbers, services, subscription] = await Promise.all([
        db.from('barbers').select('id,display_name').eq('shop_id', shopId).eq('is_active', true).order('display_name'),
        db.from('services').select('id,name,duration_min,price').eq('shop_id', shopId).eq('is_active', true).order('name'),
        db.rpc('shop_has_active_subscription', { target_shop_id: shopId }),
      ])
      if (barbers.error || services.error || subscription.error) throw new Error('No se pudo consultar el catálogo')
      return { shop, barbers: barbers.data, services: services.data, onlineBookingEnabled: subscription.data === true, currency: 'EUR' }
    },
    async setPreferred(userId: string, shopId: string | null) {
      const preferred = shopId ? await findShop(shopId) : null
      const { error } = await db.from('customer_shop_preferences').upsert({ user_id: userId, preferred_shop_id: shopId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) throw new Error('No se pudo guardar la preferencia')
      return { preferred, otherBarbershopsRemainAvailable: true }
    },
    async myAppointments(userId: string, shopId?: string) {
      // RPC scopes BOTH customer and optional shop before pagination, including legacy null shop_id.
      const { data, error } = await db.rpc('mcp_my_appointments', { p_user_id: userId, p_shop_id: shopId ?? null })
      if (error) throw new Error('No se pudieron consultar tus citas')
      const rows = (data ?? []).slice(0, 200).map((appointment: { id: string; starts_at: string; ends_at: string; status: string; shop: unknown; shop_id: string; service: unknown; barber: unknown }) => ({
        id: appointment.id, startsAt: appointment.starts_at, endsAt: appointment.ends_at, status: appointment.status,
        shop: appointment.shop, shopId: appointment.shop_id, service: appointment.service, barber: appointment.barber,
      }))
      return { appointments: rows, historyLimit: 200, truncated: (data?.length ?? 0) > 200, serverTime: new Date().toISOString() }
    },
  }
}
