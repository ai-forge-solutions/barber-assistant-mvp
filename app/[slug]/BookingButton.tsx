'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function BookingButton({ slug }: { slug: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleClick() {
    const { data: { user } } = await supabase.auth.getUser()
    const next = `/${slug}/reservar`
    if (!user) {
      router.push(`/auth/client?next=${encodeURIComponent(next)}`)
      return
    }

    const customerRes = await fetch('/api/customer-profile')
    const customerData = customerRes.ok ? await customerRes.json() : { complete: false }
    if (!customerData.complete) {
      router.push(`/auth/client/profile?next=${encodeURIComponent(next)}`)
      return
    }

    router.push(next)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[16px] tracking-[0.08em] uppercase px-6 py-4 rounded-sm hover:bg-[#A50D24] active:scale-[0.99] transition-colors duration-150 min-h-[52px]"
    >
      Reservar cita
    </button>
  )
}
