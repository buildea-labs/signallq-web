import { describe, expect, it } from 'vitest'

import { bytesToMbps, cloudflareColo, measurementServerLabel, measurementStatus, meanAbsJitter, median, SPEED_TEST_MODE_CONFIG, summarizeLatency } from './speedEngine'

describe('speed measurement calculations', () => {
  it('calculates median and jitter deterministically', () => {
    expect(median([9, 1, 5])).toBe(5)
    expect(median([1, 5, 9, 13])).toBe(7)
    expect(meanAbsJitter([10, 16, 12])).toBe(5)
  })

  it('converts bytes and elapsed time to Mbps', () => {
    expect(bytesToMbps(1_000_000, 1_000)).toBe(8)
    expect(bytesToMbps(1_000_000, 0)).toBe(0)
  })

  it('only displays a PoP when the response supplies a valid Cloudflare colo', () => {
    expect(cloudflareColo('gig')).toBe('GIG')
    expect(cloudflareColo('GRU-SP')).toBeNull()
    expect(cloudflareColo(null)).toBeNull()
    expect(measurementServerLabel('GIG')).toBe('Borda Cloudflare · PoP GIG')
    expect(measurementServerLabel(null)).toBe('Borda Cloudflare (roteamento automático)')
  })

  it('summarizes timeouts and excludes latency spikes from the reported median', () => {
    expect(summarizeLatency([0, 10, 12, null, 100]).ms).toBe(11)
    expect(summarizeLatency([0, 10, 12, null, 100]).timeouts).toBe(1)
  })

  it('gives the complete mode a materially larger measurement budget', () => {
    const rapido = SPEED_TEST_MODE_CONFIG.rapido
    const completo = SPEED_TEST_MODE_CONFIG.completo

    expect(completo.latencySampleCount).toBeGreaterThan(rapido.latencySampleCount)
    expect(completo.minimumValidLatencySamples).toBeGreaterThan(rapido.minimumValidLatencySamples)
    expect(completo.downloadDurationMs + completo.uploadDurationMs).toBeGreaterThan(
      (rapido.downloadDurationMs + rapido.uploadDurationMs) * 2,
    )
    expect(completo.downloadMaxStreams).toBeGreaterThan(rapido.downloadMaxStreams)
    expect(completo.uploadMaxStreams).toBeGreaterThan(rapido.uploadMaxStreams)
  })

  it('marks insufficient mode-specific evidence as partial without inventing a conclusion', () => {
    expect(measurementStatus(SPEED_TEST_MODE_CONFIG.rapido, {
      validLatencySamples: 7, throughputComplete: true, contaminated: false,
    })).toBe('partial')
    expect(measurementStatus(SPEED_TEST_MODE_CONFIG.completo, {
      validLatencySamples: 17, throughputComplete: true, contaminated: false,
    })).toBe('partial')
    expect(measurementStatus(SPEED_TEST_MODE_CONFIG.completo, {
      validLatencySamples: 4, throughputComplete: true, contaminated: false,
    })).toBe('inconclusive')
    expect(measurementStatus(SPEED_TEST_MODE_CONFIG.rapido, {
      validLatencySamples: 14, throughputComplete: true, contaminated: true,
    })).toBe('contaminated')
  })
})
