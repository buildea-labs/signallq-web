import { afterEach, describe, expect, it, vi } from 'vitest'
import { offersRequestLimiter } from '../../../../lib/plansRateLimit'
import { GET } from './route'

const originalApiUrl = process.env.SIGNALLQ_PLANS_API_URL

afterEach(() => {
  vi.unstubAllGlobals()
  offersRequestLimiter.clear()
  if (originalApiUrl === undefined) delete process.env.SIGNALLQ_PLANS_API_URL
  else process.env.SIGNALLQ_PLANS_API_URL = originalApiUrl
})

describe('GET /api/planos/offers', () => {
  it('exige ibge', async () => {
    const response = await GET(new Request('http://localhost/api/planos/offers'))
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe('PLANS_IBGE_MISSING')
  })

  it('sem SIGNALLQ_PLANS_API_URL configurada, devolve erro tratado', async () => {
    delete process.env.SIGNALLQ_PLANS_API_URL
    const response = await GET(new Request('http://localhost/api/planos/offers?ibge=3550308'))
    expect(response.status).toBe(503)
    expect((await response.json()).error).toBe('PLANS_SERVICE_NOT_CONFIGURED')
  })

  it('repassa a listagem objetiva do backend sem alterar a ordem', async () => {
    process.env.SIGNALLQ_PLANS_API_URL = 'https://plans.example.com'
    const offers = { ibge: '3550308', offers: [] }
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(offers), { status: 200 })))
    const response = await GET(new Request('http://localhost/api/planos/offers?ibge=3550308'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(offers)
  })
})
