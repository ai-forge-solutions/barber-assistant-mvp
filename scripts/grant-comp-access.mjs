// Grant or revoke complimentary ("comp") access for a shop. No Stripe involved.
//
//   node scripts/grant-comp-access.mjs --shop <slug|shop_id> --reason "Amigo · beta tester" [--plan pro|basic] [--until 2027-06-30] [--dry-run]
//   node scripts/grant-comp-access.mjs --shop <slug|shop_id> --revoke [--dry-run]
//
// Without --until the access never expires (current_period_end = null).
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from --env (default .env.local).
import { readFile } from 'node:fs/promises'
import { parseArgs, parseEnv } from 'node:util'
import { createClient } from '@supabase/supabase-js'

const CURRENT_STATUSES = ['incomplete', 'trialing', 'active', 'past_due', 'paused']
const DB_PLAN_KEYS = { pro: 'premium', basic: 'recommended' }

const { values: args } = parseArgs({
  options: {
    shop: { type: 'string' },
    reason: { type: 'string' },
    plan: { type: 'string', default: 'pro' },
    until: { type: 'string' },
    revoke: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    env: { type: 'string', default: '.env.local' },
  },
})

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

if (!args.shop) fail('Falta --shop <slug|shop_id>.')
if (!args.revoke && !args.reason?.trim()) fail('Falta --reason: deja constancia de por qué es gratis.')
if (!DB_PLAN_KEYS[args.plan]) fail(`--plan debe ser "pro" o "basic" (recibido: ${args.plan}).`)

let periodEnd = null
if (args.until) {
  const until = new Date(`${args.until}T23:59:59Z`)
  if (Number.isNaN(until.getTime())) fail(`--until no es una fecha válida (YYYY-MM-DD): ${args.until}`)
  if (until.getTime() <= Date.now()) fail('--until tiene que ser una fecha futura.')
  periodEnd = until.toISOString()
}

const env = { ...parseEnv(await readFile(args.env, 'utf8').catch(() => fail(`No se pudo leer ${args.env}.`))), ...process.env }
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  fail(`Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en ${args.env}.`)
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const dryRun = args['dry-run']

console.log(`Supabase: ${new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname}${dryRun ? '  (dry run, no se escribe nada)' : ''}`)

const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.shop)
const { data: shop, error: shopError } = await admin
  .from('shops')
  .select('id, name, slug')
  .eq(isUuid ? 'id' : 'slug', args.shop)
  .maybeSingle()

if (shopError) fail(`Error buscando la barbería: ${shopError.message}`)
if (!shop) fail(`No existe ninguna barbería con ${isUuid ? 'id' : 'slug'} "${args.shop}".`)
console.log(`Barbería: ${shop.name} (${shop.slug} · ${shop.id})`)

const { data: rows, error: rowsError } = await admin
  .from('shop_subscriptions')
  .select('id, source, status, plan_key, current_period_end, comp_reason, stripe_subscription_id, updated_at')
  .eq('shop_id', shop.id)
  .order('updated_at', { ascending: false })

if (rowsError) {
  if (rowsError.code === '42703') fail('Falta aplicar la migración 20261118190000_shop_subscriptions_comp_access.sql.')
  fail(`Error leyendo suscripciones: ${rowsError.message}`)
}

const currentStripe = rows.find((row) => row.source === 'stripe' && CURRENT_STATUSES.includes(row.status))
const latestComp = rows.find((row) => row.source === 'comp')
const now = new Date().toISOString()

async function write(description, operation) {
  console.log(`→ ${description}`)
  if (dryRun) return
  const { error } = await operation()
  if (error) fail(error.message)
  console.log('✓ Hecho.')
}

if (args.revoke) {
  if (!latestComp || !CURRENT_STATUSES.includes(latestComp.status)) {
    console.log('No hay acceso de cortesía activo. Nada que revocar.')
    process.exit(0)
  }
  await write('Revocar acceso de cortesía', () => admin
    .from('shop_subscriptions')
    .update({ status: 'canceled', current_period_end: now, updated_at: now })
    .eq('id', latestComp.id))
  process.exit(0)
}

if (currentStripe) {
  fail(
    `La barbería ya tiene una suscripción de Stripe en estado "${currentStripe.status}" (${currentStripe.stripe_subscription_id ?? 'sin id'}). ` +
    'Cancélala en Stripe primero para no cobrarle y vuelve a lanzar el script.'
  )
}

const compPayload = {
  source: 'comp',
  status: 'active',
  plan_key: DB_PLAN_KEYS[args.plan],
  comp_reason: args.reason.trim(),
  current_period_start: now,
  current_period_end: periodEnd,
  trial_ends_at: null,
  cancel_at_period_end: false,
  updated_at: now,
}
const summary = `plan ${args.plan}, ${periodEnd ? `hasta ${args.until}` : 'sin caducidad'}, motivo "${compPayload.comp_reason}"`

if (latestComp) {
  await write(`Actualizar acceso de cortesía: ${summary}`, () => admin
    .from('shop_subscriptions')
    .update(compPayload)
    .eq('id', latestComp.id))
} else {
  await write(`Conceder acceso de cortesía: ${summary}`, () => admin
    .from('shop_subscriptions')
    .insert({ ...compPayload, shop_id: shop.id }))
}
