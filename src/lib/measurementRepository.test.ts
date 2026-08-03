import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { addComparison, listComparisons } from './comparisonRepository'
import {
  addRecord,
  clearAll,
  deleteConnection,
  deleteRecord,
  getRecordById,
  listRecords,
  sanitizeMetadata,
  updateRecordDiagnostic,
  type MedicaoRegistro,
} from './measurementRepository'

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

// #76: exclusão individual, exclusão por conexão e limpeza total tinham
// cobertura zero apesar de já existirem. Testes de integração real contra o
// IndexedDB fake, não smoke tests — cada um verifica o estado persistido
// depois da operação, incluindo o efeito colateral de limpar comparações
// órfãs que `deleteRecord`/`deleteConnection` já implementam.
describe('measurementRepository — exclusão e limpeza (#76)', () => {
  it('deleteRecord remove a medição e qualquer comparação que a referencie (antes ou depois), preservando o resto', async () => {
    await addRecord(record('r1', 1))
    await addRecord(record('r2', 2))
    await addRecord(record('r3', 3))
    await addComparison({ id: 'c1', createdAt: 1, beforeId: 'r1', afterId: 'r2', mode: 'rapido' })
    await addComparison({ id: 'c2', createdAt: 2, beforeId: 'r2', afterId: 'r3', mode: 'rapido' })

    await deleteRecord('r2')

    const remainingIds = (await listRecords()).map((r) => r.id)
    expect(remainingIds).toContain('r1')
    expect(remainingIds).toContain('r3')
    expect(remainingIds).not.toContain('r2')
    expect(await getRecordById('r2')).toBeNull()
    // c1 (afterId=r2) e c2 (beforeId=r2) ficam órfãs — ambas removidas.
    expect(await listComparisons()).toEqual([])
  })

  it('deleteRecord com id inexistente não lança e não afeta os registros existentes', async () => {
    await addRecord(record('keep-1', 20))
    await expect(deleteRecord('nunca-existiu')).resolves.toBeUndefined()
    expect((await listRecords()).map((r) => r.id)).toContain('keep-1')
  })

  it('deleteConnection remove todos os registros de uma conexão e as comparações órfãs, preservando outras conexões', async () => {
    await addRecord(record('a1', 30, { connectionId: 'casa', connectionName: 'Casa' }))
    await addRecord(record('a2', 31, { connectionId: 'casa', connectionName: 'Casa' }))
    await addRecord(record('b1', 32, { connectionId: 'trabalho', connectionName: 'Trabalho' }))
    await addComparison({ id: 'c-casa', createdAt: 1, beforeId: 'a1', afterId: 'a2', mode: 'rapido' })
    await addComparison({ id: 'c-trabalho', createdAt: 2, beforeId: 'b1', afterId: 'b1', mode: 'rapido' })

    await deleteConnection('casa')

    const remaining = await listRecords()
    expect(remaining.some((r) => r.id === 'a1' || r.id === 'a2')).toBe(false)
    expect(remaining.some((r) => r.id === 'b1')).toBe(true)
    const comparisons = await listComparisons()
    expect(comparisons.map((c) => c.id)).toEqual(['c-trabalho'])
  })

  it('clearAll esvazia medições e comparações por completo', async () => {
    await addRecord(record('x1', 40))
    await addRecord(record('x2', 41))
    await addComparison({ id: 'cx', createdAt: 1, beforeId: 'x1', afterId: 'x2', mode: 'rapido' })

    await clearAll()

    expect(await listRecords()).toEqual([])
    expect(await listComparisons()).toEqual([])
  })
})
