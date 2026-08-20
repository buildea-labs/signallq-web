// Marca da operadora. O projeto não tem nenhum asset de logo de operadora
// (verificado em `public/`), e a Issue #10 proíbe inventar marca — então o
// tratamento real hoje é tipográfico, limpo, com a inicial em selo.
//
// Quando existir asset oficial confiável no projeto, basta preencher
// `OPERATOR_LOGOS` com o caminho: a interface já está preparada para
// trocar o selo pelo logo sem mudar quem consome este componente. Nenhuma
// operadora é assumida aqui — a chave vem do que a API retornou.
const OPERATOR_LOGOS: Record<string, string> = {}

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
