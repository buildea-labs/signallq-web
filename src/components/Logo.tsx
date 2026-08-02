import Image from 'next/image'

// Lockup oficial da marca (brand/README.md) — nunca recriar em CSS/SVG à mão.
// Variante escolhida pelo tema atual (claro/escuro), altura controlável.
interface LogoProps {
  isDark?: boolean
  height?: number
  className?: string
}

export function Logo({ isDark = false, height = 32, className }: LogoProps) {
  const src = isDark ? '/brand/signallq-lockup-dark-bg.png' : '/brand/signallq-lockup-light-bg.png'
  const aspectRatio = 176 / 32
  const width = Math.round(height * aspectRatio)
  return <Image src={src} alt="SignallQ" width={width} height={height} className={className} />
}
