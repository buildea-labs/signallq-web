import type { GameLatencyResult } from '@/lib/gameLatency'

const STATUS_LABEL: Record<GameLatencyResult['status'], string> = {
  ok: 'Respondeu',
  timeout: 'Sem resposta (timeout)',
  error: 'Falhou',
}

const STATUS_COLOR: Record<GameLatencyResult['status'], string> = {
  ok: 'var(--success)',
  timeout: 'var(--warning)',
  error: 'var(--error)',
}

interface GameLatencyRowProps {
  result: GameLatencyResult
  fastest: boolean
}

// Linha de resultado por empresa — mesmo vocabulário visual de
// `DnsResolverRow`: hairline, sem card, sem fundo/sombra/raio extra.
export function GameLatencyRow({ result, fastest }: GameLatencyRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)] last:border-b-0">
      <div className="flex flex-col gap-[2px]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--text-primary)]">
            {result.label}
          </span>
          <span className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
            {result.company}
          </span>
          {fastest && (
            <span className="rounded-full py-[1px] px-[8px] font-medium text-[11px] leading-[1.6] text-[color:var(--on-accent)] bg-[color:var(--accent)]">
              Mais rápido
            </span>
          )}
        </div>
        <span className="font-normal text-[12px] leading-[1.33]" style={{ color: STATUS_COLOR[result.status] }}>
          {STATUS_LABEL[result.status]}
        </span>
      </div>
      <div className="font-bold text-[22px] leading-[1.1] text-[color:var(--text-primary)] tabular-nums">
        {result.responseTimeMs != null ? `${result.responseTimeMs} ms` : '—'}
      </div>
    </div>
  )
}
