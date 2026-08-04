import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { addRecord, getRecordById, listRecords, sanitizeMetadata, updateRecordDiagnostic, type MedicaoRegistro } from './measurementRepository'

const record = (id: string, timestamp: number, metadata?: MedicaoRegistro['userMetadata']): MedicaoRegistro => ({
  id, timestamp, download: 100, upload: 40, latency: 12, jitter: null, connectionType: null,
  connectionKind: 'wifi', server: 'Cloudflare', mode: 'rapido', userMetadata: metadata,
})

describe('measurementRepository', () => {
  it('only accepts bounded user metadata and never changes metrics', () => {
    expect(sanitizeMetadata({ connectionName: '  Casa  ', contractedSpeedMbps: 500, reportedProblem: ' lentidão ' })).toEqual({ connectionId: undefined, connectionName: 'Casa', contractedSpeedMbps: 500, reportedProblem: 'lentidão' })
    expect(sanitizeMetadata({ contractedSpeedMbps: -1 })).toEqual({ connectionId: undefined, connectionName: undefined, contractedSpeedMbps: undefined, reportedProblem: undefined })
  })

  it('serializes a diagnostic snapshot that arrives before its measurement write', async () => {
    await updateRecordDiagnostic('late-record', { conclusion: 'Leitura local', confidence: 'baixa', nextAction: 'Repetir', contractVersion: 1 })
    await addRecord(record('late-record', 4))
    expect((await listRecords()).find((item) => item.id === 'late-record')?.diagnostic).toEqual({ conclusion: 'Leitura local', confidence: 'baixa', nextAction: 'Repetir', contractVersion: 1 })
  })

  it('getRecordById finds a persisted record by id, and returns null when it does not exist (#74)', async () => {
    await addRecord(record('detail-record', 10))
    expect((await getRecordById('detail-record'))?.id).toBe('detail-record')
    expect(await getRecordById('never-existed')).toBeNull()
  })
})
