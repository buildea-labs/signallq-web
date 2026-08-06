import type { SpeedTestResult } from './speedEngine'

const LEGACY_LAST_RESULT_KEY = 'signallq_last_result'
const RESTORABLE_FULL_RESULT_KEY = 'signallq_full_last_result_v1'

interface LegacyLastResult {
  latency: number
  download: number
  upload: number
  jitter: number
  timestamp: number
}

function storage() {
  return typeof window === 'undefined' ? null : window.sessionStorage
}

export function readRestorableSpeedTestResult(): SpeedTestResult | null {
  const store = storage()
  if (!store) return null

  try {
    const raw = store.getItem(RESTORABLE_FULL_RESULT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SpeedTestResult>
    return parsed.status ? (parsed as SpeedTestResult) : null
  } catch {
    return null
  }
}

/**
 * Guarda o resultado da rodada para restaurar ao voltar à rota.
 *
 * Vale para **qualquer** status terminal, não só `complete`. Com o antigo
 * recorte, uma rodada parcial/inconclusiva/contaminada não era guardada e
 * cada volta a `/` disparava medição nova — justamente para quem está com a
 * conexão ruim, que é quem menos pode gastar banda. Restaurar o resultado
 * ruim (com o aviso de status que já existe) e deixar o reteste explícito é
 * mais honesto e mais barato.
 */
export function persistRestorableSpeedTestResult(result: SpeedTestResult) {
  const store = storage()
  if (!store) return

  const legacy: LegacyLastResult = {
    latency: result.latency.ms,
    download: result.download.mbps,
    upload: result.upload.mbps,
    jitter: result.latency.p95Ms ? Math.abs(result.latency.p95Ms - result.latency.ms) : 0,
    timestamp: Date.now(),
  }

  // O resumo legado alimenta leitores antigos que assumem medição válida:
  // só recebe rodada completa.
  if (result.status === 'complete') store.setItem(LEGACY_LAST_RESULT_KEY, JSON.stringify(legacy))
  store.setItem(RESTORABLE_FULL_RESULT_KEY, JSON.stringify(result))
}
