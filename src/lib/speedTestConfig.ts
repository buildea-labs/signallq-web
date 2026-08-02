// Configuração dos modos de medição (rápido/completo) e critério de status
// final a partir da evidência coletada. Módulo puro — sem transporte, sem
// estatística de amostra, sem React.
import type { MeasurementStatus, SpeedTestMode } from './speedEngine'

export interface SpeedTestModeConfig {
  latencySampleCount: number
  /** Amostras de latência válidas necessárias para considerar a rodada completa. */
  minimumValidLatencySamples: number
  downloadDurationMs: number
  uploadDurationMs: number
  downloadPayloadBytes: number
  uploadPayloadBytes: number
  downloadInitialStreams: number
  downloadMaxStreams: number
  uploadInitialStreams: number
  uploadMaxStreams: number
  warmupMs: number
}

/**
 * Parâmetros de medição, não regras de diagnóstico. O modo integra o contexto
 * da execução; somente o motor oficial, via contrato Cloudflare, conclui causas.
 */
export const SPEED_TEST_MODE_CONFIG: Record<Exclude<SpeedTestMode, 'triplo'>, SpeedTestModeConfig> = {
  rapido: {
    latencySampleCount: 15, minimumValidLatencySamples: 8, downloadDurationMs: 7000, uploadDurationMs: 7000,
    downloadPayloadBytes: 10_000_000, uploadPayloadBytes: 5_000_000,
    downloadInitialStreams: 2, downloadMaxStreams: 4, uploadInitialStreams: 4, uploadMaxStreams: 4, warmupMs: 1000,
  },
  completo: {
    latencySampleCount: 25, minimumValidLatencySamples: 18, downloadDurationMs: 18_000, uploadDurationMs: 18_000,
    downloadPayloadBytes: 25_000_000, uploadPayloadBytes: 10_000_000,
    downloadInitialStreams: 2, downloadMaxStreams: 8, uploadInitialStreams: 8, uploadMaxStreams: 8, warmupMs: 2000,
  },
}

export function measurementStatus(
  config: SpeedTestModeConfig,
  input: { validLatencySamples: number; throughputComplete: boolean; contaminated: boolean },
): MeasurementStatus {
  if (input.contaminated) return 'contaminated'
  // Menos de cinco respostas não sustenta sequer a triagem curta.
  if (input.validLatencySamples < 5) return 'inconclusive'
  // Cada modo declara a precisão que efetivamente conseguiu coletar.
  if (!input.throughputComplete || input.validLatencySamples < config.minimumValidLatencySamples) return 'partial'
  return 'complete'
}
