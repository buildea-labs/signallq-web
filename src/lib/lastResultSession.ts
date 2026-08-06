import type { SpeedTestResult } from './speedEngine'

const LAST_RESULT_SESSION_KEY = 'signallq_full_last_result_v1'

export function readLastCompleteResult(): SpeedTestResult | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(LAST_RESULT_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SpeedTestResult
    return parsed && parsed.status === 'complete' ? parsed : null
  } catch {
    return null
  }
}

export function writeLastCompleteResult(result: SpeedTestResult): void {
  if (typeof window === 'undefined' || result.status !== 'complete') return
  try {
    window.sessionStorage.setItem(LAST_RESULT_SESSION_KEY, JSON.stringify(result))
  } catch {
  }
}
