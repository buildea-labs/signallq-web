import { copyMeasurement, shareMeasurement, type ShareOutcome } from './sharing'
import type { WebDiagnosticResponse } from './webDiagnosticResponse'
import type { SpeedTestResult } from './speedEngine'

function measurementPayload(result: SpeedTestResult, diagnostic: WebDiagnosticResponse | null) {
  return {
    timestamp: result.timestamp,
    downloadMbps: result.download.mbps,
    uploadMbps: result.upload.mbps,
    latencyMs: result.latency.ms,
    conclusion: diagnostic?.conclusion,
    nextAction: diagnostic?.nextAction,
  }
}

export function shareSpeedTestResult(result: SpeedTestResult, diagnostic: WebDiagnosticResponse | null): Promise<ShareOutcome> {
  return shareMeasurement(measurementPayload(result, diagnostic))
}

export function copySpeedTestResult(result: SpeedTestResult, diagnostic: WebDiagnosticResponse | null): Promise<ShareOutcome> {
  return copyMeasurement(measurementPayload(result, diagnostic))
}
