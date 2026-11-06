import { supabaseAdmin } from '@/lib/supabase/admin'
import { authenticateMcp } from '@/lib/mcp/oauth'
import { mcpHandler } from '@/lib/mcp/handler'
import { createShopServices } from '@/lib/mcp/shops'
import { availabilityFor, proposeBooking, confirmBooking } from '@/lib/mcp/booking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const services = {
  ...createShopServices(supabaseAdmin),
  availability: availabilityFor,
  propose: proposeBooking,
  confirm: confirmBooking,
}
const handle = (request: Request) => mcpHandler(request, authenticateMcp, services)
export { handle as GET, handle as POST, handle as DELETE, handle as OPTIONS }
