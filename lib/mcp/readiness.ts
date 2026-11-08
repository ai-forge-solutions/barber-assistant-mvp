import type { SupabaseClient } from '@supabase/supabase-js'

/** A readiness check, not a claim that a real assistant booking has been verified. */
export async function mcpReadiness(db: SupabaseClient) {
  const checks = await Promise.all([
    ['mcp_oauth_clients', 'client_id'], ['mcp_oauth_codes', 'code_hash'], ['mcp_oauth_grants', 'id'],
    ['mcp_booking_proposals', 'id'], ['customer_shop_preferences', 'user_id'],
  ].map(async ([table, column]) => {
    // PostgREST JS normalizes a bodyless HEAD 404 to status=204,error=null.
    // GET limit=0 preserves schema errors without reading any customer rows.
    const { error, status } = await db.from(table).select(column).limit(0)
    return !error && status >= 200 && status < 300
  }))
  const ready = checks.every(Boolean)
  return { service: 'trujas-mcp', version: '0.1.0-pilot', ready, status: ready ? 'schema_available' : 'database_setup_required',
    endToEndVerified: false,
    message: ready ? 'Esquema accesible. La conexión y reserva real deben verificarse desde tu asistente.' : 'El piloto no está activo. Falta aplicar o verificar las migraciones de trujas antes de conectar un asistente.' }
}
