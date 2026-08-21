// Proxy server-side para o `signallq-plans` (Issue #10). Mesmo padrão de
// `diagnosticProxy.ts`: o navegador nunca fala com o backend real nem com
// ViaCEP — só com as Route Handlers deste site, que repassam a chamada
// guardando `SIGNALLQ_PLANS_API_KEY` como secret.
//
// SIGNALLQ_PLANS_API_URL aponta hoje para o Worker real, já deployado
// (https://signallq-plans.buildealabs.workers.dev — #4-#9/#13 concluídas e
// verificadas ao vivo). O parsing abaixo (envelope { data, meta }, nomes de
// campo, códigos de erro) reflete respostas reais observadas, não mais a
// documentação especulativa da Issue #10.
import type {
  LocationResult,
  MarketTier,
  Offer,
  OfferClassification,
  OffersResult,
  RankedOffer,
  RecommendationRequest,
  RecommendationResult,
} from './plansContract'

const PLANS_API_TIMEOUT_MS = 4_000
const MAX_UPSTREAM_ATTEMPTS = 2

export type PlansProxyFailure =
  | 'PLANS_SERVICE_NOT_CONFIGURED'
  | 'PLANS_UPSTREAM_TIMEOUT'
  | 'PLANS_UPSTREAM_UNAVAILABLE'
  | 'PLANS_UPSTREAM_INVALID_RESPONSE'
  | 'PLANS_REQUEST_CANCELLED'
  | 'PLANS_CEP_INVALID'
  | 'PLANS_CEP_NOT_FOUND'
  | 'PLANS_IBGE_INVALID'
  | 'PLANS_PROFILE_INVALID'

export class PlansProxyError extends Error {
  constructor(public readonly code: PlansProxyFailure, public readonly status: number) {
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

// ---------------------------------------------------------------------------
// Response validators — guard against a malformed/unexpected upstream body
// instead of trusting it blindly. Never invent a field that's missing.
// ---------------------------------------------------------------------------

function isLocationDto(value: unknown): value is LocationResult {
  return isRecord(value) && isString(value.cep) && isString(value.city) && isString(value.state) && isString(value.ibge)
}

function isOfferProvider(value: unknown): value is Offer['provider'] {
  return isRecord(value) && isString(value.code) && isString(value.name)
}

function isOfferValidity(value: unknown): value is Offer['validity'] {
  return isRecord(value) && (value.start === null || isString(value.start)) && (value.end === null || isString(value.end))
}

function isOffer(value: unknown): value is Offer {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isOfferProvider(value.provider) &&
    isString(value.providerOfferId) &&
    isString(value.name) &&
    isString(value.serviceType) &&
    typeof value.price === 'number' &&
    isNumberOrNull(value.promoPrice) &&
    isNumberOrNull(value.postPromoPrice) &&
    isNumberOrNull(value.downloadMbps) &&
    isNumberOrNull(value.uploadMbps) &&
    isStringArray(value.technologies) &&
    isNumberOrNull(value.fidelityMonths) &&
    (value.officialUrl === null || isString(value.officialUrl)) &&
    isOfferValidity(value.validity) &&
    isString(value.source)
  )
}

function isOffersResponse(value: unknown): value is { data: OffersResult; meta: { count: number; apiVersion: string } } {
  return (
    isRecord(value) &&
    isRecord(value.data) &&
    isString(value.data.ibge) &&
    Array.isArray(value.data.offers) &&
    value.data.offers.every(isOffer)
  )
}

const OFFER_CLASSIFICATIONS: OfferClassification[] = ['best_match', 'good_option', 'insufficient', 'overkill']
const MARKET_TIERS: MarketTier[] = ['LIGHT', 'MODERATE', 'CONNECTED_FAMILY', 'INTENSIVE', 'VERY_INTENSIVE']

function isRankedOffer(value: unknown): value is RankedOffer {
  if (!isOffer(value) || !isRecord(value)) return false
  const r = value.recommendation
  return (
    isRecord(r) &&
    typeof r.score === 'number' &&
    OFFER_CLASSIFICATIONS.includes(r.classification as OfferClassification) &&
    isStringArray(r.reasonCodes)
  )
}

function isBandwidthRange(value: unknown): value is RecommendationResult['recommendedRange'] {
  return isRecord(value) && typeof value.minMbps === 'number' && typeof value.idealMbps === 'number' && typeof value.maxUsefulMbps === 'number'
}

function isUploadRange(value: unknown): value is RecommendationResult['recommendedUploadRange'] {
  return isRecord(value) && typeof value.minMbps === 'number' && typeof value.idealMbps === 'number'
}

function isCurrentPlanComparison(value: unknown): value is RecommendationResult['currentPlanComparison'] {
  if (value === null) return true
  return (
    isRecord(value) &&
    ['below_range', 'within_range', 'above_range', 'unknown'].includes(String(value.status)) &&
    isStringArray(value.reasonCodes)
  )
}

function isRecommendationsResponse(value: unknown): value is {
  data: {
    ibge: string
    recommendation: {
      engineVersion: string
      marketTier: MarketTier
      recommendedRange: RecommendationResult['recommendedRange']
      recommendedUploadRange: RecommendationResult['recommendedUploadRange']
      availabilityFit: RecommendationResult['availabilityFit']
      profileReasonCodes: string[]
      currentPlanComparison: RecommendationResult['currentPlanComparison']
    }
    offers: RankedOffer[]
  }
} {
  if (!isRecord(value) || !isRecord(value.data)) return false
  const d = value.data
  if (!isString(d.ibge) || !isRecord(d.recommendation) || !Array.isArray(d.offers) || !d.offers.every(isRankedOffer)) return false
  const rec = d.recommendation
  return (
    isString(rec.engineVersion) &&
    MARKET_TIERS.includes(rec.marketTier as MarketTier) &&
    isBandwidthRange(rec.recommendedRange) &&
    isUploadRange(rec.recommendedUploadRange) &&
    ['in_range_available', 'only_alternatives_available', 'no_offers'].includes(String(rec.availabilityFit)) &&
    isStringArray(rec.profileReasonCodes) &&
    isCurrentPlanComparison(rec.currentPlanComparison)
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
    typeof p.frequentLargeUploads !== 'boolean' ||
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
      frequentLargeUploads: p.frequentLargeUploads,
      alwaysOnDevices: p.alwaysOnDevices,
    },
  }
  if (
    isRecord(input.currentConnection) &&
    typeof input.currentConnection.downloadMbps === 'number' &&
    typeof input.currentConnection.uploadMbps === 'number' &&
    typeof input.currentConnection.latencyMs === 'number'
  ) {
    request.currentConnection = {
      downloadMbps: input.currentConnection.downloadMbps,
      uploadMbps: input.currentConnection.uploadMbps,
      latencyMs: input.currentConnection.latencyMs,
    }
  }
  if (isRecord(input.currentPlan)) {
    const c = input.currentPlan
    request.currentPlan = {
      contractedDownloadMbps: typeof c.contractedDownloadMbps === 'number' ? c.contractedDownloadMbps : null,
      contractedUploadMbps: typeof c.contractedUploadMbps === 'number' ? c.contractedUploadMbps : null,
      monthlyPriceBrl: typeof c.monthlyPriceBrl === 'number' ? c.monthlyPriceBrl : null,
    }
  }
  return request
}

// ---------------------------------------------------------------------------
// Upstream error mapping — o backend já devolve { error: { code, message } }
// estruturado; mapeamos os códigos conhecidos 1:1 em vez de inferir só pelo
// status HTTP.
// ---------------------------------------------------------------------------

const KNOWN_BACKEND_ERROR_MAP: Record<string, PlansProxyFailure> = {
  INVALID_CEP: 'PLANS_CEP_INVALID',
  CEP_NOT_FOUND: 'PLANS_CEP_NOT_FOUND',
  LOCATION_UNAVAILABLE: 'PLANS_UPSTREAM_UNAVAILABLE',
  INVALID_IBGE: 'PLANS_IBGE_INVALID',
  CATALOG_UNAVAILABLE: 'PLANS_UPSTREAM_UNAVAILABLE',
  INVALID_PROFILE: 'PLANS_PROFILE_INVALID',
}

async function mapErrorResponse(response: Response): Promise<PlansProxyError> {
  // 5xx sem corpo estruturado (proxy/infra na frente do Worker, timeout de
  // borda, etc.) é "serviço indisponível" — não "formato inesperado". Só
  // 4xx sem corpo parseável é tratado como INVALID_RESPONSE: nessa faixa um
  // corpo malformado é mesmo uma resposta inesperada do backend, não uma
  // falha de infraestrutura de fora dele.
  const unparseableFallback = response.status >= 500
    ? new PlansProxyError('PLANS_UPSTREAM_UNAVAILABLE', response.status)
    : new PlansProxyError('PLANS_UPSTREAM_INVALID_RESPONSE', 502)

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return unparseableFallback
  }
  const code = isRecord(body) && isRecord(body.error) && isString(body.error.code) ? body.error.code : null
  const mapped = code ? KNOWN_BACKEND_ERROR_MAP[code] : undefined
  if (mapped) return new PlansProxyError(mapped, response.status)
  return unparseableFallback
}

async function callUpstream(path: string, init: RequestInit, options: ProxyOptions): Promise<unknown> {
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
      if (!response.ok) {
        if (response.status >= 500 && attempt < maxAttempts) continue
        throw await mapErrorResponse(response)
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
  if (!isRecord(payload) || !isLocationDto(payload.data)) throw new PlansProxyError('PLANS_UPSTREAM_INVALID_RESPONSE', 502)
  return payload.data
}

export async function listOffers(ibge: string, options: ProxyOptions): Promise<OffersResult> {
  const payload = await callUpstream(`/api/v1/offers?ibge=${encodeURIComponent(ibge)}`, { method: 'GET' }, options)
  if (!isOffersResponse(payload)) throw new PlansProxyError('PLANS_UPSTREAM_INVALID_RESPONSE', 502)
  return payload.data
}

export async function getRecommendations(request: RecommendationRequest, options: ProxyOptions): Promise<RecommendationResult> {
  const payload = await callUpstream(
    '/api/v1/recommendations',
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) },
    options,
  )
  if (!isRecommendationsResponse(payload)) throw new PlansProxyError('PLANS_UPSTREAM_INVALID_RESPONSE', 502)
  const { recommendation } = payload.data
  return {
    engineVersion: recommendation.engineVersion,
    marketTier: recommendation.marketTier,
    recommendedRange: recommendation.recommendedRange,
    recommendedUploadRange: recommendation.recommendedUploadRange,
    availabilityFit: recommendation.availabilityFit,
    profileReasonCodes: recommendation.profileReasonCodes,
    currentPlanComparison: recommendation.currentPlanComparison,
    offers: payload.data.offers,
  }
}
