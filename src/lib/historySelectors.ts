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
