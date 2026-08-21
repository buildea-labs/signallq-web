import { PlansProxyError, resolveLocation } from '../../../../lib/plansProxy'
import { locationRequestLimiter } from '../../../../lib/plansRateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Só valida o formato (8 dígitos) — a normalização e resolução real
// (município/UF/IBGE) é sempre do `signallq-plans` (GET /api/v1/location),
// nunca do ViaCEP direto nem de lógica local.
const CEP_FORMAT = /^\d{8}$/

function json(body: unknown, status: number, correlationId: string) {
  return Response.json(body, { status, headers: { 'x-correlation-id': correlationId } })
}

function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = headers.get('x-real-ip')?.trim()
  return `ip:${forwarded || realIp || 'anonymous'}`
}

export async function GET(request: Request) {
  const correlationId = crypto.randomUUID()
  const rateLimit = locationRequestLimiter.consume(clientKey(request.headers))
  if (!rateLimit.allowed) {
    return Response.json({ error: 'PLANS_RATE_LIMITED', retryable: true }, {
      status: 429,
      headers: { 'x-correlation-id': correlationId, 'retry-after': String(rateLimit.retryAfterSeconds) },
    })
  }

  const cepRaw = new URL(request.url).searchParams.get('cep') ?? ''
  const cep = cepRaw.replace(/\D/g, '')
  if (!CEP_FORMAT.test(cep)) {
    return json({ error: 'PLANS_CEP_INVALID', retryable: false }, 400, correlationId)
  }

  try {
    const location = await resolveLocation(cep, {
      apiUrl: process.env.SIGNALLQ_PLANS_API_URL,
      apiKey: process.env.SIGNALLQ_PLANS_API_KEY,
      correlationId,
      signal: request.signal,
    })
    return json(location, 200, correlationId)
  } catch (error) {
    const failure = error instanceof PlansProxyError ? error : new PlansProxyError('PLANS_UPSTREAM_UNAVAILABLE', 503)
    return json(
      { error: failure.code, retryable: failure.status >= 500, ...(failure.details?.length ? { details: failure.details } : {}) },
      failure.status,
      correlationId,
    )
  }
}
