import type { MeasurementSessionContext } from './measurementSessionContext'
import type { SpeedTestResult } from './speedEngine'
import { PROBLEM_PHASES, RUNNING_PHASES, type FasePainel, type PhaseResults, type ProblemPhase } from './speedTestPhase'

type RunningPhase = (typeof RUNNING_PHASES)[number]

interface VisualStateInput {
  phase: FasePainel
  mode: 'rapido' | 'completo'
  result: SpeedTestResult | null
  liveValue: number
  phaseResults: PhaseResults
  measurementContext: MeasurementSessionContext | null
  isAutoStarting: boolean
  restoredResult: boolean
  deepeningAfterQuickResult: boolean
}

interface BaseState {
  mode: 'rapido' | 'completo'
}

export type SpeedTestVisualState =
  | (BaseState & { state: 'forming'; context: MeasurementSessionContext | null; isAutoStarting: boolean })
  | (BaseState & { state: 'quick-running'; phase: RunningPhase; liveValue: number; phaseResults: PhaseResults; context: MeasurementSessionContext | null })
  | (BaseState & { state: 'quick-result'; result: SpeedTestResult })
  | (BaseState & { state: 'full-running'; phase: RunningPhase; liveValue: number; phaseResults: PhaseResults; context: MeasurementSessionContext | null; previousResult: SpeedTestResult | null })
  | (BaseState & { state: 'diagnosing'; result: SpeedTestResult; context: MeasurementSessionContext | null })
  | (BaseState & { state: 'full-result'; result: SpeedTestResult; context: MeasurementSessionContext | null })
  | (BaseState & { state: 'restored-result'; result: SpeedTestResult; context: MeasurementSessionContext | null })
  | (BaseState & { state: 'error'; phase: Exclude<ProblemPhase, 'sem-conexao'>; previousResult: SpeedTestResult | null })
  | (BaseState & { state: 'offline'; previousResult: SpeedTestResult | null })

function isRunningPhase(phase: FasePainel): phase is RunningPhase {
  return RUNNING_PHASES.includes(phase)
}

function isProblemPhase(phase: FasePainel): phase is ProblemPhase {
  return PROBLEM_PHASES.includes(phase as ProblemPhase)
}

function isTerminalResultPhase(phase: FasePainel) {
  return phase === 'concluido' || phase === 'parcial' || phase === 'inconclusivo' || phase === 'contaminado'
}

export function deriveSpeedTestVisualState(input: VisualStateInput): SpeedTestVisualState {
  const { phase, mode, result, liveValue, phaseResults, measurementContext, isAutoStarting, restoredResult, deepeningAfterQuickResult } = input

  if (phase === 'idle') {
    return { state: 'forming', mode, context: measurementContext, isAutoStarting }
  }

  if (isRunningPhase(phase)) {
    if (mode === 'rapido') {
      return { state: 'quick-running', mode, phase, liveValue, phaseResults, context: measurementContext }
    }

    return { state: 'full-running', mode, phase, liveValue, phaseResults, context: measurementContext, previousResult: result }
  }

  if (isProblemPhase(phase)) {
    if (phase === 'sem-conexao') return { state: 'offline', mode, previousResult: result }
    return { state: 'error', mode, phase, previousResult: result }
  }

  if (isTerminalResultPhase(phase) && result) {
    if (restoredResult) return { state: 'restored-result', mode, result, context: measurementContext }
    if (mode === 'rapido') return { state: 'quick-result', mode, result }
    if (deepeningAfterQuickResult) return { state: 'diagnosing', mode, result, context: measurementContext }
    return { state: 'full-result', mode, result, context: measurementContext }
  }

  return { state: 'forming', mode, context: measurementContext, isAutoStarting }
}
