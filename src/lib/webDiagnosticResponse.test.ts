import { describe, expect, it } from 'vitest'
import type { SpeedTestResult } from './speedEngine'
import { createMeasurementSessionContext } from './measurementSessionContext'
import { createWebDiagnosticResponse } from './webDiagnosticResponse'

const complete = (overrides: Partial<SpeedTestResult> = {}): SpeedTestResult => ({
  id: 'test', timestamp: 0, mode: 'rapido', status: 'complete', partial: false, server: 'Cloudflare',
  download: { mbps: 80, peakMbps: 90 }, upload: { mbps: 20, peakMbps: 24 },
  latency: { ms: 15, samples: 12, validSamples: 12, timeouts: 0, maxMs: 18, p95Ms: 17, peaks: 0 }, jitter: { ms: 4 },
  packetLoss: { percent: 0 }, loadedLatency: { downloadMs: 20, uploadMs: 21 }, bufferbloat: { ms: 5, severity: 'none' },
  stabilityScore: 95, dns: { latencyMs: 10, resolverIp: null, provider: null }, connectionType: null, ...overrides,
})

describe('web diagnostic response', () => {
  it('preserves low confidence for incomplete measurements', () => {
    const response = createWebDiagnosticResponse(complete({ status: 'partial', partial: true }), null, [])
    expect(response.confidence).toContain('baixa')
  })

  it('does not conclude from download alone', () => {
    const response = createWebDiagnosticResponse(complete({ download: { mbps: 5, peakMbps: 6 } }), null, [])
    expect(response.conclusion).toContain('sinal de atenção')
    expect(response.conclusion).not.toContain('conexão está fraca')
  })

  it('offers Android only for a declared browser-unobservable Wi-Fi need', () => {
    const wifi = createMeasurementSessionContext('problem', 'wifi-nao-chega-bem')
    expect(createWebDiagnosticResponse(complete(), wifi, []).androidCta?.reason).toContain('sinal')
    const games = createMeasurementSessionContext('problem', 'jogos-ou-chamadas-ruins')
    expect(createWebDiagnosticResponse(complete(), games, []).androidCta).toBeUndefined()
  })

  it('uses declared answers only to state confidence, never as a certainty', () => {
    const response = createWebDiagnosticResponse(complete({ latency: { ms: 100, samples: 12, validSamples: 12, timeouts: 0, maxMs: 110, p95Ms: 105, peaks: 0 } }), createMeasurementSessionContext('problem', 'jogos-ou-chamadas-ruins'), [{ questionId: 'web_atividade_q1', answerId: 'jogos' }])
    expect(response.confidence).toContain('hipótese')
  })
})
