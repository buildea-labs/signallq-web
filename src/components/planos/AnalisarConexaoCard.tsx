import Link from 'next/link'
import { IconeSelo } from './Icone'

// Chamada de análise da conexão (referência 02) — um dos poucos lugares em
// que o card tem função comercial real. Link para o teste existente, não
// uma ação de dados: só "Usar minha medição" (no hero) aplica
// `currentConnection`, e só por clique explícito.
export function AnalisarConexaoCard() {
  return (
    <div
      className="flex w-full flex-wrap items-center justify-between gap-5 rounded-[20px] p-6"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--depth-level2-shadow)' }}
    >
      <div className="flex items-start gap-4 sm:items-center">
        <IconeSelo
          name="monitoring"
          box={52}
          size={26}
          radius="16px"
          background="color-mix(in srgb, var(--accent) 10%, transparent)"
          color="var(--accent)"
        />
        <div className="flex flex-col gap-1">
          <span className="title-large">Já tem internet?</span>
          <span className="body-large max-w-[520px] text-[color:var(--text-secondary)]">
            Analisar sua conexão atual ajuda a entender se ela está adequada para o seu uso e melhora a recomendação.
          </span>
        </div>
      </div>
      <Link
        href="/"
        className="label-large flex h-11 shrink-0 items-center rounded-[var(--radius-pill)] border px-5 no-underline"
        style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
      >
        Analisar minha conexão
      </Link>
    </div>
  )
}
