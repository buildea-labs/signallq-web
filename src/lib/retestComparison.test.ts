import { describe, expect, it } from 'vitest'
import { compareHistoryRecords, compareRetest } from './retestComparison'
import type { MedicaoRegistro } from './measurementRepository'
import type { SpeedTestResult } from './speedEngine'

function result(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    id: crypto.randomUUID(), timestamp: 1, mode: 'rapido', status: 'complete', partial: false,
    download: { mbps: 100, peakMbps: 110 }, upload: { mbps: 50, peakMbps: 55 },
    latency: { ms: 20, samples: 10, validSamples: 10, timeouts: 0, maxMs: 22, p95Ms: 21, peaks: 0 },
    jitter: { ms: 1 }, packetLoss: { percent: 0 }, loadedLatency: null,
    bufferbloat: { ms: 2, severity: 'none' }, stabilityScore: 99,
    dns: { latencyMs: null, resolverIp: null, provider: null }, connectionType: null, server: 'Cloudflare',
    ...overrides,
  }
}

describe('compareRetest', () => {
  it('preserva os valores observados sem inferir causalidade', () => {
    const comparison = compareRetest(result(), result({ download: { mbps: 120, peakMbps: 130 }, latency: { ms: 18, samples: 10, validSamples: 10, timeouts: 0, maxMs: 20, p95Ms: 19, peaks: 0 } }))
    expect(comparison).toEqual({ compatible: true, changes: [
      { label: 'Download', before: 100, after: 120, unit: 'Mbps', direction: 'better' },
      { label: 'Upload', before: 50, after: 50, unit: 'Mbps', direction: 'same' },
      { label: 'Latência', before: 20, after: 18, unit: 'ms', direction: 'better' },
    ] })
  })

  it('recusa modos ou resultados incompatíveis', () => {
    expect(compareRetest(result(), result({ mode: 'completo' }))).toMatchObject({ compatible: false })
    expect(compareRetest(result(), result({ status: 'partial', partial: true }))).toMatchObject({ compatible: false })
  })
})

function historyRecord(overrides: Partial<MedicaoRegistro> = {}): MedicaoRegistro {
  return {
    id: crypto.randomUUID(),
    timestamp: 1_000,
    download: 100,
    upload: 50,
    latency: 20,
    jitter: 1,
    connectionType: null,
    connectionKind: 'wifi',
    server: 'Cloudflare',
    mode: 'rapido',
    ...overrides,
  }
}

describe('compareHistoryRecords (#75)', () => {
  it('compara os valores flat direto do registro, sem inferir causa', () => {
    const before = historyRecord({ timestamp: 1_000, download: 100, upload: 50, latency: 20 })
    const after = historyRecord({ timestamp: 2_000, download: 120, upload: 50, latency: 18 })
    expect(compareHistoryRecords(before, after)).toEqual({
      compatible: true,
      changes: [
        { label: 'Download', before: 100, after: 120, unit: 'Mbps', direction: 'better' },
        { label: 'Upload', before: 50, after: 50, unit: 'Mbps', direction: 'same' },
        { label: 'Latência', before: 20, after: 18, unit: 'ms', direction: 'better' },
      ],
    })
  })

  it('a ordem dos parâmetros não importa: o mais antigo por timestamp é sempre "antes"', () => {
    const older = historyRecord({ timestamp: 1_000, download: 100 })
    const newer = historyRecord({ timestamp: 2_000, download: 120 })
    // Chamado "fora de ordem" (mais novo primeiro) — resultado deve ser idêntico.
    expect(compareHistoryRecords(newer, older)).toEqual(compareHistoryRecords(older, newer))
    expect(compareHistoryRecords(newer, older).changes?.[0]).toMatchObject({ before: 100, after: 120 })
  })

  it('recusa quando os modos diferem', () => {
    const comparison = compareHistoryRecords(
      historyRecord({ timestamp: 1_000, mode: 'rapido' }),
      historyRecord({ timestamp: 2_000, mode: 'completo' })
    )
    expect(comparison).toEqual({ compatible: false, reason: 'Os dois testes precisam usar o mesmo modo.' })
  })

  it('recusa quando qualquer um dos registros não tem mode (legado pré-#10), sem presumir compatibilidade', () => {
    const legacy = historyRecord({ timestamp: 1_000, mode: undefined })
    const current = historyRecord({ timestamp: 2_000, mode: 'rapido' })
    expect(compareHistoryRecords(legacy, current)).toEqual({
      compatible: false,
      reason: 'Não é possível confirmar que os dois testes usaram o mesmo modo (registro anterior a esta informação).',
    })
    expect(compareHistoryRecords(current, legacy)).toEqual(compareHistoryRecords(legacy, current))
  })
})
