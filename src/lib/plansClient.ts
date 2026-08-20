// Wrapper client-side para as três rotas internas de `/planos`. O
// navegador nunca chama `signallq-plans` nem ViaCEP diretamente — só estas
// Route Handlers, que guardam a chave/URL real do backend server-side.
import type { LocationResult, OffersResult, RecommendationRequest, RecommendationResult } from './plansContract'

export interface PlansClientError {
  code: string
  retryable: boolean
}

export type PlansClientResult<T> = { ok: true; data: T } | { ok: false; error: PlansClientError }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<PlansClientResult<T>> {
  let response: Response
  try {
    response = await fetch(input, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, error: { code: 'PLANS_REQUEST_CANCELLED', retryable: false } }
    }
    return { ok: false, error: { code: 'PLANS_NETWORK_ERROR', retryable: true } }
  }

  let body: unknown = null
  try { body = await response.json() } catch { /* corpo vazio/; tratado abaixo pelo status */ }

  if (!response.ok) {
    const code = isRecord(body) && typeof body.error === 'string' ? body.error : 'PLANS_UPSTREAM_UNAVAILABLE'
    const retryable = isRecord(body) && typeof body.retryable === 'boolean' ? body.retryable : response.status >= 500
    return { ok: false, error: { code, retryable } }
  }

  return { ok: true, data: body as T }
}

export function fetchLocation(cep: string, signal?: AbortSignal): Promise<PlansClientResult<LocationResult>> {
  return requestJson(`/api/planos/location?cep=${encodeURIComponent(cep)}`, { signal })
}

/** Listagem objetiva não personalizada — só chamar quando a UI pedir
 * explicitamente essa visão, nunca como fallback automático de recomendação. */
export function fetchOffers(ibge: string, signal?: AbortSignal): Promise<PlansClientResult<OffersResult>> {
  return requestJson(`/api/planos/offers?ibge=${encodeURIComponent(ibge)}`, { signal })
}

export function fetchRecommendations(
  request: RecommendationRequest,
  signal?: AbortSignal,
): Promise<PlansClientResult<RecommendationResult>> {
  return requestJson('/api/planos/recommendations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })
}
