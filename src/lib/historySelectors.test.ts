import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { groupRecordsByConnection } from './historySelectors'
import type { MedicaoRegistro } from './measurementRepository'

const record = (id: string, timestamp: number, metadata?: MedicaoRegistro['userMetadata']): MedicaoRegistro => ({
  id, timestamp, download: 100, upload: 40, latency: 12, jitter: null, connectionType: null,
  connectionKind: 'wifi', server: 'Cloudflare', mode: 'rapido', userMetadata: metadata,
})

describe('historySelectors', () => {
  it('keeps legacy records accessible in a deterministic group', () => {
    const groups = groupRecordsByConnection([record('old', 1), record('new', 2, { connectionId: 'casa', connectionName: 'Casa' })])
    expect(groups.map((group) => [group.id, group.name, group.records.length])).toEqual([['casa', 'Casa', 1], ['legacy:wifi', 'Conexão wifi', 1]])
  })
})
