import { describe, expect, it } from 'vitest'

import { classifyDownload, classifyLatency, interpretUseCases } from './classification'

describe('classification thresholds', () => {
  it('classifies download thresholds without changing the public labels', () => {
    expect(classifyDownload(50)).toEqual({ label: 'Boa', nivel: 'success' })
    expect(classifyDownload(25)).toEqual({ label: 'Aceitável', nivel: 'warning' })
    expect(classifyDownload(24.9)).toEqual({ label: 'Ruim', nivel: 'error' })
  })

  it('treats lower latency as better', () => {
    expect(classifyLatency(19)).toEqual({ label: 'Boa', nivel: 'success' })
    expect(classifyLatency(20)).toEqual({ label: 'Aceitável', nivel: 'warning' })
  })

  it('keeps the gaming verdict tied to the critical measurement inputs', () => {
    expect(interpretUseCases({ download: 10, upload: 3, latency: 50, jitter: 15 }).jogosOnline.nivel).toBe('success')
    expect(interpretUseCases({ download: 10, upload: 3, latency: 51, jitter: 15 }).jogosOnline.nivel).toBe('warning')
  })
})
