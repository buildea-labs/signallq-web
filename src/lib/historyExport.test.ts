import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { createHistoryExport } from './historyExport'
import type { MedicaoRegistro } from './measurementRepository'

const record = (id: string, timestamp: number, metadata?: MedicaoRegistro['userMetadata']): MedicaoRegistro => ({
  id, timestamp, download: 100, upload: 40, latency: 12, jitter: null, connectionType: null,
  connectionKind: 'wifi', server: 'Cloudflare', mode: 'rapido', userMetadata: metadata,
})

describe('historyExport', () => {
  it('exports only comparisons whose measurements are present', () => {
    const data = createHistoryExport([record('a', 1)], [{ id: 'valid', createdAt: 1, beforeId: 'a', afterId: 'a', mode: 'rapido' }, { id: 'orphan', createdAt: 2, beforeId: 'a', afterId: 'gone', mode: 'rapido' }])
    expect(data.schemaVersion).toBe(3)
    expect(data.comparisons.map((comparison) => comparison.id)).toEqual(['valid'])
  })
})
