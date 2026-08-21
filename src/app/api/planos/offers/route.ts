import { listOffers, PlansProxyError } from '../../../../lib/plansProxy'
import { offersRequestLimiter } from '../../../../lib/plansRateLimit'

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

// Listagem objetiva, não personalizada (Issue #10: "pode ser usado quando a
// experiência precisar apenas listar ofertas objetivas"). Não é chamado
// como fallback automático de `/api/planos/recommendations` — só quando a
// UI pedir explicitamente uma listagem sem ranking/recomendação.
export async function GET(request: Request) {
  const correlationId = crypto.randomUUID()
  const rateLimit = offersRequestLimiter.consume(clientKey(request.headers))
  if (!rateLimit.allowed) {
    return Response.json({ error: 'PLANS_RATE_LIMITED', retryable: true }, {
      status: 429,
      headers: { 'x-correlation-id': correlationId, 'retry-after': String(rateLimit.retryAfterSeconds) },
    })
  }

  const ibge = new URL(request.url).searchParams.get('ibge')?.trim() ?? ''
  if (!ibge) {
    return json({ error: 'PLANS_IBGE_MISSING', retryable: false }, 400, correlationId)
  }

  try {
    const offers = await listOffers(ibge, {
      apiUrl: process.env.SIGNALLQ_PLANS_API_URL,
      apiKey: process.env.SIGNALLQ_PLANS_API_KEY,
      correlationId,
      signal: request.signal,
    })
    return json(offers, 200, correlationId)
  } catch (error) {
    const failure = error instanceof PlansProxyError ? error : new PlansProxyError('PLANS_UPSTREAM_UNAVAILABLE', 503)
    return json({ error: failure.code, retryable: failure.status >= 500 }, failure.status, correlationId)
  }
}
