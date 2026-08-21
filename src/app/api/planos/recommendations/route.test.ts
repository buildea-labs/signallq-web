import { afterEach, describe, expect, it, vi } from 'vitest'
import { recommendationsRequestLimiter } from '../../../../lib/plansRateLimit'
import { POST } from './route'

const originalApiUrl = process.env.SIGNALLQ_PLANS_API_URL

const validProfile = { people: 2, devices: 4, streaming4k: true, gaming: false, homeOffice: true, frequentLargeUploads: false, alwaysOnDevices: false }

function request(body: unknown): Request {
  return new Request('http://localhost/api/planos/recommendations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  recommendationsRequestLimiter.clear()
  if (originalApiUrl === undefined) delete process.env.SIGNALLQ_PLANS_API_URL
  else process.env.SIGNALLQ_PLANS_API_URL = originalApiUrl
})

describe('POST /api/planos/recommendations', () => {
  it('rejeita corpo com profile incompleto sem chamar o backend', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const response = await POST(request({ ibge: '3550308', profile: { people: 2 } }))
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBe('PLANS_REQUEST_INVALID')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sem SIGNALLQ_PLANS_API_URL configurada, devolve erro tratado (integração real permanece gated)', async () => {
    delete process.env.SIGNALLQ_PLANS_API_URL
    const response = await POST(request({ ibge: '3550308', profile: validProfile }))
    expect(response.status).toBe(503)
    expect((await response.json()).error).toBe('PLANS_SERVICE_NOT_CONFIGURED')
  })

  it('repassa o resultado do backend sem recalcular faixa/score/ranking (achatando data.recommendation + data.offers)', async () => {
    process.env.SIGNALLQ_PLANS_API_URL = 'https://plans.example.com'
    const backendPayload = {
      data: {
        ibge: '3550308',
        recommendation: {
          engineVersion: 'v1',
          marketTier: 'CONNECTED_FAMILY',
          recommendedRange: { minMbps: 350, idealMbps: 425, maxUsefulMbps: 500 },
          recommendedUploadRange: { minMbps: 10, idealMbps: 17 },
          availabilityFit: 'no_offers',
          profileReasonCodes: [],
          currentPlanComparison: null,
        },
        offers: [],
      },
      meta: { apiVersion: 'v1', engineVersion: 'v1', count: 0 },
    }
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(backendPayload), { status: 200 })))
    const response = await POST(request({ ibge: '3550308', profile: validProfile }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      engineVersion: 'v1',
      marketTier: 'CONNECTED_FAMILY',
      recommendedRange: { minMbps: 350, idealMbps: 425, maxUsefulMbps: 500 },
      recommendedUploadRange: { minMbps: 10, idealMbps: 17 },
      availabilityFit: 'no_offers',
      profileReasonCodes: [],
      currentPlanComparison: null,
      offers: [],
    })
  })
})
