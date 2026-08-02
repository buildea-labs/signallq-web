import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { addComparison, listComparisons } from './comparisonRepository'
import { DB_NAME } from './historyDatabase'
import { deleteConnection } from './historySelectors'
import { addRecord, listRecords, updateRecordMetadata, type MedicaoRegistro } from './measurementRepository'

const record = (id: string, timestamp: number, metadata?: MedicaoRegistro['userMetadata']): MedicaoRegistro => ({
  id, timestamp, download: 100, upload: 40, latency: 12, jitter: null, connectionType: null,
  connectionKind: 'wifi', server: 'Cloudflare', mode: 'rapido', userMetadata: metadata,
})

describe('historyDatabase migration', () => {
  it('migrates a v1 database and persists metadata and cascading connection deletes', async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => { const store = request.result.createObjectStore('measurements', { keyPath: 'id' }); store.createIndex('timestamp', 'timestamp'); store.put(record('legacy-db', 1)) }
      request.onsuccess = () => { request.result.close(); resolve() }
      request.onerror = () => reject(request.error)
    })
    expect((await listRecords()).map((item) => item.id)).toContain('legacy-db')
    await addRecord(record('before', 2, { connectionId: 'casa', connectionName: 'Casa' }))
    await addRecord(record('after', 3, { connectionId: 'casa', connectionName: 'Casa' }))
    await updateRecordMetadata('after', { connectionId: 'casa', connectionName: 'Casa', reportedProblem: 'queda' })
    await addComparison({ id: 'pair', createdAt: 3, beforeId: 'before', afterId: 'after', mode: 'rapido' })
    await deleteConnection('casa')
    expect((await listRecords()).map((item) => item.id)).toEqual(['legacy-db'])
    expect(await listComparisons()).toEqual([])
  })
})
