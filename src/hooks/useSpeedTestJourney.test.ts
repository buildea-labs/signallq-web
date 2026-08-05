import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goodFullResultFixture, quickResultFixture } from '@/test/fixtures/speedTestResults'
import type { FasePainel, PhaseResults } from '@/lib/speedTestPhase'
import type { MeasurementSessionContext } from '@/lib/measurementSessionContext'
import type { SpeedTestResult } from '@/lib/speedEngine'
import { hasSpeedTestAutoStarted, persistRestorableSpeedTestResult } from '@/lib/speedTestJourneySession'

const speedTestMock = vi.hoisted(() => ({
  phase: 'idle' as FasePainel,
  liveValue: 0,
  phaseResults: {} as PhaseResults,
  result: null as SpeedTestResult | null,
  measurementContext: null as MeasurementSessionContext | null,
  cancelTest: vi.fn(),
  retry: vi.fn(),
  forceStart: vi.fn(),
  restaurarResultadoAnterior: vi.fn(),
  injectResult: vi.fn(),
}))

vi.mock('@/hooks/useSpeedTest', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useSpeedTest')>('@/hooks/useSpeedTest')
  return {
    ...actual,
    useSpeedTest: () => speedTestMock,
  }
})

vi.mock('@/lib/measurementRepository', () => ({
  updateRecordDiagnostic: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/comparisonRepository', () => ({
  addComparison: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/telemetry', async () => {
  const actual = await vi.importActual<typeof import('@/lib/telemetry')>('@/lib/telemetry')
  return { ...actual, trackFeatureUsed: vi.fn(), trackScreenView: vi.fn() }
})

vi.mock('@/lib/speedTestJourneySharing', () => ({
  shareSpeedTestResult: vi.fn().mockResolvedValue('shared'),
  copySpeedTestResult: vi.fn().mockResolvedValue('copied'),
}))

function resetSpeedTestMock(overrides: Partial<typeof speedTestMock> = {}) {
  speedTestMock.phase = 'idle'
  speedTestMock.liveValue = 0
  speedTestMock.phaseResults = {}
  speedTestMock.result = null
  speedTestMock.measurementContext = null
  speedTestMock.cancelTest.mockClear()
  speedTestMock.retry.mockClear()
  speedTestMock.forceStart.mockClear()
  speedTestMock.restaurarResultadoAnterior.mockClear()
  speedTestMock.injectResult.mockClear()
  Object.assign(speedTestMock, overrides)
}

describe('useSpeedTestJourney composition', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.history.replaceState(null, '', '/')
    resetSpeedTestMock()
  })

  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('inicia automaticamente uma primeira medição direta quando não há resultado restaurável', async () => {
    const { useSpeedTestJourney } = await import('./useSpeedTestJourney')
    renderHook(() => useSpeedTestJourney())

    await waitFor(() => expect(speedTestMock.forceStart).toHaveBeenCalledWith({ version: 1, entry: 'direct' }))
    expect(hasSpeedTestAutoStarted()).toBe(true)
  })

  it('restaura resultado completo sem disparar novo teste automático', async () => {
    persistRestorableSpeedTestResult(goodFullResultFixture)
    const { useSpeedTestJourney } = await import('./useSpeedTestJourney')
    renderHook(() => useSpeedTestJourney())

    await waitFor(() => expect(speedTestMock.injectResult).toHaveBeenCalledWith(goodFullResultFixture))
    expect(speedTestMock.forceStart).not.toHaveBeenCalled()
  })

  it('representa resultado rápido como quick-result', async () => {
    resetSpeedTestMock({ phase: 'concluido', result: quickResultFixture })
    const { useSpeedTestJourney } = await import('./useSpeedTestJourney')
    const { result } = renderHook(() => useSpeedTestJourney())
    expect(result.current.visualState).toMatchObject({ state: 'quick-result', result: quickResultFixture })
  })

  it('vai de resultado rápido para teste completo real no aprofundamento', async () => {
    resetSpeedTestMock({ phase: 'concluido', result: quickResultFixture })
    const { useSpeedTestJourney } = await import('./useSpeedTestJourney')
    const { result } = renderHook(() => useSpeedTestJourney())

    act(() => result.current.iniciarAprofundamento())

    expect(speedTestMock.retry).toHaveBeenCalledWith('completo')
    await waitFor(() => expect(result.current.modo).toBe('completo'))
  })

  it('deriva diagnóstico quando o aprofundamento completo conclui', async () => {
    resetSpeedTestMock({ phase: 'concluido', result: quickResultFixture })
    const { useSpeedTestJourney } = await import('./useSpeedTestJourney')
    const { result, rerender } = renderHook(() => useSpeedTestJourney())

    act(() => result.current.iniciarAprofundamento())
    resetSpeedTestMock({ phase: 'concluido', result: goodFullResultFixture })
    rerender()

    await waitFor(() => expect(result.current.visualState).toMatchObject({ state: 'diagnosing', result: goodFullResultFixture }))
  })

  it('cancela aprofundamento preservando o resultado rápido anterior', async () => {
    resetSpeedTestMock({ phase: 'concluido', result: quickResultFixture })
    const { useSpeedTestJourney } = await import('./useSpeedTestJourney')
    const { result, rerender } = renderHook(() => useSpeedTestJourney())

    act(() => result.current.iniciarAprofundamento())
    resetSpeedTestMock({ phase: 'cancelado', result: quickResultFixture })
    rerender()

    await waitFor(() => expect(speedTestMock.restaurarResultadoAnterior).toHaveBeenCalled())
    await waitFor(() => expect(result.current.modo).toBe('rapido'))
  })

  it('preserva resultado anterior quando erro ocorre durante reteste', async () => {
    resetSpeedTestMock({ phase: 'endpoint-indisponivel', result: quickResultFixture })
    const { useSpeedTestJourney } = await import('./useSpeedTestJourney')
    const { result } = renderHook(() => useSpeedTestJourney())

    expect(result.current.hasVisibleResult).toBe(true)
    expect(result.current.visualState).toMatchObject({ state: 'error', previousResult: quickResultFixture })
  })
})
