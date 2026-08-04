// Fachada da medição consumida pela Home: compõe o controller do motor com a
// sessão de medição (contexto de entrada). O lock entre abas, a guarda de rede,
// a persistência no Histórico e o mapa de erro->estado visual vivem em módulos
// próprios (`useSpeedTestTabLock`, `useSpeedTestNetworkGuard`,
// `persistSpeedTestResult`, `speedTestPhase`).
import { useCallback, useEffect, useState } from 'react'
import { useSpeedTestController } from './useSpeedTestController'
import type { SpeedTestMode } from '../lib/speedEngine'
import type { MeasurementSessionContext } from '../lib/measurementSessionContext'
import { beginMeasurementSession, readMeasurementSession } from '../lib/measurementSessionStore'

export type { FasePainel, PhaseResults, ProblemPhase } from '../lib/speedTestPhase'

export function useSpeedTest(modo: SpeedTestMode) {
  const [measurementContext, setMeasurementContext] = useState<MeasurementSessionContext | null>(() => readMeasurementSession()?.context ?? null)

  // A primeira renderização pode ocorrer no servidor, onde sessionStorage não
  // existe. Reidrata no navegador para retomar a coleta após reload/navegação.
  useEffect(() => {
    if (!measurementContext) setMeasurementContext(readMeasurementSession()?.context ?? null)
  }, [measurementContext])

  const { phase, liveValue, phaseResults, result, connectionKind, round, runTest, cancelTest, goToIdle, restaurarResultadoAnterior } =
    useSpeedTestController(modo)

  const startTest = useCallback(
    async (isRepeat: boolean, context?: MeasurementSessionContext, modeOverride?: SpeedTestMode) => {
      const sessionContext = context ?? measurementContext
      if (sessionContext) {
        setMeasurementContext(sessionContext)
        beginMeasurementSession(sessionContext)
      }
      await runTest(isRepeat, modeOverride)
    },
    [measurementContext, runTest]
  )

  // `modeOverride` força o modo desta rodada independentemente de `modo`/
  // `modoRef` (aprofundamento pós-resultado, GH#1367 follow-up): `setModo` e o
  // disparo do teste acontecem no mesmo handler síncrono, então ler `modoRef`
  // sozinho arriscaria uma corrida com a propagação do novo `modo` por efeito.
  const retry = useCallback((modeOverride?: SpeedTestMode) => startTest(true, undefined, modeOverride), [startTest])
  const forceStart = useCallback(
    (context?: MeasurementSessionContext, modeOverride?: SpeedTestMode) => startTest(false, context, modeOverride),
    [startTest]
  )

  return {
    phase, liveValue, phaseResults, result, connectionKind, round, measurementContext,
    cancelTest, retry, forceStart, goToIdle, restaurarResultadoAnterior,
  }
}
