import { parseInstant, validDate } from './time.ts'

type Selection = { shopId: string; barberId: string; serviceId: string }
type RpcClient = { rpc(name: string, args: Record<string, string>): PromiseLike<{ data: unknown; error: unknown }> }

function uuid(value: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error('Invalid identifier')
  }
  return value
}
function audience(value: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) throw new Error('Invalid resource')
  return value
}
function selection(userId: string, input: Selection) {
  return { p_user: uuid(userId), p_shop: uuid(input.shopId), p_barber: uuid(input.barberId), p_service: uuid(input.serviceId) }
}

/** Server-only adapters. Authenticated identity/resource come from the OAuth boundary,
 * never from tool arguments. All policy and concurrent write gates live in Postgres.
 * Deliberately not a `use server` module: these are NOT public React server actions.
 */
export function createBookingServices(db: RpcClient) {
  async function rpc(name: string, args: Record<string, string>) {
    const { data, error } = await db.rpc(name, args)
    if (error || data == null) throw new Error('No se pudo validar la reserva; consulta disponibilidad y prepara otra propuesta.')
    return data
  }
  return {
    async availabilityFor(userId: string, input: Selection & { date: string }) {
      return rpc('mcp_booking_availability', { ...selection(userId,input), p_date: validDate(input.date) })
    },
    async proposeBooking(userId: string, input: Selection & { startsAt: string }, resource: string) {
      return rpc('mcp_prepare_booking', { ...selection(userId,input), p_start: parseInstant(input.startsAt), p_resource: audience(resource) })
    },
    async confirmBooking(userId: string, proposalId: string, resource: string) {
      return rpc('mcp_confirm_booking', { p_user: uuid(userId), p_proposal: uuid(proposalId), p_resource: audience(resource) })
    },
  }
}

// Lazy import keeps credentials out of pure validation/tests; only server callers
// invoke these exports. No process-global proposal cache or client-supplied identity.
async function services() {
  const { supabaseAdmin } = await import('../supabase/admin')
  return createBookingServices(supabaseAdmin)
}
export async function availabilityFor(userId: string, input: Selection & { date: string }) {
  return (await services()).availabilityFor(userId,input)
}
export async function proposeBooking(userId: string, input: Selection & { startsAt: string }, resource: string) {
  return (await services()).proposeBooking(userId,input,resource)
}
export async function confirmBooking(userId: string, proposalId: string, resource: string) {
  return (await services()).confirmBooking(userId,proposalId,resource)
}
