import Link from 'next/link'
import { MODE_LABEL } from '../home/homeCopy'
import { classifyDownload } from '../../lib/classification'
import { iconeConexao, labelConexao } from '../../lib/connection'
import { formatarTempoRelativo } from '../../lib/relativeTime'
import type { MedicaoRegistro } from '../../lib/measurementRepository'

const NIVEL_COR: Record<string, string> = { success: 'var(--success)', warning: 'var(--warning)', error: 'var(--error)', indisponivel: 'var(--text-tertiary)' }

const PROBLEMA_MAX = 48

function truncarProblema(texto: string): string {
  return texto.length > PROBLEMA_MAX ? `${texto.slice(0, PROBLEMA_MAX - 1).trimEnd()}…` : texto
}

interface HistoryRecordCardProps {
  record: MedicaoRegistro
  /** Modo de seleção do #75: quando ativo, a linha vira um alvo marcável
   * (checkbox real) em vez de um link de navegação — a lista existente é o
   * próprio "picker" de comparação, sem tela nova. */
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
}

// Item de lista do Histórico (#73): reconhecível sem expor todas as
// métricas — só o resultado principal (download), horário, modo (quando
// conhecido) e o problema informado (quando existir) aparecem. Nenhuma ação
// (editar/compartilhar/excluir) vive mais aqui: a linha inteira é um único
// alvo de navegação (link semântico, focável e ativável por teclado) para o
// detalhe do teste (#74) — ou, em modo de seleção (#75), um único alvo
// marcável para a comparação manual.
export function HistoryRecordCard({ record, selectable = false, selected = false, onToggleSelect }: HistoryRecordCardProps) {
  const verdict = classifyDownload(record.download)
  const modeLabel = record.mode ? MODE_LABEL[record.mode] : undefined
  const reportedProblem = record.userMetadata?.reportedProblem?.trim()

  const content = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1">
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 14, color: NIVEL_COR[verdict.nivel] }}>
            arrow_downward
          </span>
          <span className="label-large" style={{ color: NIVEL_COR[verdict.nivel] }}>
            {record.download.toFixed(1)} Mbps
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          <span>{formatarTempoRelativo(record.timestamp)}</span>
          {modeLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span>{modeLabel}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-0.5">
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 13 }}>
              {iconeConexao(record.connectionKind)}
            </span>
            {labelConexao(record.connectionKind)}
            {record.userMetadata?.connectionName ? ` · ${record.userMetadata.connectionName}` : ''}
          </span>
        </div>

        {reportedProblem && (
          <div className="truncate text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {truncarProblema(reportedProblem)}
          </div>
        )}
      </div>
    </>
  )

  const sharedStyle = { background: 'var(--bg-secondary)', boxShadow: '0 8px 20px rgba(0,0,0,.14)', color: 'inherit' } as const

  if (selectable) {
    return (
      <label
        className="flex cursor-pointer items-center gap-3 rounded-2xl p-3.5"
        style={selected ? { ...sharedStyle, outline: '2px solid var(--accent)', outlineOffset: 2 } : sharedStyle}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(record.id)}
          aria-label={`Selecionar teste de ${formatarTempoRelativo(record.timestamp)} para comparar`}
        />
        {content}
      </label>
    )
  }

  return (
    <Link
      href={`/historico/${record.id}`}
      className="flex items-center gap-3 rounded-2xl p-3.5 no-underline"
      style={sharedStyle}
    >
      {content}
      <span aria-hidden="true" className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: 'var(--text-tertiary)' }}>
        chevron_right
      </span>
    </Link>
  )
}
