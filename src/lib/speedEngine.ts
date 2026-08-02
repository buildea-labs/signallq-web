// Motor de medição: orquestra transporte (speedTestTransport), estatística
// (speedTestStats) e configuração por modo (speedTestConfig) para montar o
// resultado final. Lógica de timing/XHR sensível vive em speedTestTransport;
// este arquivo só decide a sequência das fases e monta o objeto de resultado.
import { generateId } from './id'
import { measurementStatus, SPEED_TEST_MODE_CONFIG } from './speedTestConfig'
import { bufferbloatSeverity, measurementServerLabel, median, stability } from './speedTestStats'
import { SpeedTestError } from './speedTestError'
import { collectLatency, measureDns, runThroughput, type CancelToken, type DnsSummary } from './speedTestTransport'

export type SpeedTestMode = 'rapido' | 'completo' | 'triplo'
export type MeasurementStatus = 'complete' | 'partial' | 'inconclusive' | 'contaminated' | 'cancelled'
export type SpeedTestPhase = 'preparando' | 'latencia' | 'download' | 'upload' | 'processando'
export type BufferbloatSeverity = 'none' | 'mild' | 'moderate' | 'severe'

export { SpeedTestError }
export type { SpeedTestErrorCode } from './speedTestError'

export interface SpeedTestResult {
  id: string
  timestamp: number
  mode: SpeedTestMode
  status: MeasurementStatus
  download: { mbps: number; peakMbps: number }
  upload: { mbps: number; peakMbps: number }
  latency: { ms: number; samples: number; validSamples: number; timeouts: number; maxMs: number; p95Ms: number; peaks: number }
  jitter: { ms: number } | null
  packetLoss: { percent: number }
  loadedLatency: { downloadMs: number; uploadMs: number } | null
  bufferbloat: { ms: number; severity: BufferbloatSeverity }
  stabilityScore: number
  dns: DnsSummary
  connectionType: string | null
  server: string
  /** Tempo efetivamente decorrido nesta rodada, medido no navegador. */
  durationMs?: number
  partial: boolean
  rounds?: Array<{ downloadMbps: number; uploadMbps: number; latencyMs: number }>
}

interface Callbacks {
  onPhase?: (phase: SpeedTestPhase) => void
  onTick?: (tick: { phase: 'download' | 'upload'; instantMbps: number; elapsedMs: number }) => void
  onLatencySample?: (ms: number) => void
  onRound?: (round: number, total: number) => void
}

export function createSpeedTest(mode: SpeedTestMode = 'rapido') {
  const token: CancelToken = { cancelled: false, contaminated: false, xhrs: new Set() }
  const cancel = () => { token.cancelled = true; token.xhrs.forEach((xhr) => xhr.abort()) }
  const markContaminated = () => { token.contaminated = true }

  const runSingle = async (singleMode: Exclude<SpeedTestMode, 'triplo'>, callbacks: Callbacks): Promise<SpeedTestResult> => {
    const startedAt = performance.now()
    const config = SPEED_TEST_MODE_CONFIG[singleMode]
    const onPhase = callbacks.onPhase ?? (() => {})
    const onTick = callbacks.onTick ?? (() => {})
    const onLatencySample = callbacks.onLatencySample ?? (() => {})
    const edgeColos = new Set<string>()
    const observeColo = (colo: string) => { edgeColos.add(colo) }
    if (!navigator.onLine) throw new SpeedTestError('no-connection')
    onPhase('preparando')
    onPhase('latencia')
    const latency = await collectLatency(config.latencySampleCount, token, onLatencySample)
    onPhase('download')
    const download = await runThroughput('download', config, token, (instantMbps) => onTick({ phase: 'download', instantMbps, elapsedMs: 0 }), observeColo)
    onPhase('upload')
    const dnsPromise = measureDns()
    const upload = await runThroughput('upload', config, token, (instantMbps) => onTick({ phase: 'upload', instantMbps, elapsedMs: 0 }), observeColo)
    const dns = await dnsPromise
    if (token.cancelled) throw new SpeedTestError('cancelled')
    onPhase('processando')
    const bufferbloatMs = Math.max(download.loadLatencyMs, upload.loadLatencyMs) - latency.ms
    const throughputComplete = download.throughput.endedBy === 'time_elapsed'
      && upload.throughput.endedBy === 'time_elapsed'
      && download.throughput.mbps > 0
      && upload.throughput.mbps > 0
    const status = measurementStatus(config, {
      validLatencySamples: latency.validSamples,
      throughputComplete,
      contaminated: token.contaminated,
    })

    return {
      id: generateId(), timestamp: Date.now(), mode: singleMode, status,
      download: { mbps: download.throughput.mbps, peakMbps: download.throughput.peakMbps },
      upload: { mbps: upload.throughput.mbps, peakMbps: upload.throughput.peakMbps },
      latency: { ms: latency.ms, samples: latency.totalSamples, validSamples: latency.validSamples, timeouts: latency.timeouts, maxMs: latency.maxMs, p95Ms: latency.p95Ms, peaks: latency.peaks },
      jitter: latency.validSamples >= 2 ? { ms: latency.jitterMs } : null,
      packetLoss: { percent: latency.packetLossPercent },
      loadedLatency: { downloadMs: download.loadLatencyMs, uploadMs: upload.loadLatencyMs },
      bufferbloat: { ms: Math.max(bufferbloatMs, 0), severity: bufferbloatSeverity(Math.max(bufferbloatMs, 0)) },
      stabilityScore: stability([...download.throughput.samples, ...upload.throughput.samples]), dns,
      connectionType: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType ?? null,
      // Sem header CORS confiável, não inventamos um PoP: só declaramos a
      // infraestrutura automática configurada para a medição.
      server: measurementServerLabel(edgeColos.size === 1 ? [...edgeColos][0]! : null), partial: status !== 'complete',
      durationMs: Math.round(performance.now() - startedAt),
    }
  }

  const run = async (callbacks: Callbacks = {}): Promise<SpeedTestResult> => {
    if (mode !== 'triplo') return runSingle(mode, callbacks)
    const rounds: Array<{ downloadMbps: number; uploadMbps: number; latencyMs: number }> = []
    let finalRound: SpeedTestResult | null = null
    for (let index = 0; index < 3; index++) {
      callbacks.onRound?.(index + 1, 3)
      const result = await runSingle('rapido', callbacks)
      if (result.status !== 'complete') return { ...result, mode: 'triplo', rounds }
      rounds.push({ downloadMbps: result.download.mbps, uploadMbps: result.upload.mbps, latencyMs: result.latency.ms })
      finalRound = result
    }
    const last = finalRound!
    // A terceira rodada ja e completa; usa sua telemetria e substitui apenas as metricas agregadas.
    return {
      ...last, mode: 'triplo', rounds,
      download: { ...last.download, mbps: median(rounds.map((round) => round.downloadMbps)) },
      upload: { ...last.upload, mbps: median(rounds.map((round) => round.uploadMbps)) },
      latency: { ...last.latency, ms: median(rounds.map((round) => round.latencyMs)) },
    }
  }

  return { run, cancel, markContaminated }
}
