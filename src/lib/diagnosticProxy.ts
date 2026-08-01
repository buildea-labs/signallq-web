import {
  DIAGNOSTIC_API_PATH,
  DIAGNOSTIC_SNAPSHOT_SCHEMA_VERSION,
  type DiagnosticCard,
  type DiagnosticReportPayload,
  type DiagnosticSnapshot,
} from './diagnosticContract'

const UPSTREAM_TIMEOUT_MS = 4_000
const MAX_UPSTREAM_ATTEMPTS = 2

export type DiagnosticProxyFailure =
  | 'DIAGNOSTIC_SERVICE_NOT_CONFIGURED'
  | 'DIAGNOSTIC_UPSTREAM_TIMEOUT'
  | 'DIAGNOSTIC_UPSTREAM_UNAVAILABLE'
  | 'DIAGNOSTIC_UPSTREAM_REJECTED'
  | 'DIAGNOSTIC_UPSTREAM_INVALID_RESPONSE'
  | 'DIAGNOSTIC_REQUEST_CANCELLED'

export class DiagnosticProxyError extends Error {
  constructor(public readonly code: DiagnosticProxyFailure, public readonly status: number, public readonly details?: string[]) {
    super(code)
  }
}

/** In-memory containment for a single Route Handler instance; not a quota system. */
export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, { count: number; windowStartedAt: number }>()

  constructor(private readonly limit: number, private readonly windowMs: number) {}

  consume(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    for (const [entryKey, entry] of this.entries) {
      if (now - entry.windowStartedAt >= this.windowMs) this.entries.delete(entryKey)
    }
    const current = this.entries.get(key)
    const entry = !current || now - current.windowStartedAt >= this.windowMs
      ? { count: 0, windowStartedAt: now }
      : current
    entry.count += 1
    this.entries.set(key, entry)
    return {
      allowed: entry.count <= this.limit,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.windowStartedAt + this.windowMs - now) / 1_000)),
    }
  }

  clear() { this.entries.clear() }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function optionalNumber(value: unknown): number | undefined {
  return isNumber(value) ? value : undefined
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T
}

function safeObject(value: unknown, fields: string[]): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined
  return compact(Object.fromEntries(fields.map((field) => [field, value[field]])))
}

/**
 * Projects browser input onto the documented, non-identifying Web contract.
 * Unknown properties are deliberately not forwarded: they can include local IPs,
 * browser identifiers or fields that are irrelevant to the official engine.
 */
export function sanitizeDiagnosticSnapshot(input: unknown): DiagnosticSnapshot | null {
  if (!isRecord(input) || !Number.isInteger(input.schemaVersion)) return null
  if (input.schemaVersion !== DIAGNOSTIC_SNAPSHOT_SCHEMA_VERSION) return null

  const connection = safeObject(input.connection, ['type', 'hasInternet', 'ipv6Available'])
  const speed = safeObject(input.speed, ['downloadMbps', 'uploadMbps'])
  const quality = safeObject(input.quality, ['latencyMs', 'jitterMs', 'packetLossPercent', 'loadedLatencyMs'])
  const dns = safeObject(input.dns, ['latencyMs', 'currentProvider'])

  const snapshot: DiagnosticSnapshot = { schemaVersion: input.schemaVersion }
  const appVersion = optionalString(input.appVersion)
  const platform = optionalString(input.platform)
  if (appVersion) snapshot.appVersion = appVersion
  if (platform) snapshot.platform = platform
  if (connection && Object.keys(connection).length > 0) snapshot.connection = compact({
    type: optionalString(connection.type), hasInternet: optionalBoolean(connection.hasInternet), ipv6Available: optionalBoolean(connection.ipv6Available),
  })
  if (speed && Object.keys(speed).length > 0) snapshot.speed = compact({
    downloadMbps: optionalNumber(speed.downloadMbps), uploadMbps: optionalNumber(speed.uploadMbps),
  })
  if (quality && Object.keys(quality).length > 0) snapshot.quality = compact({
    latencyMs: optionalNumber(quality.latencyMs), jitterMs: optionalNumber(quality.jitterMs),
    packetLossPercent: optionalNumber(quality.packetLossPercent), loadedLatencyMs: optionalNumber(quality.loadedLatencyMs),
  })
  if (dns && Object.keys(dns).length > 0) snapshot.dns = compact({
    latencyMs: optionalNumber(dns.latencyMs), currentProvider: optionalString(dns.currentProvider),
  })
  return snapshot
}

function isCard(value: unknown): value is DiagnosticCard {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && typeof value.titulo === 'string'
    && ['ok', 'info', 'attention', 'critical', 'inconclusive'].includes(String(value.status))
    && (typeof value.evidencia === 'string' || value.evidencia === null)
    && typeof value.mensagemUsuario === 'string'
    && (typeof value.recomendacao === 'string' || value.recomendacao === null)
    && typeof value.categoria === 'string' && typeof value.podeConcluir === 'boolean'
    && (typeof value.categoriaOrigem === 'string' || value.categoriaOrigem === null)
}

function isCardArray(value: unknown): boolean {
  return Array.isArray(value) && value.every(isCard)
}

function isAiAssist(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.expectedOutputSchema)) return false
  return Number.isInteger(value.version) && value.mode === 'single_shot_explainer'
    && typeof value.shouldInvoke === 'boolean' && typeof value.reason === 'string'
    && typeof value.systemPrompt === 'string' && typeof value.userPrompt === 'string'
    && value.expectedOutputSchema.format === 'json'
    && Array.isArray(value.expectedOutputSchema.fields)
    && value.expectedOutputSchema.fields.every((field) => typeof field === 'string')
}

function validationErrorDetails(value: unknown): string[] | null {
  if (!isRecord(value) || typeof value.error !== 'string') return null
  if (value.details !== undefined && (!Array.isArray(value.details) || !value.details.every((detail) => typeof detail === 'string'))) return null
  return (value.details as string[] | undefined) ?? []
}

/** Runtime guard for the public Worker payload; it never rewrites conclusions. */
export function isDiagnosticReportPayload(value: unknown): value is DiagnosticReportPayload {
  if (!isRecord(value)) return false
  const cardArrays = ['wifiResultados', 'internetResultados', 'mobileResultados', 'fibraResultados', 'dnsResultados', 'historicoResultados', 'wifiCanalResultados', 'redeResultados', 'achadosSecundarios', 'hipotesesDescartadas', 'recomendacoes']
  if (!['REMOTE', 'CACHED_LOCAL', 'BUNDLED_LOCAL'].includes(String(value.evaluationSource)) || !isCard(value.decisao)) return false
  if (!cardArrays.every((field) => isCardArray(value[field]))) return false
  if (!Array.isArray(value.dadosAusentes) || !value.dadosAusentes.every((item) => typeof item === 'string')) return false
  if (!Array.isArray(value.limitacoesEquipamentoLocal) || !value.limitacoesEquipamentoLocal.every((item) => typeof item === 'string')) return false
  if (!isRecord(value.scoreEngineResultado) || !isNumber(value.scoreEngineResultado.score) || typeof value.scoreEngineResultado.veredictoHumano !== 'string' || !Array.isArray(value.scoreEngineResultado.dimensoes)) return false
  if (!value.scoreEngineResultado.dimensoes.every((item) => isRecord(item) && typeof item.id === 'string' && isNumber(item.score))) return false
  if (!Array.isArray(value.perfisUso) || !value.perfisUso.every((item) => isRecord(item) && typeof item.profileId === 'string' && typeof item.label === 'string' && ['ok', 'info', 'attention', 'critical', 'inconclusive'].includes(String(item.status)))) return false
  if (!Array.isArray(value.gameReadiness) || !value.gameReadiness.every((item) => isRecord(item) && typeof item.profileCode === 'string' && typeof item.label === 'string' && ['bom', 'atencao', 'ruim', 'sem_dados'].includes(String(item.status)))) return false
  if (Object.hasOwn(value, 'aiAssist') && !isAiAssist(value.aiAssist)) return false
  return isNumber(value.geradoEmMs)
}

function upstreamUrl(workerUrl: string): string {
  return `${workerUrl.replace(/\/$/, '')}${DIAGNOSTIC_API_PATH}`
}

export async function evaluateDiagnostic(
  snapshot: DiagnosticSnapshot,
  options: { workerUrl?: string; correlationId: string; signal: AbortSignal; timeoutMs?: number; maxAttempts?: number },
): Promise<DiagnosticReportPayload> {
  const workerUrl = options.workerUrl?.trim()
  if (!workerUrl) throw new DiagnosticProxyError('DIAGNOSTIC_SERVICE_NOT_CONFIGURED', 503)
  const timeoutMs = options.timeoutMs ?? UPSTREAM_TIMEOUT_MS
  const maxAttempts = options.maxAttempts ?? MAX_UPSTREAM_ATTEMPTS

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const timeout = AbortSignal.timeout(timeoutMs)
    const signal = AbortSignal.any([options.signal, timeout])
    try {
      const response = await fetch(upstreamUrl(workerUrl), {
        method: 'POST', cache: 'no-store', signal,
        headers: { accept: 'application/json', 'content-type': 'application/json', 'x-correlation-id': options.correlationId },
        body: JSON.stringify(snapshot),
      })
      if (!response.ok) {
        if (response.status === 400) {
          let errorBody: unknown
          try { errorBody = await response.json() } catch { throw new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_INVALID_RESPONSE', 502) }
          const details = validationErrorDetails(errorBody)
          if (details === null) throw new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_INVALID_RESPONSE', 502)
          throw new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_REJECTED', 400, details)
        }
        if (response.status >= 500 && attempt < maxAttempts) continue
        throw new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_UNAVAILABLE', 503)
      }
      let payload: unknown
      try { payload = await response.json() } catch { throw new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_INVALID_RESPONSE', 502) }
      if (!isDiagnosticReportPayload(payload)) throw new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_INVALID_RESPONSE', 502)
      return payload
    } catch (error) {
      if (error instanceof DiagnosticProxyError) throw error
      if (options.signal.aborted) throw new DiagnosticProxyError('DIAGNOSTIC_REQUEST_CANCELLED', 499)
      if (timeout.aborted) {
        if (attempt < maxAttempts) continue
        throw new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_TIMEOUT', 504)
      }
      if (attempt === maxAttempts) throw new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_UNAVAILABLE', 503)
    }
  }
  throw new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_UNAVAILABLE', 503)
}
