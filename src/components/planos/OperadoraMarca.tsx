// Marca da operadora. A Issue #10 proíbe inventar marca — fallback
// tipográfico limpo para qualquer `providerCode` sem asset local.
//
// CLARO: asset oficial por decisão registrada na issue #144 (comentário
// "Decisão de asset — Claro", buildea-labs/signallq-web#144) — fonte
// canônica https://mondrian.claro.com.br/brands/horizontal/default/claro.svg,
// copiado sem alteração (sem recolorir/redimensionar) para
// `public/assets/providers/claro/logo.svg`. Nenhuma outra operadora tem
// asset aprovado ainda — não adicionar sem decisão equivalente registrada.
const OPERATOR_LOGOS: Record<string, string> = {
  CLARO: '/assets/providers/claro/logo.svg',
}

interface OperadoraMarcaProps {
  provider: string
  size?: 'sm' | 'md'
}

export function OperadoraMarca({ provider, size = 'md' }: OperadoraMarcaProps) {
  const logo = OPERATOR_LOGOS[provider.toUpperCase()]
  const badge = size === 'md' ? 'h-9 w-9 text-[16px]' : 'h-7 w-7 text-[13px]'

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt={provider} className={size === 'md' ? 'h-9 w-auto' : 'h-7 w-auto'} />
  }

  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-[10px] font-bold ${badge}`}
        style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', fontFamily: 'var(--font-sans)' }}
      >
        {provider.trim().charAt(0).toUpperCase()}
      </span>
      <span className={size === 'md' ? 'title-medium' : 'label-large'}>{provider}</span>
    </span>
  )
}
