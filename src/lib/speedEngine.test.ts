import { describe, expect, it } from 'vitest'

import { bytesToMbps, meanAbsJitter, median, summarizeLatency } from './speedEngine'

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

  it('summarizes timeouts and excludes latency spikes from the reported median', () => {
    expect(summarizeLatency([0, 10, 12, null, 100]).ms).toBe(11)
    expect(summarizeLatency([0, 10, 12, null, 100]).timeouts).toBe(1)
  })
})
