import Link from 'next/link'
import Logo from '@/components/brand/Logo'

interface PublicNavProps {
  slug?: string
}

export default function PublicNav({ slug }: PublicNavProps) {
  return (
    <nav className="bg-white border-b border-[#E5E5E5] px-5 py-4 flex items-center justify-between gap-4">
      <Link href="/">
        <Logo size="md" />
      </Link>
      {slug && (
        <Link
          href={`/${slug}/reservar`}
          className="flex min-h-[44px] items-center justify-center rounded-sm bg-[#C8102E] px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors duration-150 hover:bg-[#111111] active:scale-[0.98]"
        >
          Reservar
        </Link>
      )}
    </nav>
  )
}
