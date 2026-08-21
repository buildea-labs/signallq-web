import { afterEach, describe, expect, it, vi } from 'vitest'
import { locationRequestLimiter } from '../../../../lib/plansRateLimit'
import { GET } from './route'

const originalApiUrl = process.env.SIGNALLQ_PLANS_API_URL

function request(cep: string): Request {
  return new Request(`http://localhost/api/planos/location?cep=${cep}`)
}

afterEach(() => {
  vi.unstubAllGlobals()
  locationRequestLimiter.clear()
  if (originalApiUrl === undefined) delete process.env.SIGNALLQ_PLANS_API_URL
  else process.env.SIGNALLQ_PLANS_API_URL = originalApiUrl
})

describe('GET /api/planos/location', () => {
  it('recusa CEP com formato inválido antes de chamar o backend', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const response = await GET(request('123'))
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe('PLANS_CEP_INVALID')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sem SIGNALLQ_PLANS_API_URL configurada, devolve erro tratado (nunca URL inventada)', async () => {
    delete process.env.SIGNALLQ_PLANS_API_URL
    const response = await GET(request('01310000'))
    expect(response.status).toBe(503)
    expect((await response.json()).error).toBe('PLANS_SERVICE_NOT_CONFIGURED')
  })

  it('repassa a localização resolvida pelo backend configurado (desembrulhando data.*)', async () => {
    process.env.SIGNALLQ_PLANS_API_URL = 'https://plans.example.com'
    const location = { cep: '01310000', city: 'São Paulo', state: 'SP', ibge: '3550308' }
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: location, meta: { apiVersion: 'v1' } }), { status: 200 })),
    )
    const response = await GET(request('01310000'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(location)
  })
})
