"use client";
import { InstitutionalHero } from '@/components/institutional/InstitutionalFoundation'
import { GameLatencyRow } from '@/components/jogos/GameLatencyRow'
import { NoticeBar } from '@/components/NoticeBar'
import { PageShell } from '@/components/PageShell'
import { useGameLatency } from '@/hooks/useGameLatency'

// Medição real de latência de infraestrutura de jogos (issue #99) —
// substitui o placeholder "Em breve" de `/modo-gamer` (redirect 301 em
// `next.config.ts`). Ver `lib/gameLatency.ts` para a explicação da
// limitação técnica: navegador não faz ping ICMP nem mede o servidor de
// partida real de um jogo, só o tempo de resposta até a infraestrutura
// pública de primeira parte dessas empresas.
export function JogosClient() {
  const { state, run } = useGameLatency()

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
        title="Latência até servidores de jogos"
        summary="Mede o tempo de resposta até a infraestrutura pública da Steam, Riot Games e Xbox Live a partir do seu navegador."
      />

      <NoticeBar
        type="info"
        icon="info"
        title="Sobre esta medição:"
        message="o navegador não consegue medir ping (ICMP) nem o servidor de partida real de um jogo específico — essa API não existe na Web. O tempo mostrado é a resposta até a infraestrutura pública dessas empresas (CDN de assets e status de serviço), um indicador de proximidade de rede, não o ping dentro da partida."
      />

      <button
        type="button"
        onClick={run}
        disabled={state.status === 'running'}
        className="h-[44px] flex items-center gap-2 self-start px-5 rounded-[var(--radius-button,_999px)] bg-[color:var(--accent)] hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[color:var(--on-accent)]">sports_esports</span>
        <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--on-accent)]">
          {state.status === 'running' ? 'Medindo…' : state.status === 'done' ? 'Medir novamente' : 'Medir latência'}
        </span>
      </button>

      {state.status === 'error' && (
        <NoticeBar type="error" icon="error" title="Não foi possível medir." message="Verifique sua conexão e tente novamente." />
      )}

      {state.status === 'done' && (
        <div className="w-full">
          {state.results.map((result) => (
            <GameLatencyRow key={result.id} result={result} fastest={result.id === fastestId} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
