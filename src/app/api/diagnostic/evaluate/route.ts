import { DiagnosticProxyError, evaluateDiagnostic, FixedWindowRateLimiter, sanitizeDiagnosticSnapshot } from '../../../../lib/diagnosticProxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const REQUEST_LIMIT = 30
const REQUEST_WINDOW_MS = 60_000
export const diagnosticRequestLimiter = new FixedWindowRateLimiter(REQUEST_LIMIT, REQUEST_WINDOW_MS)

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
  const rateLimit = diagnosticRequestLimiter.consume(clientKey(request.headers))
  if (!rateLimit.allowed) {
    return Response.json({ error: 'DIAGNOSTIC_RATE_LIMITED', retryable: true }, {
      status: 429,
      headers: { 'x-correlation-id': correlationId, 'retry-after': String(rateLimit.retryAfterSeconds) },
    })
  }
  let body: unknown
  try { body = await request.json() } catch {
    return json({ error: 'DIAGNOSTIC_REQUEST_INVALID', details: ['O corpo deve ser JSON válido.'] }, 400, correlationId)
  }

  const snapshot = sanitizeDiagnosticSnapshot(body)
  if (!snapshot) {
    return json({ error: 'DIAGNOSTIC_REQUEST_INVALID', details: ['schemaVersion 6 é obrigatório; dados identificáveis não são aceitos.'] }, 400, correlationId)
  }

  try {
    const report = await evaluateDiagnostic(snapshot, {
      workerUrl: process.env.DIAGNOSTIC_WORKER_URL,
      correlationId,
      signal: request.signal,
    })
    return json(report, 200, correlationId)
  } catch (error) {
    const failure = error instanceof DiagnosticProxyError
      ? error
      : new DiagnosticProxyError('DIAGNOSTIC_UPSTREAM_UNAVAILABLE', 503)
    return json({ error: failure.code, retryable: failure.status >= 500, ...(failure.details?.length ? { details: failure.details } : {}) }, failure.status, correlationId)
  }
}
