import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { addComparison, addRecord, DB_NAME, deleteConnection, listComparisons, listRecords, updateRecordDiagnostic, updateRecordMetadata, createHistoryExport, groupRecordsByConnection, sanitizeMetadata, type MedicaoRegistro } from './historyStore'

const record = (id: string, timestamp: number, metadata?: MedicaoRegistro['userMetadata']): MedicaoRegistro => ({
  id, timestamp, download: 100, upload: 40, latency: 12, jitter: null, connectionType: null,
  connectionKind: 'wifi', server: 'Cloudflare', mode: 'rapido', userMetadata: metadata,
})

describe('history v3 local data', () => {
  it('keeps legacy records accessible in a deterministic group', () => {
    const groups = groupRecordsByConnection([record('old', 1), record('new', 2, { connectionId: 'casa', connectionName: 'Casa' })])
    expect(groups.map((group) => [group.id, group.name, group.records.length])).toEqual([['casa', 'Casa', 1], ['legacy:wifi', 'Conexão wifi', 1]])
  })

  it('only accepts bounded user metadata and never changes metrics', () => {
    expect(sanitizeMetadata({ connectionName: '  Casa  ', contractedSpeedMbps: 500, reportedProblem: ' lentidão ' })).toEqual({ connectionId: undefined, connectionName: 'Casa', contractedSpeedMbps: 500, reportedProblem: 'lentidão' })
    expect(sanitizeMetadata({ contractedSpeedMbps: -1 })).toEqual({ connectionId: undefined, connectionName: undefined, contractedSpeedMbps: undefined, reportedProblem: undefined })
  })

  it('exports only comparisons whose measurements are present', () => {
    const data = createHistoryExport([record('a', 1)], [{ id: 'valid', createdAt: 1, beforeId: 'a', afterId: 'a', mode: 'rapido' }, { id: 'orphan', createdAt: 2, beforeId: 'a', afterId: 'gone', mode: 'rapido' }])
    expect(data.schemaVersion).toBe(3)
    expect(data.comparisons.map((comparison) => comparison.id)).toEqual(['valid'])
  })

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

  it('serializes a diagnostic snapshot that arrives before its measurement write', async () => {
    await updateRecordDiagnostic('late-record', { conclusion: 'Leitura local', confidence: 'baixa', nextAction: 'Repetir', contractVersion: 1 })
    await addRecord(record('late-record', 4))
    expect((await listRecords()).find((item) => item.id === 'late-record')?.diagnostic).toEqual({ conclusion: 'Leitura local', confidence: 'baixa', nextAction: 'Repetir', contractVersion: 1 })
  })
})
