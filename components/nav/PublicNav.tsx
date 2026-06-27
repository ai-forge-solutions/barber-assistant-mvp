import Link from 'next/link'
import Logo from '@/components/brand/Logo'

interface PublicNavProps {
  slug?: string
}

export default function PublicNav({ slug }: PublicNavProps) {
  return (
    <nav className="bg-white border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between">
      <Link href="/">
        <Logo size="md" />
      </Link>
      {slug && (
        <Link
          href={`/${slug}/reservar`}
          className="font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase text-[#C8102E] hover:text-[#A50D24] transition-colors duration-150"
        >
          Reservar
        </Link>
      )}
    </nav>
  )
}
