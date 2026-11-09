'use client'

import { useRouter } from 'next/navigation'

export default function PricingBackButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      aria-label="Volver atrás"
      title="Volver atrás"
      onClick={() => window.history.length > 1 ? router.back() : router.push('/')}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm text-[#111111] hover:bg-[#E5E5E5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3A6B]"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m12 5-7 7 7 7M5 12h14" />
      </svg>
    </button>
  )
}
