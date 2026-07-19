interface LogoProps {
  /** Use light variant (white text) for dark navbars */
  light?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'text-[18px]',
  md: 'text-[22px]',
  lg: 'text-[28px]',
}

export default function Logo({ light = false, size = 'md' }: LogoProps) {
  return (
    <span
      className={`font-['Rye'] tracking-[0.04em] ${sizeMap[size]} ${light ? 'text-white' : 'text-[#111111]'}`}
    >
      TURNO<span className="text-[#C8102E]">.</span>
    </span>
  )
}
