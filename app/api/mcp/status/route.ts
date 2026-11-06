import { mcpReadiness } from '@/lib/mcp/readiness'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const status = await mcpReadiness(supabaseAdmin)
    return Response.json(status, { status: status.ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ service: 'trujas-mcp', ready: false, status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
