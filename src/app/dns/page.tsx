"use client";
import { InstitutionalHero } from '@/components/institutional/InstitutionalFoundation'
import { DnsResolverRow } from '@/components/dns/DnsResolverRow'
import { NoticeBar } from '@/components/NoticeBar'
import { PageShell } from '@/components/PageShell'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useDnsCompare } from '@/hooks/useDnsCompare'
import { PAGE_META } from '@/lib/pageMetaCatalog'

// Comparação de resolvedores DNS públicos (issue #98) — substitui o
// placeholder "Em breve" de `/servidores-dns` (redirect 301 em
// `next.config.ts`). Medição real via DoH (ver `lib/dnsCompare.ts` para a
// explicação da limitação técnica: não dá para medir o resolvedor do
// usuário/ISP nem fazer consulta DNS raw a partir do navegador).
export default function DnsPage() {
  useDocumentMeta(PAGE_META['/dns'])
  const { state, run } = useDnsCompare()

  const fastestId = state.status === 'done'
    ? state.results
        .filter((result) => result.status === 'ok' && result.responseTimeMs != null)
        .reduce<{ id: string; time: number } | null>((best, result) => (
          !best || (result.responseTimeMs as number) < best.time ? { id: result.id, time: result.responseTimeMs as number } : best
        ), null)?.id
    : undefined

  return (
    <PageShell contentMax="640px" mobilePadding="pt-7 px-5 pb-10">
      <InstitutionalHero
        overline="Ferramenta"
        title="Comparar servidores DNS"
        summary="Mede o tempo de resposta dos resolvedores públicos da Cloudflare e do Google a partir do seu navegador, usando um domínio novo a cada teste para evitar cache."
      />

      <NoticeBar
        type="info"
        icon="info"
        title="Sobre esta medição:"
        message="o navegador não consegue medir o resolvedor DNS padrão do seu provedor (isso é definido pelo roteador/sistema operacional). O tempo mostrado inclui a conexão HTTPS até o resolvedor, não só a resolução DNS — por isso chamamos de tempo de resposta, não latência DNS pura."
      />

      <button
        type="button"
        onClick={run}
        disabled={state.status === 'running'}
        className="h-[44px] flex items-center gap-2 self-start px-5 rounded-[var(--radius-button,_999px)] bg-[color:var(--accent)] hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[20px] text-[color:var(--on-accent)]">dns</span>
        <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--on-accent)]">
          {state.status === 'running' ? 'Medindo…' : state.status === 'done' ? 'Medir novamente' : 'Comparar resolvedores'}
        </span>
      </button>

      {state.status === 'error' && (
        <NoticeBar type="error" icon="error" title="Não foi possível medir." message="Verifique sua conexão e tente novamente." />
      )}

      {state.status === 'done' && (
        <div className="w-full">
          {state.results.map((result) => (
            <DnsResolverRow key={result.id} result={result} fastest={result.id === fastestId} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
