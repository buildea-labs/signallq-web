// Histórico local — IndexedDB. Nenhuma sincronização entre aparelhos, nenhum
// envio para o servidor (fica só neste navegador). Porte 1:1 de
// shared/history-store.js do protótipo — implementação real já usava
// IndexedDB, não localStorage (README do protótipo mencionava localStorage,
// era o texto que estava desatualizado, não o código).
import type { TipoRede } from './connection'
import type { SpeedTestMode, SpeedTestResult } from './speedEngine'

export const DB_NAME = 'signallq-site-history'
const STORE = 'measurements'
/** v3 acrescenta índices para agrupamento local; registros v1/v2 continuam
 * válidos porque os metadados novos são opcionais. */
export const DB_VERSION = 3
const COMPARISON_STORE = 'comparisons'
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

export interface HistoryConnectionGroup {
  id: string
  name: string
  records: MedicaoRegistro[]
}

export interface HistoryExport {
  schemaVersion: number
  exportedAt: string
  records: MedicaoRegistro[]
  comparisons: ComparacaoRegistro[]
}

/** Vínculo local entre duas medições; não contém diagnóstico nem é enviado ao servidor. */
export interface ComparacaoRegistro {
  id: string
  createdAt: number
  beforeId: string
  afterId: string
  mode: Exclude<SpeedTestMode, 'triplo'>
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexeddb-unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
      }
      if (!db.objectStoreNames.contains(COMPARISON_STORE)) {
        const store = db.createObjectStore(COMPARISON_STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
        store.createIndex('beforeId', 'beforeId')
        store.createIndex('afterId', 'afterId')
      }
      // IndexedDB mantém os objetos antigos sem transformação destrutiva. Os
      // campos adicionados são opcionais, portanto abrir v1/v2 em v3 é
      // reversível para a leitura: a migração não reescreve nenhuma medição.
      const measurements = req.transaction!.objectStore(STORE)
      if (!measurements.indexNames.contains('connectionId')) {
        measurements.createIndex('connectionId', 'userMetadata.connectionId')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('indexeddb-open-failed'))
  })
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

export function sanitizeMetadata(metadata: HistoryUserMetadata): HistoryUserMetadata {
  const text = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 120) : undefined
  const speed = typeof metadata.contractedSpeedMbps === 'number' && Number.isFinite(metadata.contractedSpeedMbps) && metadata.contractedSpeedMbps > 0
    ? metadata.contractedSpeedMbps : undefined
  return {
    connectionId: text(metadata.connectionId), connectionName: text(metadata.connectionName),
    contractedSpeedMbps: speed, reportedProblem: text(metadata.reportedProblem),
  }
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

export function createHistoryExport(records: MedicaoRegistro[], comparisons: ComparacaoRegistro[]): HistoryExport {
  const ids = new Set(records.map((record) => record.id))
  return { schemaVersion: DB_VERSION, exportedAt: new Date().toISOString(), records,
    comparisons: comparisons.filter((comparison) => ids.has(comparison.beforeId) && ids.has(comparison.afterId)) }
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

export async function addComparison(record: ComparacaoRegistro): Promise<ComparacaoRegistro> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COMPARISON_STORE, 'readwrite')
    tx.objectStore(COMPARISON_STORE).put(record)
    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error)
  })
}

export async function listComparisons(): Promise<ComparacaoRegistro[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COMPARISON_STORE, 'readonly')
    const req = tx.objectStore(COMPARISON_STORE).getAll()
    req.onsuccess = () => resolve(((req.result as ComparacaoRegistro[]) || []).sort((a, b) => b.createdAt - a.createdAt))
    req.onerror = () => reject(req.error)
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
