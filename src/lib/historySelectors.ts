// Agrupamento por conexão e seleções derivadas do Histórico local.
import type { ComparacaoRegistro } from './comparisonRepository'
import { COMPARISON_STORE, openDB, STORE } from './historyDatabase'
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

/** Apaga uma conexão declarada e todos os vínculos antes/depois que a citam. */
export async function deleteConnection(connectionId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE, COMPARISON_STORE], 'readwrite')
    const measurements = tx.objectStore(STORE)
    const request = measurements.getAll()
    request.onsuccess = () => {
      const ids = new Set((request.result as MedicaoRegistro[])
        .filter((record) => record.userMetadata?.connectionId === connectionId).map((record) => record.id))
      ids.forEach((id) => measurements.delete(id))
      const comparisons = tx.objectStore(COMPARISON_STORE)
      const comparisonRequest = comparisons.getAll()
      comparisonRequest.onsuccess = () => {
        for (const comparison of comparisonRequest.result as ComparacaoRegistro[]) {
          if (ids.has(comparison.beforeId) || ids.has(comparison.afterId)) comparisons.delete(comparison.id)
        }
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
