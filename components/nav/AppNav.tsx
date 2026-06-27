import Logo from '@/components/brand/Logo'

interface AppNavProps {
  dayLabel?: string
  dateLabel?: string
}

export default function AppNav({ dayLabel, dateLabel }: AppNavProps) {
  return (
    <nav className="bg-[#111111] px-5 py-3.5 flex items-center justify-between sticky top-0 z-40">
      <Logo light size="md" />
      {(dayLabel || dateLabel) && (
        <span className="font-['Oswald'] font-semibold text-[12px] text-[#999999] uppercase tracking-[0.1em]">
          {dayLabel}{dayLabel && dateLabel ? ' · ' : ''}{dateLabel}
        </span>
      )}
    </nav>
  )
}
