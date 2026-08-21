import { getRecommendations, PlansProxyError, sanitizeRecommendationRequest } from '../../../../lib/plansProxy'
import { recommendationsRequestLimiter } from '../../../../lib/plansRateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(body: unknown, status: number, correlationId: string) {
  return Response.json(body, { status, headers: { 'x-correlation-id': correlationId } })
}

function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = headers.get('x-real-ip')?.trim()
  return `ip:${forwarded || realIp || 'anonymous'}`
}

export async function POST(request: Request) {
  const correlationId = crypto.randomUUID()
  const rateLimit = recommendationsRequestLimiter.consume(clientKey(request.headers))
  if (!rateLimit.allowed) {
    return Response.json({ error: 'PLANS_RATE_LIMITED', retryable: true }, {
      status: 429,
      headers: { 'x-correlation-id': correlationId, 'retry-after': String(rateLimit.retryAfterSeconds) },
    })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return json({ error: 'PLANS_REQUEST_INVALID', retryable: false }, 400, correlationId)
  }

  const recommendationRequest = sanitizeRecommendationRequest(body)
  if (!recommendationRequest) {
    return json({ error: 'PLANS_REQUEST_INVALID', retryable: false }, 400, correlationId)
  }

  try {
    // O backend é a única autoridade sobre `recommendedRange`, `score` e
    // ordem das ofertas — esta rota só repassa e devolve a resposta
    // exatamente como recebida, sem recalcular nada.
    const result = await getRecommendations(recommendationRequest, {
      apiUrl: process.env.SIGNALLQ_PLANS_API_URL,
      apiKey: process.env.SIGNALLQ_PLANS_API_KEY,
      correlationId,
      signal: request.signal,
    })
    return json(result, 200, correlationId)
  } catch (error) {
    const failure = error instanceof PlansProxyError ? error : new PlansProxyError('PLANS_UPSTREAM_UNAVAILABLE', 503)
    return json({ error: failure.code, retryable: failure.status >= 500 }, failure.status, correlationId)
  }
}
