import { describe, expect, it } from 'vitest'
import { formatMeasurementShare } from './sharing'

describe('formatMeasurementShare', () => {
  it('shares only measurement metrics and the canonical test URL', () => {
    const text = formatMeasurementShare({ timestamp: 0, downloadMbps: 123.45, uploadMbps: 45.67, latencyMs: 18.4, conclusion: 'Há um sinal de atenção.', nextAction: 'Repita o teste.' })
    expect(text).toContain('123.5 Mbps')
    expect(text).toContain('45.7 Mbps')
    expect(text).toContain('18 ms')
    expect(text).toContain('Conclusão: Há um sinal de atenção.')
    expect(text).toContain('Próxima ação: Repita o teste.')
    expect(text).toContain('https://signallq.com/')
  })
})
