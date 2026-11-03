#!/usr/bin/env node
// Read-only GA4 funnel report through the Google Analytics Data API, using a
// service account key. No dependencies beyond `jose` (already in the app).
//
//   GOOGLE_APPLICATION_CREDENTIALS=~/.hermes/ga4-reader.json \
//   node scripts/ga4-report.mjs --property 562094841 --days 28 [--json]
//
// The service account needs the Viewer role on the GA4 property; it cannot
// change GA settings. See docs/analytics.md → "Lectura para agentes".
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { SignJWT, importPKCS8 } from 'jose'

const PROPERTIES = { trujas: '562094841', velz: '561805505' }

// Funnel order for trujas; any other event still shows up in the totals table.
const FUNNEL = [
  'page_view', 'cta_click', 'begin_checkout', 'sign_up', 'onboarding_complete', 'checkout_completed',
  'booking_start', 'booking_complete', 'booking_cancelled',
]

function args(argv) {
  const out = { property: process.env.GA4_PROPERTY_ID ?? PROPERTIES.trujas, days: 28, json: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--property') out.property = PROPERTIES[argv[++i]] ?? argv[i]
    else if (arg === '--days') out.days = Number(argv[++i])
    else if (arg === '--json') out.json = true
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/ga4-report.mjs [--property trujas|velz|<id>] [--days 28] [--json]')
      process.exit(0)
    } else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!/^\d+$/.test(out.property)) throw new Error(`Invalid property: ${out.property}`)
  if (!Number.isInteger(out.days) || out.days < 1 || out.days > 400) throw new Error('--days must be 1..400')
  return out
}

async function accessToken() {
  const path = (process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '').replace(/^~(?=\/)/, homedir())
  if (!path) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to the service account JSON key path')
  const key = JSON.parse(readFileSync(path, 'utf8'))
  const now = Math.floor(Date.now() / 1000)
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/analytics.readonly' })
    .setProtectedHeader({ alg: 'RS256', kid: key.private_key_id })
    .setIssuer(key.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(await importPKCS8(key.private_key, 'RS256'))
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`Token request failed: ${body.error_description ?? body.error}`)
  return body.access_token
}

async function runReport(token, property, request) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const body = await response.json()
  if (!response.ok) {
    const hint = response.status === 403 ? ' (is the service account a Viewer on this property?)' : ''
    throw new Error(`runReport ${response.status}: ${body.error?.message ?? 'unknown error'}${hint}`)
  }
  return (body.rows ?? []).map((row) => [
    ...row.dimensionValues.map((v) => v.value),
    ...row.metricValues.map((v) => Number(v.value)),
  ])
}

async function main() {
  const { property, days, json } = args(process.argv.slice(2))
  const token = await accessToken()
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }]

  const [events, channels, ctas, groups] = await Promise.all([
    runReport(token, property, {
      dateRanges,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      limit: 100,
    }),
    runReport(token, property, {
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'keyEvents' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
    runReport(token, property, {
      dateRanges,
      dimensions: [{ name: 'eventName' }, { name: 'customEvent:cta_id' }, { name: 'customEvent:cta_location' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['cta_click', 'begin_checkout'] } } },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
    }).catch(() => []), // velz has no cta_id dimension
    runReport(token, property, {
      dateRanges,
      dimensions: [{ name: 'contentGroup' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    }),
  ])

  const byEvent = new Map(events.map(([name, count, users]) => [name, { count, users }]))
  const funnel = FUNNEL.map((name) => ({ event: name, ...(byEvent.get(name) ?? { count: 0, users: 0 }) }))
  const report = { property, days, funnel, events, channels, ctas, contentGroups: groups }

  if (json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }
  console.log(`GA4 property ${property} · last ${days} days\n`)
  console.log('Funnel (events / users)')
  console.table(funnel)
  const others = events.filter(([name]) => !FUNNEL.includes(name))
  if (others.length) {
    console.log('Other events (events / users)')
    console.table(others.map(([event, count, users]) => ({ event, count, users })))
  }
  console.log('Channels (sessions / users / key events)')
  console.table(channels.map(([channel, sessions, users, keyEvents]) => ({ channel, sessions, users, keyEvents })))
  if (ctas.length) {
    console.log('CTA and checkout clicks')
    console.table(ctas.map(([event, cta, location, count]) => ({ event, cta, location, count })))
  }
  console.log('Content groups (views / users)')
  console.table(groups.map(([group, views, users]) => ({ group, views, users })))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
