// CRUD de medições e associação de diagnóstico. Porte 1:1 da parte de
// medições que antes vivia em shared/history-store.js do protótipo.
// Uma nova fonte de dado (US #89, ex. resultado de outra ferramenta) ganha
// seu próprio `xResultToRecord` aqui, ao lado de `resultToRecord`,
// reaproveitando addRecord/listRecords sem alterar o schema.
import type { ComparacaoRegistro } from './comparisonRepository'
import type { TipoRede } from './connection'
import { COMPARISON_STORE, openDB, STORE } from './historyDatabase'
import type { SpeedTestMode, SpeedTestResult } from './speedEngine'

// A avaliação ocorre após `setResult`, enquanto o IndexedDB ainda pode estar
// concluindo `addRecord`. Mantemos somente o snapshot da mesma sessão até o
// registro existir; nada é enviado nem sobrevive à recarga antes da medição.
const pendingDiagnostics = new Map<string, HistoryDiagnosticSnapshot>()

export interface MedicaoRegistro {
  id: string
  timestamp: number
  download: number
  upload: number
  latency: number
  jitter: number | null
  packetLossPercent?: number
  bufferbloatMs?: number
  stabilityScore?: number
  connectionType: string | null
  // Tipo de rede (wifi/celular/ethernet) no início do teste — distinto de
  // `connectionType` (effectiveType da Network Information API, ex. "4g"),
  // que não distingue Wi-Fi de dados móveis. Usado pelo filtro do Histórico
  // (Todos/Wi-Fi/Rede móvel). Registros salvos antes desta mudança ficam
  // `null` e só aparecem em "Todos".
  connectionKind: TipoRede | null
  server: string
  /** Ausente em registros anteriores à US #10; esses registros não são comparáveis. */
  mode?: SpeedTestMode
  /** Dados declarados pela pessoa usuária. Nunca substituem métricas medidas. */
  userMetadata?: HistoryUserMetadata
  diagnostic?: HistoryDiagnosticSnapshot
}

export interface HistoryUserMetadata {
  connectionId?: string
  connectionName?: string
  contractedSpeedMbps?: number
  reportedProblem?: string
}
export interface HistoryDiagnosticSnapshot {
  conclusion: string
  confidence: string
  nextAction: string
  contractVersion: number
}

export async function addRecord(record: MedicaoRegistro): Promise<MedicaoRegistro> {
  const db = await openDB()
  const diagnostic = record.diagnostic || pendingDiagnostics.get(record.id)
  const persisted = diagnostic ? { ...record, diagnostic } : record
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(persisted)
    tx.oncomplete = () => { pendingDiagnostics.delete(record.id); resolve(persisted) }
    tx.onerror = () => reject(tx.error)
  })
}

export async function listRecords(): Promise<MedicaoRegistro[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(((req.result as MedicaoRegistro[]) || []).sort((a, b) => b.timestamp - a.timestamp))
    req.onerror = () => reject(req.error)
  })
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE, COMPARISON_STORE], 'readwrite')
    tx.objectStore(STORE).delete(id)
    const comparisons = tx.objectStore(COMPARISON_STORE)
    const request = comparisons.getAll()
    request.onsuccess = () => {
      for (const comparison of request.result as ComparacaoRegistro[]) {
        if (comparison.beforeId === id || comparison.afterId === id) comparisons.delete(comparison.id)
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function updateRecordMetadata(id: string, metadata: HistoryUserMetadata): Promise<MedicaoRegistro | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const request = store.get(id)
    let updated: MedicaoRegistro | null = null
    request.onsuccess = () => {
      const record = request.result as MedicaoRegistro | undefined
      if (!record) return
      const clean = sanitizeMetadata(metadata)
      updated = { ...record, userMetadata: clean }
      store.put(updated)
    }
    request.onerror = () => reject(request.error)
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => resolve(updated)
  })
}

/** Persiste a leitura associada a uma medição sem alterar seus dados técnicos. */
export async function updateRecordDiagnostic(id: string, diagnostic: HistoryDiagnosticSnapshot): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const request = store.get(id)
    request.onsuccess = () => {
      const record = request.result as MedicaoRegistro | undefined
      if (record) store.put({ ...record, diagnostic })
      else pendingDiagnostics.set(id, diagnostic)
    }
    request.onerror = () => reject(request.error)
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => resolve()
  })
}

export function sanitizeMetadata(metadata: HistoryUserMetadata): HistoryUserMetadata {
  const text = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 120) : undefined
  const speed = typeof metadata.contractedSpeedMbps === 'number' && Number.isFinite(metadata.contractedSpeedMbps) && metadata.contractedSpeedMbps > 0
    ? metadata.contractedSpeedMbps : undefined
  return {
    connectionId: text(metadata.connectionId), connectionName: text(metadata.connectionName),
    contractedSpeedMbps: speed, reportedProblem: text(metadata.reportedProblem),
  }
}

export async function clearAll(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE, COMPARISON_STORE], 'readwrite')
    tx.objectStore(STORE).clear()
    tx.objectStore(COMPARISON_STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function resultToRecord(result: SpeedTestResult, connectionKind: TipoRede | null = null): MedicaoRegistro {
  return {
    id: result.id,
    timestamp: result.timestamp,
    download: result.download.mbps,
    upload: result.upload.mbps,
    latency: result.latency.ms,
    jitter: result.jitter ? result.jitter.ms : null,
    packetLossPercent: result.packetLoss.percent,
    bufferbloatMs: result.bufferbloat.ms,
    stabilityScore: result.stabilityScore,
    connectionType: result.connectionType,
    connectionKind,
    server: result.server,
    mode: result.mode,
  }
}
