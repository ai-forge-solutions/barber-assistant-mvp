'use client'

import { useRouter } from 'next/navigation'

interface LoginButtonProps {
  next?: string
  label?: string
  variant?: 'primary' | 'secondary'
}

export default function LoginButton({ next = '/dashboard', label = 'Continuar', variant = 'primary' }: LoginButtonProps) {
  const router = useRouter()

  const handleLogin = () => {
    router.push(`/auth/barber?next=${encodeURIComponent(next)}`)
  }

  if (variant === 'secondary') {
    return (
      <button
        onClick={handleLogin}
        className="bg-transparent text-[#111111] border-2 border-[#111111] font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#F5F5F5] active:scale-[0.98] transition-colors duration-150 min-h-[44px]"
      >
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogin}
      className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors duration-150 min-h-[44px]"
    >
      {label}
    </button>
  )
}
