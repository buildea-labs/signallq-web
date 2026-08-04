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

  // #76, item 5: o único ajuste recomendado ao shape de exportação foi
  // acrescentar um timestamp legível ao lado do epoch técnico, sem remover
  // nenhum campo (o teste acima continua valendo sem alterações).
  it('adiciona timestampISO legível a cada registro, sem remover o timestamp técnico em epoch', () => {
    const data = createHistoryExport([record('a', 1735689600000)], [])
    expect(data.records[0].timestamp).toBe(1735689600000)
    expect(data.records[0].timestampISO).toBe(new Date(1735689600000).toISOString())
  })

  it('não vaza nenhum campo além dos já existentes de MedicaoRegistro mais timestampISO', () => {
    const data = createHistoryExport([record('a', 1, { connectionName: 'Casa' })], [])
    expect(Object.keys(data.records[0]).sort()).toEqual(
      ['connectionKind', 'connectionType', 'download', 'id', 'jitter', 'latency', 'mode', 'server', 'timestamp', 'timestampISO', 'upload', 'userMetadata'].sort()
    )
  })
})
