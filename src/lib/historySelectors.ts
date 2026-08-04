// Agrupamento por conexão e seleções derivadas do Histórico local.
import type { MedicaoRegistro } from './measurementRepository'

export interface HistoryConnectionGroup {
  id: string
  name: string
  records: MedicaoRegistro[]
}

/** Agrupa sem ocultar registros antigos: os que não têm metadado ficam em um
 * grupo explícito, determinístico, baseado no tipo técnico detectado. */
export function groupRecordsByConnection(records: MedicaoRegistro[]): HistoryConnectionGroup[] {
  const groups = new Map<string, HistoryConnectionGroup>()
  for (const record of records) {
    const metadata = record.userMetadata
    const id = metadata?.connectionId || `legacy:${record.connectionKind || 'desconhecida'}`
    const name = metadata?.connectionName || (record.connectionKind ? `Conexão ${record.connectionKind}` : 'Medições sem local informado')
    const group = groups.get(id) || { id, name, records: [] }
    group.records.push(record)
    groups.set(id, group)
  }
  return [...groups.values()].sort((a, b) => b.records[0].timestamp - a.records[0].timestamp)
}

export type HistoryPeriodId = 'hoje' | 'ontem' | 'semana' | 'anteriores'

export interface HistoryPeriodGroup {
  id: HistoryPeriodId
  label: string
  records: MedicaoRegistro[]
}

const PERIOD_LABEL: Record<HistoryPeriodId, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  semana: 'Esta semana',
  anteriores: 'Anteriores',
}

// Ordem fixa de exibição — grupos vazios são omitidos, nunca aparece um
// cabeçalho sem itens embaixo (#73).
const PERIOD_ORDER: HistoryPeriodId[] = ['hoje', 'ontem', 'semana', 'anteriores']

const DIA_MS = 24 * 60 * 60 * 1000

function inicioDoDia(timestamp: number): number {
  const data = new Date(timestamp)
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime()
}

/** Bucket por dia-calendário local (não janela rolante de 24h): um teste às
 * 23h58 de hoje continua em "Hoje" minutos depois, em vez de pular para
 * "Ontem" só porque 24h se passaram. "Esta semana" é uma janela rolante de
 * 7 dias no total (hoje + 6), não semana ISO — decisão de produto registrada
 * na spec de UX do #73, não uma leitura literal da issue. */
function periodoDoRegistro(timestamp: number, agora: number): HistoryPeriodId {
  const diffDias = Math.floor((inicioDoDia(agora) - inicioDoDia(timestamp)) / DIA_MS)
  if (diffDias <= 0) return 'hoje'
  if (diffDias === 1) return 'ontem'
  if (diffDias <= 6) return 'semana'
  return 'anteriores'
}

/** Agrupa por período (Hoje/Ontem/Esta semana/Anteriores) para a lista do
 * Histórico (#73) — não substitui `groupRecordsByConnection`, que continua
 * servindo o autocomplete de conexões e a exclusão em massa por conexão no
 * `HistoryEditDialog`. Cada grupo vem ordenado por ordem cronológica
 * decrescente (mais recente primeiro), como os registros já chegam de
 * `listRecords`, mas reordenado aqui para não depender da ordem de entrada. */
export function groupRecordsByPeriod(records: MedicaoRegistro[], agora: number = Date.now()): HistoryPeriodGroup[] {
  const buckets = new Map<HistoryPeriodId, MedicaoRegistro[]>()
  for (const record of records) {
    const id = periodoDoRegistro(record.timestamp, agora)
    const list = buckets.get(id) ?? []
    list.push(record)
    buckets.set(id, list)
  }
  return PERIOD_ORDER.filter((id) => buckets.has(id)).map((id) => ({
    id,
    label: PERIOD_LABEL[id],
    records: [...buckets.get(id)!].sort((a, b) => b.timestamp - a.timestamp),
  }))
}
