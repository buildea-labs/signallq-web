// Exportação do Histórico local (medições + comparações) para JSON.
import { DB_VERSION } from './historyDatabase'
import type { ComparacaoRegistro } from './comparisonRepository'
import type { MedicaoRegistro } from './measurementRepository'

export interface HistoryExport {
  schemaVersion: number
  exportedAt: string
  records: MedicaoRegistro[]
  comparisons: ComparacaoRegistro[]
}

export function createHistoryExport(records: MedicaoRegistro[], comparisons: ComparacaoRegistro[]): HistoryExport {
  const ids = new Set(records.map((record) => record.id))
  return { schemaVersion: DB_VERSION, exportedAt: new Date().toISOString(), records,
    comparisons: comparisons.filter((comparison) => ids.has(comparison.beforeId) && ids.has(comparison.afterId)) }
}
