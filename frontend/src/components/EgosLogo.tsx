interface EgosLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showSlogan?: boolean
}

export default function EgosLogo({ size = 'md', showSlogan = true }: EgosLogoProps) {
  const sizes = {
    sm: { e: 'text-xl',                    egos: 'text-xs tracking-[5px]',                          slogan: 'text-[7px] tracking-[2px]',           mt: '-mt-0.5' },
    md: { e: 'text-2xl sm:text-3xl',         egos: 'text-sm sm:text-lg tracking-[6px] sm:tracking-[8px]', slogan: 'text-[8px] sm:text-[9px] tracking-[3px]', mt: '-mt-1' },
    lg: { e: 'text-2xl sm:text-8xl',         egos: 'text-base sm:text-5xl tracking-[6px] sm:tracking-[20px]', slogan: 'text-[8px] sm:text-base tracking-[3px] sm:tracking-[8px]', mt: '-mt-1 sm:-mt-3' },
  }
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center leading-none">
      <span className={`font-bodoni font-normal bg-gradient-to-br from-gold-light via-gold to-gold-dark bg-clip-text text-transparent ${s.e}`} style={{ letterSpacing: '-2px' }}>
        E
      </span>
      <span className={`font-prata text-white uppercase ${s.egos} ${s.mt}`}>
        EGOS
      </span>
      {showSlogan && (
        <span className={`font-bodoni italic text-gold opacity-80 uppercase ${s.slogan}`}>
          Wear Your Truth
        </span>
      )}
    </div>
  )
}
