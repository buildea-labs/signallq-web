import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OffersResult, RecommendationResult } from './plansContract'
import { getRecommendations, listOffers, PlansProxyError, resolveLocation, sanitizeRecommendationRequest } from './plansProxy'

afterEach(() => {
  vi.unstubAllGlobals()
})

const baseOptions = { apiUrl: 'https://plans.example.com', correlationId: 'test-correlation', signal: new AbortController().signal }

describe('plansProxy — GET /api/v1/location', () => {
  it('lança PLANS_SERVICE_NOT_CONFIGURED sem apiUrl configurada, sem inventar endpoint', async () => {
    await expect(resolveLocation('01310000', { ...baseOptions, apiUrl: undefined })).rejects.toMatchObject({
      code: 'PLANS_SERVICE_NOT_CONFIGURED',
      status: 503,
    })
  })

  it('devolve o LocationResult exatamente como recebido do backend', async () => {
    const location = { cep: '01310-000', municipio: 'São Paulo', uf: 'SP', ibge: '3550308' }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(location), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveLocation('01310000', baseOptions)
    expect(result).toEqual(location)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('https://plans.example.com/api/v1/location?cep=01310000')
  })

  it('mapeia 404 do backend para PLANS_CEP_NOT_FOUND', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolveLocation('99999999', baseOptions)).rejects.toMatchObject({ code: 'PLANS_CEP_NOT_FOUND', status: 404 })
  })

  it('rejeita resposta com formato inválido em vez de repassar dado incompleto', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ cep: '123' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolveLocation('01310000', baseOptions)).rejects.toMatchObject({ code: 'PLANS_UPSTREAM_INVALID_RESPONSE', status: 502 })
  })
})

describe('plansProxy — GET /api/v1/offers', () => {
  it('devolve a listagem objetiva sem alterar a ordem recebida', async () => {
    const offers: OffersResult = {
      ibge: '3550308',
      offers: [
        { id: 'o1', provider: 'PROVIDER_A', planName: 'Plano A', priceBRL: 99.9, downloadMbps: 300, uploadMbps: 150, technology: ['fibra'], fidelityMonths: 12, validFrom: null, validUntil: null, sourceCode: null },
      ],
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(offers), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await listOffers('3550308', baseOptions)
    expect(result).toEqual(offers)
  })
})

describe('plansProxy — POST /api/v1/recommendations', () => {
  const validRequest = {
    ibge: '3550308',
    profile: { people: 2, devices: 4, streaming4k: true, gaming: false, homeOffice: true, largeUploads: false, alwaysOnDevices: false },
  }

  it('repassa o corpo e devolve o resultado do backend sem recalcular faixa/score/ranking', async () => {
    const recommendation: RecommendationResult = {
      engineVersion: 'v1',
      recommendedRange: { tier: 'CONNECTED_FAMILY', minMbps: 500, maxMbps: 700, label: '500–700 Mega' },
      offers: [
        { id: 'o1', provider: 'PROVIDER_A', planName: 'Plano A', priceBRL: 99.9, downloadMbps: 600, uploadMbps: 300, technology: ['fibra'], fidelityMonths: 12, validFrom: null, validUntil: null, sourceCode: 'A1', compatible: true, score: 0.92, reasonCodes: ['download_within_ideal_range'] },
      ],
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(recommendation), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getRecommendations(validRequest, baseOptions)
    expect(result).toEqual(recommendation)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://plans.example.com/api/v1/recommendations')
    expect(JSON.parse(String(init?.body))).toEqual(validRequest)
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
      profile: { people: 3, devices: 6, streaming4k: true, gaming: true, homeOffice: false, largeUploads: false, alwaysOnDevices: true },
      unknownField: 'should not leak',
    })
    expect(sanitized).toEqual({
      ibge: '3550308',
      profile: { people: 3, devices: 6, streaming4k: true, gaming: true, homeOffice: false, largeUploads: false, alwaysOnDevices: true },
    })
  })

  it('só inclui currentConnection quando explicitamente enviado pelo cliente', () => {
    const sanitized = sanitizeRecommendationRequest({
      ibge: '3550308',
      profile: { people: 2, devices: 2, streaming4k: false, gaming: false, homeOffice: false, largeUploads: false, alwaysOnDevices: false },
      currentConnection: { downloadMbps: 250, uploadMbps: 100, latencyMs: 12 },
    })
    expect(sanitized?.currentConnection).toEqual({ downloadMbps: 250, uploadMbps: 100, latencyMs: 12 })
  })

  it('rejeita corpo sem profile completo', () => {
    expect(sanitizeRecommendationRequest({ ibge: '3550308', profile: { people: 2 } })).toBeNull()
  })

  it('rejeita corpo sem ibge', () => {
    expect(sanitizeRecommendationRequest({ profile: { people: 2, devices: 2, streaming4k: false, gaming: false, homeOffice: false, largeUploads: false, alwaysOnDevices: false } })).toBeNull()
  })
})
