import React from 'react'

const OPERATOR_LOGOS: Record<string, string> = {
  CLARO: '/assets/providers/claro/logo.svg',
  NIO: '/assets/providers/nio/logo.png',
  BRISANET: '/assets/providers/brisanet/logo.svg',
  DESKTOP: '/assets/providers/desktop/logo.svg',
  ALGAR: '/assets/providers/algar/logo.svg',
}

interface ProviderLogoProps {
  /** Mesmo shape do OfferDto real: `{code, name}` — code indexa o logo, name é o texto exibido. */
  provider: { code: string; name: string }
}

export function ProviderLogo({ provider }: ProviderLogoProps) {
  const logo = OPERATOR_LOGOS[provider.code.toUpperCase()]

  const containerClasses = "flex items-center justify-start sm:justify-center w-[96px] h-[32px] sm:w-[112px] sm:h-[36px] shrink-0"

  if (logo) {
    return (
      <div className={containerClasses}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={logo} 
          alt={provider.name} 
          className="max-w-full max-h-full object-contain"
        />
      </div>
    )
  }

  // Fallback tipográfico
  return (
    <div className={containerClasses} style={{ justifyContent: 'flex-start' }}>
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center rounded-[10px] font-bold h-7 w-7 text-[13px] sm:h-9 sm:w-9 sm:text-[16px]"
          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}
        >
          {provider.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="label-large sm:title-medium truncate">{provider.name}</span>
      </span>
    </div>
  )
}
