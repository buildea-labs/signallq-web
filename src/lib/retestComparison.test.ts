import { describe, expect, it } from 'vitest'
import { compareRetest } from './retestComparison'
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
