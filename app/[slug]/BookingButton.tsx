'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function BookingButton({ slug }: { slug: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleClick() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      router.push(`/${slug}/reservar`)
    } else {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/${slug}/reservar`,
        },
      })
    }
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
