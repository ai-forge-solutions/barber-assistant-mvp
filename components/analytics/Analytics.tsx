'use client'

import { Suspense, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  analyticsEnabled,
  consentSnapshot,
  initAnalytics,
  setConsent,
  subscribeConsent,
  trackDelegatedClick,
  trackPageView,
} from '@/lib/analytics'

const SERVER_SNAPSHOT = { bannerOpen: false, consent: undefined }

function PageViews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useEffect(() => {
    trackPageView()
  }, [pathname, search])

  return null
}

function ConsentBanner() {
  const { bannerOpen } = useSyncExternalStore(subscribeConsent, consentSnapshot, () => SERVER_SNAPSHOT)
  if (!bannerOpen) return null

  // Reject and accept share the same style and size: the AEPD requires that
  // rejecting is as easy and visible as accepting.
  const button =
    "min-h-[44px] flex-1 rounded-sm border-2 border-[#111111] bg-white px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#111111] transition-colors duration-150 hover:bg-[#111111] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3A6B]"

  return (
    <section
      role="region"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-sm border-2 border-[#111111] bg-white px-5 py-4 print:hidden"
    >
      <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#111111]">Cookies</p>
      <p className="mt-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">
        Usamos Google Analytics para saber qué páginas funcionan y dónde se atascan las reservas. Solo se activa si aceptas. Las cookies de sesión y seguridad son necesarias y no dependen de esto.{' '}
        <Link href="/privacidad#cookies" className="text-[#1A3A6B] underline underline-offset-2">Más información</Link>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" className={button} onClick={() => setConsent('denied')}>
          Rechazar
        </button>
        <button type="button" className={button} onClick={() => setConsent('granted')}>
          Aceptar
        </button>
      </div>
    </section>
  )
}

/** GA4 + consent banner. Renders nothing when the measurement ID is missing. */
export default function Analytics() {
  useEffect(() => {
    if (!analyticsEnabled) return
    initAnalytics()
    document.addEventListener('click', trackDelegatedClick)
    return () => document.removeEventListener('click', trackDelegatedClick)
  }, [])

  if (!analyticsEnabled) return null

  return (
    <>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
      <ConsentBanner />
    </>
  )
}
