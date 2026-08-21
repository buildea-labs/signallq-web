import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OffersResult, RecommendationResult } from './plansContract'
import { getRecommendations, listOffers, PlansProxyError, resolveLocation, sanitizeRecommendationRequest } from './plansProxy'

afterEach(() => {
  vi.unstubAllGlobals()
})

const baseOptions = { apiUrl: 'https://plans.example.com', correlationId: 'test-correlation', signal: new AbortController().signal }

function backendError(code: string, status: number): Response {
  return new Response(JSON.stringify({ error: { code, message: 'mensagem do backend' } }), { status })
}

describe('plansProxy — GET /api/v1/location', () => {
  it('lança PLANS_SERVICE_NOT_CONFIGURED sem apiUrl configurada, sem inventar endpoint', async () => {
    await expect(resolveLocation('01310000', { ...baseOptions, apiUrl: undefined })).rejects.toMatchObject({
      code: 'PLANS_SERVICE_NOT_CONFIGURED',
      status: 503,
    })
  })

  it('desembrulha data.{cep,city,state,ibge} do envelope real', async () => {
    const location = { cep: '01310000', city: 'São Paulo', state: 'SP', ibge: '3550308' }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: location, meta: { apiVersion: 'v1' } }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveLocation('01310000', baseOptions)
    expect(result).toEqual(location)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('https://plans.example.com/api/v1/location?cep=01310000')
  })

  it('mapeia o código real CEP_NOT_FOUND (404) para PLANS_CEP_NOT_FOUND', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(backendError('CEP_NOT_FOUND', 404))
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolveLocation('99999999', baseOptions)).rejects.toMatchObject({ code: 'PLANS_CEP_NOT_FOUND', status: 404 })
  })

  it('mapeia o código real INVALID_CEP (400) para PLANS_CEP_INVALID', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(backendError('INVALID_CEP', 400))
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolveLocation('123', baseOptions)).rejects.toMatchObject({ code: 'PLANS_CEP_INVALID', status: 400 })
  })

  it('mapeia o código real LOCATION_UNAVAILABLE (503) para PLANS_UPSTREAM_UNAVAILABLE', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(backendError('LOCATION_UNAVAILABLE', 503))
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolveLocation('01310000', baseOptions)).rejects.toMatchObject({ code: 'PLANS_UPSTREAM_UNAVAILABLE', status: 503 })
  })

  it('rejeita resposta com formato inválido em vez de repassar dado incompleto', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: { cep: '123' } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolveLocation('01310000', baseOptions)).rejects.toMatchObject({ code: 'PLANS_UPSTREAM_INVALID_RESPONSE', status: 502 })
  })
})

describe('plansProxy — GET /api/v1/offers', () => {
  it('desembrulha data.{ibge,offers} sem alterar a ordem recebida', async () => {
    const offers: OffersResult = {
      ibge: '3550308',
      offers: [
        {
          id: 'PROVIDER_A:o1', provider: { code: 'PROVIDER_A', name: 'Provider A' }, providerOfferId: 'o1', name: 'Plano A',
          serviceType: 'SCM', price: 99.9, promoPrice: null, postPromoPrice: null, downloadMbps: 300, uploadMbps: 150,
          technologies: ['FTTH'], fidelityMonths: 12, officialUrl: null, validity: { start: null, end: null }, source: 'TEST',
        },
      ],
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: offers, meta: { count: 1, apiVersion: 'v1' } }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const result = await listOffers('3550308', baseOptions)
    expect(result).toEqual(offers)
  })

  it('mapeia o código real CATALOG_UNAVAILABLE (503) para PLANS_UPSTREAM_UNAVAILABLE', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(backendError('CATALOG_UNAVAILABLE', 503))
    vi.stubGlobal('fetch', fetchMock)
    await expect(listOffers('3550308', baseOptions)).rejects.toMatchObject({ code: 'PLANS_UPSTREAM_UNAVAILABLE', status: 503 })
  })
})

describe('plansProxy — POST /api/v1/recommendations', () => {
  const validRequest = {
    ibge: '3550308',
    profile: { people: 2, devices: 4, streaming4k: true, gaming: false, homeOffice: true, frequentLargeUploads: false, alwaysOnDevices: false },
  }

  it('repassa o corpo e achata data.recommendation + data.offers sem recalcular faixa/score/ranking', async () => {
    const backendPayload = {
      data: {
        ibge: '3550308',
        recommendation: {
          engineVersion: 'v1',
          marketTier: 'CONNECTED_FAMILY',
          recommendedRange: { minMbps: 350, idealMbps: 425, maxUsefulMbps: 500 },
          recommendedUploadRange: { minMbps: 10, idealMbps: 17 },
          availabilityFit: 'in_range_available',
          profileReasonCodes: [],
          currentPlanComparison: null,
        },
        offers: [
          {
            id: 'PROVIDER_A:o1', provider: { code: 'PROVIDER_A', name: 'Provider A' }, providerOfferId: 'o1', name: 'Plano A',
            serviceType: 'SCM', price: 99.9, promoPrice: null, postPromoPrice: null, downloadMbps: 600, uploadMbps: 300,
            technologies: ['FTTH'], fidelityMonths: 12, officialUrl: 'https://example.com', validity: { start: null, end: null },
            source: 'TEST', recommendation: { score: 92, classification: 'best_match', reasonCodes: ['download_within_ideal_range'] },
          },
        ],
      },
      meta: { apiVersion: 'v1', engineVersion: 'v1', count: 1 },
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(backendPayload), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result: RecommendationResult = await getRecommendations(validRequest, baseOptions)
    expect(result).toEqual({
      engineVersion: 'v1',
      marketTier: 'CONNECTED_FAMILY',
      recommendedRange: { minMbps: 350, idealMbps: 425, maxUsefulMbps: 500 },
      recommendedUploadRange: { minMbps: 10, idealMbps: 17 },
      availabilityFit: 'in_range_available',
      profileReasonCodes: [],
      currentPlanComparison: null,
      offers: backendPayload.data.offers,
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://plans.example.com/api/v1/recommendations')
    expect(JSON.parse(String(init?.body))).toEqual(validRequest)
  })

  it('mapeia o código real INVALID_PROFILE (400) para PLANS_PROFILE_INVALID', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(backendError('INVALID_PROFILE', 400))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getRecommendations(validRequest, baseOptions)).rejects.toMatchObject({ code: 'PLANS_PROFILE_INVALID', status: 400 })
  })

  it('mapeia 5xx persistente para PLANS_UPSTREAM_UNAVAILABLE (retryable)', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getRecommendations(validRequest, baseOptions)).rejects.toBeInstanceOf(PlansProxyError)
    await expect(getRecommendations(validRequest, baseOptions)).rejects.toMatchObject({ code: 'PLANS_UPSTREAM_UNAVAILABLE', status: 503 })
  })
})

describe('sanitizeRecommendationRequest', () => {
  it('aceita ibge + profile válidos e ignora campos desconhecidos', () => {
    const sanitized = sanitizeRecommendationRequest({
      ibge: '3550308',
      profile: { people: 3, devices: 6, streaming4k: true, gaming: true, homeOffice: false, frequentLargeUploads: false, alwaysOnDevices: true },
      unknownField: 'should not leak',
    })
    expect(sanitized).toEqual({
      ibge: '3550308',
      profile: { people: 3, devices: 6, streaming4k: true, gaming: true, homeOffice: false, frequentLargeUploads: false, alwaysOnDevices: true },
    })
  })

  it('só inclui currentConnection quando os três campos numéricos vêm completos do cliente', () => {
    const sanitized = sanitizeRecommendationRequest({
      ibge: '3550308',
      profile: { people: 2, devices: 2, streaming4k: false, gaming: false, homeOffice: false, frequentLargeUploads: false, alwaysOnDevices: false },
      currentConnection: { downloadMbps: 250, uploadMbps: 100, latencyMs: 12 },
    })
    expect(sanitized?.currentConnection).toEqual({ downloadMbps: 250, uploadMbps: 100, latencyMs: 12 })
  })

  it('rejeita corpo sem profile completo', () => {
    expect(sanitizeRecommendationRequest({ ibge: '3550308', profile: { people: 2 } })).toBeNull()
  })

  it('rejeita corpo sem ibge', () => {
    expect(
      sanitizeRecommendationRequest({
        profile: { people: 2, devices: 2, streaming4k: false, gaming: false, homeOffice: false, frequentLargeUploads: false, alwaysOnDevices: false },
      }),
    ).toBeNull()
  })
})
