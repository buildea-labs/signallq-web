// Proxy server-side para o `signallq-plans` (Issue #10). Mesmo padrão de
// `diagnosticProxy.ts`: o navegador nunca fala com o backend real nem com
// ViaCEP — só com as Route Handlers deste site, que repassam a chamada
// guardando `SIGNALLQ_PLANS_API_KEY` como secret.
//
// `SIGNALLQ_PLANS_API_URL`/`SIGNALLQ_PLANS_API_KEY` não têm default: as
// issues #9 (`POST /recommendations`) e #13 (`GET /location`) do
// `signallq-plans` seguem abertas, sem URL real publicada. Sem a env var
// configurada, toda chamada falha limpo com `PLANS_SERVICE_NOT_CONFIGURED`
// em vez de apontar para um endpoint inventado.
import type {
  LocationResult,
  OffersResult,
  RecommendationRequest,
  RecommendationResult,
} from './plansContract'

const PLANS_API_TIMEOUT_MS = 4_000
const MAX_UPSTREAM_ATTEMPTS = 2

export type PlansProxyFailure =
  | 'PLANS_SERVICE_NOT_CONFIGURED'
  | 'PLANS_UPSTREAM_TIMEOUT'
  | 'PLANS_UPSTREAM_UNAVAILABLE'
  | 'PLANS_UPSTREAM_REJECTED'
  | 'PLANS_UPSTREAM_INVALID_RESPONSE'
  | 'PLANS_REQUEST_CANCELLED'
  | 'PLANS_CEP_NOT_FOUND'

export class PlansProxyError extends Error {
  constructor(public readonly code: PlansProxyFailure, public readonly status: number, public readonly details?: string[]) {
    super(code)
  }
}

interface ProxyOptions {
  apiUrl?: string
  apiKey?: string
  correlationId: string
  signal: AbortSignal
  timeoutMs?: number
  maxAttempts?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isStringArrayOrNull(value: unknown): value is string[] | null {
  return value === null || (Array.isArray(value) && value.every(isString))
}

function isLocationResult(value: unknown): value is LocationResult {
  return isRecord(value) && isString(value.cep) && isString(value.municipio) && isString(value.uf) && isString(value.ibge)
}

function isOffer(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.provider) &&
    isString(value.planName) &&
    isNumberOrNull(value.priceBRL) &&
    isNumberOrNull(value.downloadMbps) &&
    isNumberOrNull(value.uploadMbps) &&
    isStringArrayOrNull(value.technology) &&
    isNumberOrNull(value.fidelityMonths) &&
    (value.validFrom === null || isString(value.validFrom)) &&
    (value.validUntil === null || isString(value.validUntil)) &&
    (value.sourceCode === null || isString(value.sourceCode))
  )
}

function isOffersResult(value: unknown): value is OffersResult {
  return isRecord(value) && isString(value.ibge) && Array.isArray(value.offers) && value.offers.every(isOffer)
}

function isRankedOffer(value: unknown): boolean {
  return (
    isOffer(value) &&
    isRecord(value) &&
    typeof value.compatible === 'boolean' &&
    typeof value.score === 'number' &&
    Array.isArray(value.reasonCodes) &&
    value.reasonCodes.every(isString)
  )
}

function isRecommendedRange(value: unknown): boolean {
  return (
    isRecord(value) &&
    ['LIGHT', 'MODERATE', 'CONNECTED_FAMILY', 'INTENSIVE', 'VERY_INTENSIVE'].includes(String(value.tier)) &&
    isNumberOrNull(value.minMbps) &&
    isNumberOrNull(value.maxMbps) &&
    isString(value.label)
  )
}

function isRecommendationResult(value: unknown): value is RecommendationResult {
  return (
    isRecord(value) &&
    isString(value.engineVersion) &&
    isRecommendedRange(value.recommendedRange) &&
    Array.isArray(value.offers) &&
    value.offers.every(isRankedOffer)
  )
}

/** Projeta o corpo recebido do navegador no `RecommendationRequest` público
 * — campos desconhecidos nunca são repassados ao backend. */
export function sanitizeRecommendationRequest(input: unknown): RecommendationRequest | null {
  if (!isRecord(input) || !isString(input.ibge) || !isRecord(input.profile)) return null
  const p = input.profile
  if (
    typeof p.people !== 'number' ||
    typeof p.devices !== 'number' ||
    typeof p.streaming4k !== 'boolean' ||
    typeof p.gaming !== 'boolean' ||
    typeof p.homeOffice !== 'boolean' ||
    typeof p.largeUploads !== 'boolean' ||
    typeof p.alwaysOnDevices !== 'boolean'
  ) {
    return null
  }
  const request: RecommendationRequest = {
    ibge: input.ibge,
    profile: {
      people: p.people,
      devices: p.devices,
      streaming4k: p.streaming4k,
      gaming: p.gaming,
      homeOffice: p.homeOffice,
      largeUploads: p.largeUploads,
      alwaysOnDevices: p.alwaysOnDevices,
    },
  }
  if (isRecord(input.currentConnection)) {
    const c = input.currentConnection
    request.currentConnection = {
      ...(typeof c.downloadMbps === 'number' ? { downloadMbps: c.downloadMbps } : {}),
      ...(typeof c.uploadMbps === 'number' ? { uploadMbps: c.uploadMbps } : {}),
      ...(typeof c.latencyMs === 'number' ? { latencyMs: c.latencyMs } : {}),
    }
  }
  if (isRecord(input.currentPlan)) {
    const c = input.currentPlan
    request.currentPlan = {
      ...(typeof c.provider === 'string' ? { provider: c.provider } : {}),
      ...(typeof c.priceBRL === 'number' ? { priceBRL: c.priceBRL } : {}),
      ...(typeof c.downloadMbps === 'number' ? { downloadMbps: c.downloadMbps } : {}),
    }
  }
  return request
}

async function callUpstream(
  path: string,
  init: RequestInit,
  options: ProxyOptions,
): Promise<unknown> {
  const apiUrl = options.apiUrl?.trim()
  if (!apiUrl) throw new PlansProxyError('PLANS_SERVICE_NOT_CONFIGURED', 503)
  const timeoutMs = options.timeoutMs ?? PLANS_API_TIMEOUT_MS
  const maxAttempts = options.maxAttempts ?? MAX_UPSTREAM_ATTEMPTS
  const url = `${apiUrl.replace(/\/$/, '')}${path}`

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const timeout = AbortSignal.timeout(timeoutMs)
    const signal = AbortSignal.any([options.signal, timeout])
    try {
      const response = await fetch(url, {
        ...init,
        cache: 'no-store',
        signal,
        headers: {
          accept: 'application/json',
          'x-correlation-id': options.correlationId,
          ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
          ...init.headers,
        },
      })
      if (response.status === 404) throw new PlansProxyError('PLANS_CEP_NOT_FOUND', 404)
      if (!response.ok) {
        if (response.status === 400) {
          let errorBody: unknown
          try { errorBody = await response.json() } catch { throw new PlansProxyError('PLANS_UPSTREAM_INVALID_RESPONSE', 502) }
          const details = isRecord(errorBody) && Array.isArray(errorBody.details) && errorBody.details.every(isString)
            ? (errorBody.details as string[])
            : []
          throw new PlansProxyError('PLANS_UPSTREAM_REJECTED', 400, details)
        }
        if (response.status >= 500 && attempt < maxAttempts) continue
        throw new PlansProxyError('PLANS_UPSTREAM_UNAVAILABLE', 503)
      }
      try {
        return await response.json()
      } catch {
        throw new PlansProxyError('PLANS_UPSTREAM_INVALID_RESPONSE', 502)
      }
    } catch (error) {
      if (error instanceof PlansProxyError) throw error
      if (options.signal.aborted) throw new PlansProxyError('PLANS_REQUEST_CANCELLED', 499)
      if (timeout.aborted) {
        if (attempt < maxAttempts) continue
        throw new PlansProxyError('PLANS_UPSTREAM_TIMEOUT', 504)
      }
      if (attempt === maxAttempts) throw new PlansProxyError('PLANS_UPSTREAM_UNAVAILABLE', 503)
    }
  }
  throw new PlansProxyError('PLANS_UPSTREAM_UNAVAILABLE', 503)
}

export async function resolveLocation(cep: string, options: ProxyOptions): Promise<LocationResult> {
  const payload = await callUpstream(`/api/v1/location?cep=${encodeURIComponent(cep)}`, { method: 'GET' }, options)
  if (!isLocationResult(payload)) throw new PlansProxyError('PLANS_UPSTREAM_INVALID_RESPONSE', 502)
  return payload
}

export async function listOffers(ibge: string, options: ProxyOptions): Promise<OffersResult> {
  const payload = await callUpstream(`/api/v1/offers?ibge=${encodeURIComponent(ibge)}`, { method: 'GET' }, options)
  if (!isOffersResult(payload)) throw new PlansProxyError('PLANS_UPSTREAM_INVALID_RESPONSE', 502)
  return payload
}

export async function getRecommendations(request: RecommendationRequest, options: ProxyOptions): Promise<RecommendationResult> {
  const payload = await callUpstream(
    '/api/v1/recommendations',
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) },
    options,
  )
  if (!isRecommendationResult(payload)) throw new PlansProxyError('PLANS_UPSTREAM_INVALID_RESPONSE', 502)
  return payload
}
