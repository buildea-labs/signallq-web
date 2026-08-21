import type { CSSProperties } from 'react'

// A regra global `.material-symbols-outlined` (layout.css) fixa
// `font-size: 24px` e `display: inline-block`. Ela vence as utilities do
// Tailwind na cascata (mesma especificidade, declarada depois), então
// `text-[18px]` é ignorado e `flex items-center justify-center` no MESMO
// elemento não centraliza nada — o glifo encosta no canto de uma caixa
// grande demais (achado visual da revisão de /planos).
//
// Estes dois helpers são a única forma de usar ícone dentro de /planos:
// o tamanho vem por `style` inline (vence a folha de estilo) e a caixa é
// sempre um elemento SEPARADO do elemento que carrega a fonte de ícones.

interface IconeProps {
  name: string
  /** Tamanho do glifo em px. Vai por style inline de propósito. */
  size?: number
  color?: string
  className?: string
  style?: CSSProperties
}

export function Icone({ name, size = 20, color, className = '', style }: IconeProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, lineHeight: 1, color, ...style }}
    >
      {name}
    </span>
  )
}

interface IconeSeloProps {
  name: string
  /** Lado da caixa em px. */
  box?: number
  /** Tamanho do glifo em px — mantenha ~50% da caixa para não desproporcionar. */
  size?: number
  radius?: string
  background?: string
  color?: string
  border?: string
}

/** Ícone centralizado dentro de uma caixa/selo. A caixa é o elemento de
 * fora (flex de verdade); o glifo vive dentro dela. */
export function IconeSelo({ name, box = 48, size = 24, radius = '16px', background, color, border }: IconeSeloProps) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: box, height: box, borderRadius: radius, background, border, color }}
    >
      <Icone name={name} size={size} />
    </span>
  )
}
