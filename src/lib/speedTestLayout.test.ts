import { describe, expect, it } from 'vitest'
import { speedTestLayoutFor } from './speedTestLayout'
import type { SpeedTestVisualState } from './speedTestVisualState'
import { goodFullResultFixture } from '../test/fixtures/speedTestResults'

const RESULT = goodFullResultFixture

function state(partial: Partial<SpeedTestVisualState> & { state: SpeedTestVisualState['state'] }): SpeedTestVisualState {
  return { mode: 'rapido', ...partial } as SpeedTestVisualState
}

describe('layout dos nove estados do fluxo de velocidade', () => {
  it('mantém formação e medição como etapa centralizada, com o mostrador ativo', () => {
    expect(speedTestLayoutFor(state({ state: 'forming' }), 'idle')).toMatchObject({ stage: 'stage', dial: 'forming' })
    expect(speedTestLayoutFor(state({ state: 'quick-running' }), 'download')).toMatchObject({
      stage: 'stage',
      dial: 'measuring',
    })
    expect(speedTestLayoutFor(state({ state: 'full-running', mode: 'completo' }), 'upload')).toMatchObject({
      stage: 'stage',
      dial: 'measuring',
    })
  })

  it('entrega a tela às etapas do diagnóstico quando a medição acabou e o motor está processando', () => {
    expect(speedTestLayoutFor(state({ state: 'full-running', mode: 'completo' }), 'processando')).toMatchObject({
      stage: 'stage',
      dial: 'hidden',
    })
  })

  it('lidera o resultado rápido pelo mostrador e o completo pelo diagnóstico', () => {
    expect(speedTestLayoutFor(state({ state: 'quick-result', result: RESULT }), 'concluido')).toMatchObject({
      stage: 'document',
      dial: 'result',
    })
    expect(speedTestLayoutFor(state({ state: 'full-result', mode: 'completo', result: RESULT }), 'concluido')).toMatchObject({
      stage: 'document',
      dial: 'hidden',
    })
    expect(speedTestLayoutFor(state({ state: 'diagnosing', mode: 'completo', result: RESULT }), 'concluido')).toMatchObject({
      stage: 'document',
      dial: 'hidden',
    })
  })

  it('restaura um resultado com a mesma hierarquia do modo que o produziu', () => {
    expect(speedTestLayoutFor(state({ state: 'restored-result', mode: 'rapido', result: RESULT }), 'concluido').dial).toBe('result')
    expect(speedTestLayoutFor(state({ state: 'restored-result', mode: 'completo', result: RESULT }), 'concluido').dial).toBe('hidden')
  })

  it('trata falha e ausência de conexão como etapa centralizada sem mostrador', () => {
    expect(speedTestLayoutFor(state({ state: 'error', phase: 'cancelado', previousResult: null }), 'cancelado')).toMatchObject({
      stage: 'stage',
      dial: 'hidden',
    })
    expect(speedTestLayoutFor(state({ state: 'offline', previousResult: null }), 'sem-conexao')).toMatchObject({
      stage: 'stage',
      dial: 'hidden',
    })
  })

  it('dá mais largura ao resultado completo, que exibe quatro métricas lado a lado', () => {
    const quick = speedTestLayoutFor(state({ state: 'quick-result', result: RESULT }), 'concluido')
    const full = speedTestLayoutFor(state({ state: 'full-result', mode: 'completo', result: RESULT }), 'concluido')
    expect(Number.parseInt(full.contentMax, 10)).toBeGreaterThan(Number.parseInt(quick.contentMax, 10))
  })
})
