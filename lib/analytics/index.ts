// GA4 with Google Consent Mode v2 (basic mode): gtag.js only loads after the
// visitor accepts analytics cookies. Without NEXT_PUBLIC_GA_MEASUREMENT_ID
// (local dev, deploy previews) every export is a no-op and no banner shows.
import { contentGroup, sanitizeReferrer, sanitizeUrl } from './url'

export const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''
export const analyticsEnabled = /^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)

const CONSENT_KEY = 'trujas_consent_v1'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 395 // ~13 months

export type ConsentChoice = 'granted' | 'denied'
/** `null` = no choice yet; `undefined` = not read yet (server render). */
type ConsentState = ConsentChoice | null | undefined

type GtagWindow = { dataLayer?: unknown[] } & Record<string, unknown>
const gtagWindow = () => window as unknown as GtagWindow

let gtagLoaded = false
let consent: ConsentState
let bannerOpen = false
let lastLocation: string | undefined
let snapshot: { bannerOpen: boolean; consent: ConsentState } = { bannerOpen, consent }
const listeners = new Set<() => void>()

function emit() {
  // useSyncExternalStore needs a stable object between changes.
  snapshot = { bannerOpen, consent }
  for (const listener of listeners) listener()
}

function gtag(...args: unknown[]) {
  const w = gtagWindow()
  w.dataLayer = w.dataLayer || []
  // gtag.js requires the arguments object itself, not an array copy.
  // eslint-disable-next-line prefer-rest-params
  w.dataLayer.push(arguments)
  void args
}

function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

function writeConsent(value: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value)
  } catch {
    // Without storage the banner simply reappears on the next page load.
  }
}

function clearGaCookies() {
  const host = window.location.hostname
  const domains = ['', host, `.${host.replace(/^www\./, '')}`]
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim()
    if (!/^_ga(_|$)/.test(name)) continue
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}

function loadGtag() {
  gtag('consent', 'update', { analytics_storage: 'granted' })
  if (gtagLoaded) {
    // Re-accepting after a withdrawal on the same page.
    gtagWindow()[`ga-disable-${MEASUREMENT_ID}`] = false
    return
  }
  gtagLoaded = true

  gtag('js', new Date())
  gtag('config', MEASUREMENT_ID, {
    // Page views are sent by trackPageView() on every App Router navigation,
    // with sanitized URLs. Disable "page changes based on browser history
    // events" in the GA4 stream so they are not double counted.
    send_page_view: false,
    cookie_expires: COOKIE_MAX_AGE_SECONDS,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`
  document.head.appendChild(script)
}

/** Reads the stored choice and loads gtag if it was granted. Idempotent. */
export function initAnalytics() {
  if (!analyticsEnabled || consent !== undefined) return
  const w = gtagWindow()
  w.dataLayer = w.dataLayer || []
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
  consent = readConsent()
  bannerOpen = consent === null
  if (consent === 'granted') {
    loadGtag()
    // Child effects (the route tracker) ran before this one, so send the
    // landing page view here.
    trackPageView()
  }
  emit()
}

export function setConsent(choice: ConsentChoice) {
  if (!analyticsEnabled) return
  writeConsent(choice)
  consent = choice
  bannerOpen = false
  if (choice === 'granted') {
    loadGtag()
    trackPageView()
  } else {
    if (gtagLoaded) {
      // Withdrawal: stop collection now.
      gtag('consent', 'update', { analytics_storage: 'denied' })
      gtagWindow()[`ga-disable-${MEASUREMENT_ID}`] = true
    }
    clearGaCookies()
  }
  emit()
}

/** Reopens the banner so the visitor can change their choice. */
export function openConsentBanner() {
  if (!analyticsEnabled) return
  bannerOpen = true
  emit()
}

export function subscribeConsent(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function consentSnapshot() {
  return snapshot
}

function canSend() {
  // Effects of a page can run before the root Analytics effect: read the
  // stored consent lazily so early events are not lost.
  if (analyticsEnabled && consent === undefined) initAnalytics()
  return analyticsEnabled && gtagLoaded && consent === 'granted'
}

/** page_view with token-free page_location/page_referrer. */
export function trackPageView() {
  if (!canSend()) return
  const location = sanitizeUrl(window.location.href)
  if (location === lastLocation) return
  const referrer = lastLocation ?? sanitizeReferrer(document.referrer, window.location.origin)
  lastLocation = location
  // `set` so every later event on this page (scroll, outbound clicks...) also
  // carries the sanitized URL instead of the raw one.
  gtag('set', {
    page_location: location,
    page_referrer: referrer,
    content_group: contentGroup(window.location.pathname),
  })
  gtag('event', 'page_view')
}

type EventParams = Record<string, string | number | boolean | undefined>

/**
 * Sends a GA4 event when analytics consent was granted; otherwise a no-op.
 * Never pass names, emails, phones, free text or database IDs as params.
 */
export function track(eventName: string, params: EventParams = {}) {
  if (!canSend()) return
  gtag('event', eventName, params)
}

/**
 * Click delegation: any element with data-ga-event="name" sends that event,
 * with its other data-ga-* attributes as params (data-ga-cta-id → cta_id).
 */
export function trackDelegatedClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target : null
  const element = target?.closest<HTMLElement>('[data-ga-event]')
  if (!element) return
  const params: EventParams = {}
  for (const [key, value] of Object.entries(element.dataset)) {
    if (!key.startsWith('ga') || key === 'gaEvent' || value === undefined) continue
    const name = key.slice(2).replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, '')
    params[name] = value
  }
  track(element.dataset.gaEvent as string, params)
}
