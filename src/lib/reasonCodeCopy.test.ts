import { describe, expect, it } from 'vitest'
import { reasonCodesToCopy, reasonCodeToCopy } from './reasonCodeCopy'

describe('reasonCodeToCopy', () => {
  it('traduz o código documentado na Issue #10 para copy humana', () => {
    expect(reasonCodeToCopy('download_within_ideal_range')).toBe('Dentro da faixa que faz sentido para sua casa')
  })

  it('nunca inventa copy para um código desconhecido — usa fallback neutro', () => {
    expect(reasonCodeToCopy('algum_codigo_que_ainda_nao_existe')).toBe('Compatível com o perfil informado')
  })
})

describe('reasonCodesToCopy', () => {
  it('remove duplicatas de copy resultantes de múltiplos códigos', () => {
    expect(reasonCodesToCopy(['codigo_desconhecido_a', 'codigo_desconhecido_b'])).toEqual(['Compatível com o perfil informado'])
  })

  it('preserva a ordem de chegada dos códigos', () => {
    expect(reasonCodesToCopy(['download_within_ideal_range', 'outro_codigo'])).toEqual([
      'Dentro da faixa que faz sentido para sua casa',
      'Compatível com o perfil informado',
    ])
  })
})
