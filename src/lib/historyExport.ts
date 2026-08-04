// Exportação do Histórico local (medições + comparações) para JSON.
import { DB_VERSION } from './historyDatabase'
import type { ComparacaoRegistro } from './comparisonRepository'
import type { MedicaoRegistro } from './measurementRepository'

/** Registro exportado: mesmos campos técnicos de `MedicaoRegistro`, mais
 * `timestampISO`, uma data legível por humanos ao lado do epoch técnico
 * (issue #76, critério "arquivo contém registros legíveis"). O campo técnico
 * não é removido — reimportação/ordenação continuam podendo usá-lo. */
export interface ExportedMedicaoRegistro extends MedicaoRegistro {
  timestampISO: string
}

export interface HistoryExport {
  schemaVersion: number
  exportedAt: string
  records: ExportedMedicaoRegistro[]
  comparisons: ComparacaoRegistro[]
}

export function createHistoryExport(records: MedicaoRegistro[], comparisons: ComparacaoRegistro[]): HistoryExport {
  const ids = new Set(records.map((record) => record.id))
  return {
    schemaVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    records: records.map((record) => ({ ...record, timestampISO: new Date(record.timestamp).toISOString() })),
    comparisons: comparisons.filter((comparison) => ids.has(comparison.beforeId) && ids.has(comparison.afterId)),
  }
}
