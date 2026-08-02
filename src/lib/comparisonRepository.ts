// CRUD de comparações (antes/depois) entre duas medições do Histórico local.
import { COMPARISON_STORE, openDB } from './historyDatabase'
import type { SpeedTestMode } from './speedEngine'

/** Vínculo local entre duas medições; não contém diagnóstico nem é enviado ao servidor. */
export interface ComparacaoRegistro {
  id: string
  createdAt: number
  beforeId: string
  afterId: string
  mode: Exclude<SpeedTestMode, 'triplo'>
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
