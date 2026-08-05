import type { SpeedTestResult } from './speedEngine'

const LEGACY_LAST_RESULT_KEY = 'signallq_last_result'
const RESTORABLE_FULL_RESULT_KEY = 'signallq_full_last_result_v1'
const AUTOSTART_KEY = 'speedtest_autostarted'

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
    return parsed.status === 'complete' ? parsed as SpeedTestResult : null
  } catch {
    return null
  }
}

export function hasSpeedTestAutoStarted() {
  return storage()?.getItem(AUTOSTART_KEY) === 'true'
}

export function markSpeedTestAutoStarted() {
  storage()?.setItem(AUTOSTART_KEY, 'true')
}

export function persistRestorableSpeedTestResult(result: SpeedTestResult) {
  const store = storage()
  if (!store || result.status !== 'complete') return

  const legacy: LegacyLastResult = {
    latency: result.latency.ms,
    download: result.download.mbps,
    upload: result.upload.mbps,
    jitter: result.latency.p95Ms ? Math.abs(result.latency.p95Ms - result.latency.ms) : 0,
    timestamp: Date.now(),
  }

  store.setItem(LEGACY_LAST_RESULT_KEY, JSON.stringify(legacy))
  store.setItem(RESTORABLE_FULL_RESULT_KEY, JSON.stringify(result))
}
