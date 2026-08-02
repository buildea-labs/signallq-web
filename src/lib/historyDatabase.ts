// Abertura, schema e migração do IndexedDB do Histórico local. Único módulo
// que sabe abrir o banco — os repositórios (measurementRepository,
// comparisonRepository) usam openDB()/STORE/COMPARISON_STORE daqui, nunca
// chamam indexedDB diretamente.
export const DB_NAME = 'signallq-site-history'
export const STORE = 'measurements'
/** v3 acrescenta índices para agrupamento local; registros v1/v2 continuam
 * válidos porque os metadados novos são opcionais. */
export const DB_VERSION = 3
export const COMPARISON_STORE = 'comparisons'

export function openDB(): Promise<IDBDatabase> {
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
