import { describe, expect, it } from 'vitest'
import { PROBLEMAS_PERCEBIDOS, isProblemaPercebido } from './problemEntry'

describe('problem entry options', () => {
  it('keeps the five approved visitor-reported problems', () => {
    expect(PROBLEMAS_PERCEBIDOS.map((problema) => problema.value)).toEqual([
      'lenta',
      'travando',
      'cai-com-frequencia',
      'wifi-nao-chega-bem',
      'jogos-ou-chamadas-ruins',
    ])
  })

  it('does not accept an arbitrary local diagnosis as a problem context', () => {
    expect(isProblemaPercebido('wifi_local')).toBe(false)
  })
})
