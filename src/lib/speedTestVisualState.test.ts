import { describe, expect, it } from 'vitest'
import { deriveSpeedTestVisualState } from './speedTestVisualState'
import {
  contaminatedResultFixture,
  goodFullResultFixture,
  partialResultFixture,
  quickResultFixture,
  restoredResultFixture,
} from '@/test/fixtures/speedTestResults'
import type { FasePainel } from './speedTestPhase'

const context = { version: 1, entry: 'direct' } as const

function stateFor(overrides: Partial<Parameters<typeof deriveSpeedTestVisualState>[0]>) {
  return deriveSpeedTestVisualState({
    phase: 'idle',
    mode: 'rapido',
    result: null,
    liveValue: 0,
    phaseResults: {},
    measurementContext: null,
    isAutoStarting: false,
    restoredResult: false,
    deepeningAfterQuickResult: false,
    ...overrides,
  })
}

describe('deriveSpeedTestVisualState', () => {
  it.each([
    ['idle', 'forming'],
    ['download', 'quick-running'],
    ['sem-conexao', 'offline'],
    ['erro-inesperado', 'error'],
  ] satisfies Array<[FasePainel, ReturnType<typeof stateFor>['state']]>)('deriva %s como %s', (phase, expected) => {
    expect(stateFor({ phase }).state).toBe(expected)
  })

  it('deriva resultado rápido', () => {
    const visualState = stateFor({ phase: 'concluido', result: quickResultFixture })
    expect(visualState).toMatchObject({ state: 'quick-result', result: quickResultFixture })
  })

  it('deriva execução completa com resultado anterior preservado', () => {
    const visualState = stateFor({ phase: 'upload', mode: 'completo', result: quickResultFixture })
    expect(visualState).toMatchObject({ state: 'full-running', previousResult: quickResultFixture })
  })

  it('deriva diagnóstico após aprofundamento completo', () => {
    const visualState = stateFor({
      phase: 'concluido',
      mode: 'completo',
      result: goodFullResultFixture,
      measurementContext: context,
      deepeningAfterQuickResult: true,
    })
    expect(visualState).toMatchObject({ state: 'diagnosing', context })
  })

  it('deriva resultado completo terminal', () => {
    const visualState = stateFor({ phase: 'parcial', mode: 'completo', result: partialResultFixture })
    expect(visualState).toMatchObject({ state: 'full-result', result: partialResultFixture })
  })

  it('deriva resultado restaurado', () => {
    const visualState = stateFor({
      phase: 'concluido',
      mode: 'completo',
      result: restoredResultFixture,
      restoredResult: true,
    })
    expect(visualState).toMatchObject({ state: 'restored-result', result: restoredResultFixture })
  })

  it('preserva resultado anterior em erro sem promover erro a resultado terminal', () => {
    const visualState = stateFor({ phase: 'conexao-interrompida', mode: 'completo', result: contaminatedResultFixture })
    expect(visualState).toMatchObject({ state: 'error', previousResult: contaminatedResultFixture })
  })
})
