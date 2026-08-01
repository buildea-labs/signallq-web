import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DiagnosticReportPayload } from '../../../../lib/diagnosticContract'
import { evaluateDiagnostic, FixedWindowRateLimiter } from '../../../../lib/diagnosticProxy'
import { diagnosticRequestLimiter, POST } from './route'

const configuredWorkerUrl = 'https://diagnostic.example.workers.dev/'
const originalWorkerUrl = process.env.DIAGNOSTIC_WORKER_URL

const report: DiagnosticReportPayload = {
  evaluationSource: 'REMOTE',
  wifiResultados: [], internetResultados: [], mobileResultados: [], fibraResultados: [], dnsResultados: [],
  historicoResultados: [], wifiCanalResultados: [], redeResultados: [], achadosSecundarios: [],
  hipotesesDescartadas: [], dadosAusentes: [], limitacoesEquipamentoLocal: [], recomendacoes: [],
  decisao: {
    id: 'DECISAO-INCONCLUSIVO', titulo: 'Sem dados suficientes', status: 'inconclusive', evidencia: null,
    mensagemUsuario: 'Repita o teste.', recomendacao: null, categoria: 'decisao', podeConcluir: false, categoriaOrigem: null,
  },
  scoreEngineResultado: { score: 0, veredictoHumano: 'inconclusivo', dimensoes: [] },
  perfisUso: [], gameReadiness: [], geradoEmMs: 0,
}

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/diagnostic/evaluate', {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  diagnosticRequestLimiter.clear()
  if (originalWorkerUrl === undefined) delete process.env.DIAGNOSTIC_WORKER_URL
  else process.env.DIAGNOSTIC_WORKER_URL = originalWorkerUrl
})

describe('POST /api/diagnostic/evaluate', () => {
  it('forwards a sanitized official snapshot and an inconclusive Worker report without changing it', async () => {
    process.env.DIAGNOSTIC_WORKER_URL = configuredWorkerUrl
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(report), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request({
      schemaVersion: 6, sessionId: 'persistent-browser-id', appVersion: 'web-1', platform: 'web',
      connection: { type: 'WIFI', hasInternet: true, localIp: '192.168.0.2' },
      speed: { downloadMbps: 90, uploadMbps: 30 },
      wifiScan: { networks: [{ ssid: 'Casa', rssiDbm: -40 }] },
      localEquipment: { routerIp: '192.168.0.1' },
      historical: { testsCount7d: 9, avgDownload7d: 88 },
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(report)
    expect(response.headers.get('x-correlation-id')).toMatch(/^[0-9a-f-]{36}$/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://diagnostic.example.workers.dev/diagnostic/evaluate')
    expect(init?.headers).toMatchObject({ 'x-correlation-id': response.headers.get('x-correlation-id') })
    expect(JSON.parse(String(init?.body))).toEqual({
      schemaVersion: 6, appVersion: 'web-1', platform: 'web',
      connection: { type: 'WIFI', hasInternet: true }, speed: { downloadMbps: 90, uploadMbps: 30 },
    })
  })

  it('retries one transient upstream failure with the same correlation id', async () => {
    process.env.DIAGNOSTIC_WORKER_URL = configuredWorkerUrl
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(report), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request({ schemaVersion: 6 }))

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      'x-correlation-id': fetchMock.mock.calls[1][1]?.headers instanceof Headers
        ? fetchMock.mock.calls[1][1]?.headers.get('x-correlation-id')
        : response.headers.get('x-correlation-id'),
    })
  })

  it('rejects an incompatible request before it reaches the Worker', async () => {
    process.env.DIAGNOSTIC_WORKER_URL = configuredWorkerUrl
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(request({ schemaVersion: 5 }))

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'DIAGNOSTIC_REQUEST_INVALID' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports missing configuration and invalid upstream payloads honestly', async () => {
    delete process.env.DIAGNOSTIC_WORKER_URL
    const notConfigured = await POST(request({ schemaVersion: 6 }))
    expect(notConfigured.status).toBe(503)
    expect(await notConfigured.json()).toMatchObject({ error: 'DIAGNOSTIC_SERVICE_NOT_CONFIGURED', retryable: true })

    process.env.DIAGNOSTIC_WORKER_URL = configuredWorkerUrl
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))
    const invalidPayload = await POST(request({ schemaVersion: 6 }))
    expect(invalidPayload.status).toBe(502)
    expect(await invalidPayload.json()).toMatchObject({ error: 'DIAGNOSTIC_UPSTREAM_INVALID_RESPONSE', retryable: true })
  })

  it('accepts a valid optional aiAssist block and rejects a malformed one', async () => {
    process.env.DIAGNOSTIC_WORKER_URL = configuredWorkerUrl
    const reportWithAiAssist = {
      ...report,
      aiAssist: {
        version: 1, mode: 'single_shot_explainer', shouldInvoke: false, reason: 'not-needed',
        systemPrompt: 'system', userPrompt: 'user', expectedOutputSchema: { format: 'json', fields: ['summary'] },
      },
    }
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify(reportWithAiAssist), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...report, aiAssist: { version: 1 } }), { status: 200 })))

    expect((await POST(request({ schemaVersion: 6 }))).status).toBe(200)
    const malformed = await POST(request({ schemaVersion: 6 }))
    expect(malformed.status).toBe(502)
    expect(await malformed.json()).toMatchObject({ error: 'DIAGNOSTIC_UPSTREAM_INVALID_RESPONSE' })
  })

  it('preserves a valid Worker 400 and reports a network failure as unavailable', async () => {
    process.env.DIAGNOSTIC_WORKER_URL = configuredWorkerUrl
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ error: 'invalid snapshot', details: ['schemaVersion'] }), { status: 400 })))
    const rejected = await POST(request({ schemaVersion: 6 }))
    expect(rejected.status).toBe(400)
    expect(await rejected.json()).toMatchObject({ error: 'DIAGNOSTIC_UPSTREAM_REJECTED', details: ['schemaVersion'], retryable: false })

    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('network failed')))
    await expect(evaluateDiagnostic({ schemaVersion: 6 }, {
      workerUrl: configuredWorkerUrl, correlationId: 'network-failure', signal: new AbortController().signal, maxAttempts: 1,
    })).rejects.toMatchObject({ code: 'DIAGNOSTIC_UPSTREAM_UNAVAILABLE', status: 503 })
  })

  it('honors client cancellation without retrying', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new DOMException('cancelled', 'AbortError')))

    await expect(evaluateDiagnostic({ schemaVersion: 6 }, {
      workerUrl: configuredWorkerUrl, correlationId: 'cancelled', signal: controller.signal, maxAttempts: 2,
    })).rejects.toMatchObject({ code: 'DIAGNOSTIC_REQUEST_CANCELLED', status: 499 })
  })

  it('contains abuse in a deterministic fixed window and returns retry metadata', async () => {
    const limiter = new FixedWindowRateLimiter(2, 1_000)
    expect(limiter.consume('ip:1', 100).allowed).toBe(true)
    expect(limiter.consume('ip:1', 200).allowed).toBe(true)
    expect(limiter.consume('ip:1', 300)).toEqual({ allowed: false, retryAfterSeconds: 1 })
    expect(limiter.consume('ip:1', 1_100).allowed).toBe(true)

    delete process.env.DIAGNOSTIC_WORKER_URL
    for (let index = 0; index < 30; index += 1) await POST(request({ schemaVersion: 6 }, { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' }))
    const limited = await POST(request({ schemaVersion: 6 }, { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' }))
    expect(limited.status).toBe(429)
    expect(limited.headers.get('retry-after')).toMatch(/^\d+$/)
    expect(limited.headers.get('x-correlation-id')).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('turns a bounded upstream timeout into a retryable 504', async () => {
    const fetchMock = vi.fn<typeof fetch>((_input, init) => new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('timed out', 'AbortError')), { once: true })
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(evaluateDiagnostic({ schemaVersion: 6 }, {
      workerUrl: configuredWorkerUrl, correlationId: 'test-correlation', signal: new AbortController().signal,
      timeoutMs: 1, maxAttempts: 1,
    })).rejects.toMatchObject({ code: 'DIAGNOSTIC_UPSTREAM_TIMEOUT', status: 504 })
  })
})
