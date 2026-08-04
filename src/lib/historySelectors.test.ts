import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { groupRecordsByConnection, groupRecordsByPeriod } from './historySelectors'
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

  describe('groupRecordsByPeriod (#73)', () => {
    const DIA = 24 * 60 * 60 * 1000
    const AGORA = new Date(2026, 7, 3, 15, 0, 0).getTime() // 2026-08-03 15:00 local

    it('bucketiza por dia-calendário: hoje, ontem, esta semana (2-6 dias) e anteriores (7+)', () => {
      const records = [
        record('hoje', AGORA - 60_000),
        record('ontem', AGORA - DIA),
        record('semana-2d', AGORA - 2 * DIA),
        record('semana-6d', AGORA - 6 * DIA),
        record('antigo-7d', AGORA - 7 * DIA),
        record('antigo-30d', AGORA - 30 * DIA),
      ]
      const groups = groupRecordsByPeriod(records, AGORA)
      expect(groups.map((g) => g.id)).toEqual(['hoje', 'ontem', 'semana', 'anteriores'])
      expect(groups.find((g) => g.id === 'hoje')?.records.map((r) => r.id)).toEqual(['hoje'])
      expect(groups.find((g) => g.id === 'ontem')?.records.map((r) => r.id)).toEqual(['ontem'])
      expect(groups.find((g) => g.id === 'semana')?.records.map((r) => r.id)).toEqual(['semana-2d', 'semana-6d'])
      expect(groups.find((g) => g.id === 'anteriores')?.records.map((r) => r.id)).toEqual(['antigo-7d', 'antigo-30d'])
    })

    it('usa o dia-calendário local, não uma janela rolante de 24h: 23h58 de hoje continua em "hoje"', () => {
      const inicioDoDia = new Date(2026, 7, 3, 0, 0, 0).getTime()
      const tarde = new Date(2026, 7, 3, 23, 58, 0).getTime()
      const groups = groupRecordsByPeriod([record('tarde', tarde)], inicioDoDia + 60_000)
      expect(groups.map((g) => g.id)).toEqual(['hoje'])
    })

    it('omite grupos vazios: nenhum cabeçalho aparece sem itens embaixo', () => {
      const groups = groupRecordsByPeriod([record('so-hoje', AGORA - 60_000)], AGORA)
      expect(groups.map((g) => g.id)).toEqual(['hoje'])
    })

    it('ordena os registros de cada grupo em ordem cronológica decrescente', () => {
      const records = [record('mais-antigo', AGORA - 5 * 60 * 60 * 1000), record('mais-novo', AGORA - 60_000)]
      const groups = groupRecordsByPeriod(records, AGORA)
      expect(groups[0].records.map((r) => r.id)).toEqual(['mais-novo', 'mais-antigo'])
    })
  })
})
