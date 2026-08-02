import { describe, expect, it } from 'vitest'
import { SpeedTestError } from './speedEngine'
import { phaseFromResultStatus, problemPhaseFromError } from './speedTestPhase'

describe('problemPhaseFromError', () => {
  it('traduz cada código do motor para o estado visual em PT-BR', () => {
    expect(problemPhaseFromError(new SpeedTestError('no-connection', 'x'))).toBe('sem-conexao')
    expect(problemPhaseFromError(new SpeedTestError('connection-interrupted', 'x'))).toBe('conexao-interrompida')
    expect(problemPhaseFromError(new SpeedTestError('endpoint-unavailable', 'x'))).toBe('endpoint-indisponivel')
    expect(problemPhaseFromError(new SpeedTestError('cancelled', 'x'))).toBe('cancelado')
    expect(problemPhaseFromError(new SpeedTestError('unexpected-error', 'x'))).toBe('erro-inesperado')
  })

  it('cai em erro-inesperado para erro que não vem do motor', () => {
    expect(problemPhaseFromError(new Error('boom'))).toBe('erro-inesperado')
    expect(problemPhaseFromError(undefined)).toBe('erro-inesperado')
  })
})

describe('phaseFromResultStatus', () => {
  it('mapeia status do resultado para fase do painel', () => {
    expect(phaseFromResultStatus('complete')).toBe('concluido')
    expect(phaseFromResultStatus('partial')).toBe('parcial')
    expect(phaseFromResultStatus('inconclusive')).toBe('inconclusivo')
    expect(phaseFromResultStatus('contaminated')).toBe('contaminado')
  })
})
