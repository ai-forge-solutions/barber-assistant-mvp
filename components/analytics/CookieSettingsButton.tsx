'use client'

import { analyticsEnabled, openConsentBanner } from '@/lib/analytics'

/** Reopens the cookie banner. Hidden when analytics is not configured. */
export default function CookieSettingsButton({ className, children = 'Cookies' }: { className?: string; children?: string }) {
  if (!analyticsEnabled) return null
  return (
    <button type="button" onClick={openConsentBanner} className={className}>
      {children}
    </button>
  )
}
