// Orquestração da execução do motor de medição: estados exibidos na tela
// (fase, valor ao vivo, parciais, resultado, rodada), ciclo de vida da aba e
// composição do lock entre abas com a guarda de rede. Não conhece a jornada da
// Home nem a sessão de medição — isso vive em `useSpeedTest`/`useSpeedTestJourney`.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSpeedTestNetworkGuard } from './useSpeedTestNetworkGuard'
import { useSpeedTestTabLock } from './useSpeedTestTabLock'
import type { TipoRede } from '../lib/connection'
import { persistSpeedTestResult } from '../lib/persistSpeedTestResult'
import { createSpeedTest, type SpeedTestMode, type SpeedTestResult } from '../lib/speedEngine'
import {
  phaseFromResultStatus,
  problemPhaseFromError,
  RUNNING_PHASES,
  STEP_PHASES,
  type FasePainel,
  type PhaseResults,
} from '../lib/speedTestPhase'
import { FEATURE_SPEEDTEST_COMPLETOU, FEATURE_SPEEDTEST_INICIADO, trackFeatureUsed } from '../lib/telemetry'

export function useSpeedTestController(modo: SpeedTestMode) {
  const [phase, setPhase] = useState<FasePainel>('idle')
  const [liveValue, setLiveValue] = useState(0)
  const [phaseResults, setPhaseResults] = useState<PhaseResults>({})
  const [result, setResult] = useState<SpeedTestResult | null>(null)
  const [round, setRound] = useState<number | null>(null)

  const engineRef = useRef<ReturnType<typeof createSpeedTest> | null>(null)
  // Espelham o state síncronamente para o callback onPhase do motor (precisa
  // ler a fase/valor "atuais" no exato instante da transição, antes do
  // próximo render — useState sozinho não garante isso dentro do mesmo tick).
  const phaseRef = useRef<FasePainel>('idle')
  const liveValueRef = useRef(0)

  // Espelha `modo` (Rápido/Completo, GH#1367) em ref pelo mesmo motivo do
  // `phaseRef` acima — `runTest` é criado uma vez via useCallback e precisa ler
  // o modo selecionado no instante em que o teste é iniciado, não o valor
  // capturado na primeira render.
  const modoRef = useRef(modo)
  useEffect(() => {
    modoRef.current = modo
  }, [modo])

  const lock = useSpeedTestTabLock()
  const { acquire, release, startHeartbeat, stopHeartbeat, hasForeignLock } = lock
  const marcarContaminado = useCallback(() => engineRef.current?.markContaminated(), [])
  const { connectionKind, capturarRedeInicial, redeMudouDuranteOTeste } =
    useSpeedTestNetworkGuard(marcarContaminado)
  // Espelha o tipo de rede capturado no início do teste para uso síncrono em
  // `persistSpeedTestResult` no fim da execução, sem expor o ref interno do
  // guard de rede na interface pública do hook.
  const redeInicialTipoRef = useRef<TipoRede | null>(null)

  const aplicarFase = useCallback((novaFase: FasePainel) => {
    phaseRef.current = novaFase
    setPhase(novaFase)
  }, [])

  const runTest = useCallback(
    // `isRepeat` está reservado para diferenciar telemetria de repetição no
    // futuro, se o Console pedir esse recorte — hoje conta como o mesmo evento
    // de funil "iniciado". `modeOverride` permite forçar o modo desta rodada
    // (ex.: aprofundamento pós-resultado, GH#1367 follow-up) sem depender do
    // timing de propagação de `modoRef` — necessário porque, nesse caminho,
    // `setModo` e o disparo do teste acontecem no mesmo handler síncrono.
    async (isRepeat: boolean, modeOverride?: SpeedTestMode) => {
      acquire()
      startHeartbeat()
      liveValueRef.current = 0
      aplicarFase('preparando')
      setLiveValue(0)
      setPhaseResults({})
      // Num reteste, o resultado anterior continua disponível se a nova
      // medição for cancelada ou falhar. Durante a execução ele não é exibido,
      // mas nunca se perde uma medição já concluída.
      if (!isRepeat) setResult(null)
      setRound(null)
      trackFeatureUsed(FEATURE_SPEEDTEST_INICIADO)

      const rede = await capturarRedeInicial()
      redeInicialTipoRef.current = rede.tipo
      if (!rede.internet) {
        aplicarFase('sem-conexao')
        release()
        return
      }

      const engine = createSpeedTest(modeOverride ?? modoRef.current)
      engineRef.current = engine
      try {
        const r = await engine.run({
          onPhase: (p) => {
            if (STEP_PHASES.includes(phaseRef.current)) {
              const key = phaseRef.current as 'latencia' | 'download' | 'upload'
              const finalVal = liveValueRef.current
              setPhaseResults((prev) => ({ ...prev, [key]: finalVal }))
            }
            phaseRef.current = p
            liveValueRef.current = 0
            setLiveValue(0)
            setPhase(p)
          },
          onTick: ({ instantMbps }) => {
            liveValueRef.current = instantMbps
            setLiveValue(instantMbps)
          },
          onLatencySample: (ms) => {
            liveValueRef.current = ms
            setLiveValue(ms)
          },
          onRound: (currentRound) => setRound(currentRound),
        })
        const redeMudou = await redeMudouDuranteOTeste()
        const resultadoFinal = redeMudou ? { ...r, status: 'contaminated' as const, partial: true } : r
        setPhaseResults({ latencia: resultadoFinal.latency.ms, download: resultadoFinal.download.mbps, upload: resultadoFinal.upload.mbps })
        setResult(resultadoFinal)
        aplicarFase(phaseFromResultStatus(resultadoFinal.status))
        if (resultadoFinal.status === 'complete') {
          trackFeatureUsed(FEATURE_SPEEDTEST_COMPLETOU)
          await persistSpeedTestResult(resultadoFinal, redeInicialTipoRef.current)
        }
      } catch (err) {
        stopHeartbeat()
        aplicarFase(problemPhaseFromError(err))
      } finally {
        release()
      }
    },
    [acquire, aplicarFase, capturarRedeInicial, redeMudouDuranteOTeste, release, startHeartbeat, stopHeartbeat]
  )

  useEffect(() => {
    aplicarFase(hasForeignLock() ? 'bloqueado-outra-aba' : 'idle')

    const onVisibilityChange = () => {
      if (document.hidden && RUNNING_PHASES.includes(phaseRef.current) && engineRef.current) {
        engineRef.current.cancel()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (engineRef.current) engineRef.current.cancel()
    }
    // roda uma única vez ao montar — comportamento equivalente ao componentDidMount original
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cancelTest = useCallback(() => {
    if (engineRef.current) engineRef.current.cancel()
  }, [])

  // Volta pro estado idle sem rodar o motor — usado pela seta "voltar" da
  // tela de Resultado (Tela 2 -> Tela 1), não é engano com cancelTest/retry.
  const goToIdle = useCallback(() => {
    aplicarFase('idle')
    setResult(null)
  }, [aplicarFase])

  // Cancelar um reteste (isRepeat=true, ex.: aprofundamento pós-resultado)
  // nunca limpa `result` — a rodada anterior continua no state. Esta função só
  // reconcilia `phase`, que fica presa em 'cancelado' (um ProblemPhase) até
  // aqui, de volta ao estado de resultado correspondente, para que a tela
  // volte a mostrar a medição anterior em vez de travar numa tela de erro.
  const restaurarResultadoAnterior = useCallback(() => {
    if (result) aplicarFase(phaseFromResultStatus(result.status))
  }, [result, aplicarFase])

  return { phase, liveValue, phaseResults, result, connectionKind, round, runTest, cancelTest, goToIdle, restaurarResultadoAnterior }
}
