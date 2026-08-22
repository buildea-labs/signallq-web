import { describe, expect, it } from 'vitest'
import { reasonCodesToCopy, reasonCodeToCopy } from './reasonCodeCopy'

describe('reasonCodeToCopy', () => {
  it('traduz o código documentado na Issue #10 para copy humana', () => {
    expect(reasonCodeToCopy('download_within_ideal_range')).toBe('Dentro da faixa que faz sentido para sua casa')
  })

  it('nunca inventa copy para um código desconhecido — retorna undefined', () => {
    expect(reasonCodeToCopy('algum_codigo_que_ainda_nao_existe')).toBeUndefined()
  })
})

describe('reasonCodesToCopy', () => {
  it('remove duplicatas de copy resultantes de múltiplos códigos', () => {
    expect(reasonCodesToCopy(['codigo_desconhecido_a', 'codigo_desconhecido_b'])).toEqual([])
  })

  it('preserva a ordem de chegada dos códigos', () => {
    const res = reasonCodesToCopy(['download_within_ideal_range', 'outro_codigo'])
    expect(res).toHaveLength(1)
    expect(res[0].text).toBe('Dentro da faixa que faz sentido para sua casa')
    expect(res[0].type).toBe('success')
  })
})
