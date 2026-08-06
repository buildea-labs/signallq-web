import { describe, expect, it } from 'vitest'
import type { SpeedTestResult } from '@/lib/speedEngine'
import {
  attentionFullResultFixture,
  contaminatedResultFixture,
  createSpeedTestResultFixture,
  errorResultFallbackFixture,
  goodFullResultFixture,
  inconclusiveResultFixture,
  offlineResultFallbackFixture,
  partialResultFixture,
  quickResultFixture,
  restoredResultFixture,
} from './speedTestResults'

function expectDomainResult(result: SpeedTestResult) {
  expect(result).toHaveProperty('download.mbps')
  expect(result).toHaveProperty('upload.mbps')
  expect(result).toHaveProperty('latency.validSamples')
  expect(result).toHaveProperty('dns.latencyMs')
  expect(result.server.length).toBeGreaterThan(0)
}

describe('speed test result fixtures', () => {
  it('expõe todas as massas determinísticas com o contrato real de SpeedTestResult', () => {
    const fixtures = [
      quickResultFixture,
      goodFullResultFixture,
      attentionFullResultFixture,
      partialResultFixture,
      inconclusiveResultFixture,
      contaminatedResultFixture,
      errorResultFallbackFixture,
      offlineResultFallbackFixture,
      restoredResultFixture,
    ]

    fixtures.forEach(expectDomainResult)
    expect(quickResultFixture.mode).toBe('rapido')
    expect(goodFullResultFixture.status).toBe('complete')
    expect(attentionFullResultFixture.bufferbloat.severity).toBe('severe')
    expect(partialResultFixture.status).toBe('partial')
    expect(inconclusiveResultFixture.status).toBe('inconclusive')
    expect(contaminatedResultFixture.status).toBe('contaminated')
    expect(restoredResultFixture.id).toBe('fixture-restored')
  })

  it('permite criar variações sem duplicar o formato manualmente', () => {
    const custom = createSpeedTestResultFixture({ id: 'fixture-custom', download: { mbps: 42 } })
    expect(custom.id).toBe('fixture-custom')
    expect(custom.download.mbps).toBe(42)
    expectDomainResult(custom)
  })
})
