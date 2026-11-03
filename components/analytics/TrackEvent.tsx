'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

/**
 * Sends one event when a server-rendered page mounts. With `onceKey`, it is
 * sent at most once per browser tab, so reloading the page does not repeat it.
 * `stripParams` removes private params (e.g. Stripe's session_id) from the URL.
 */
export default function TrackEvent({ name, onceKey, stripParams = [] }: { name: string; onceKey?: string; stripParams?: string[] }) {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (stripParams.some((param) => url.searchParams.has(param))) {
      for (const param of stripParams) url.searchParams.delete(param)
      window.history.replaceState(window.history.state, '', url)
    }

    if (onceKey) {
      try {
        if (window.sessionStorage.getItem(onceKey)) return
        window.sessionStorage.setItem(onceKey, '1')
      } catch {
        // Without sessionStorage, send at most once per page load.
      }
    }
    track(name)
  }, [name, onceKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
