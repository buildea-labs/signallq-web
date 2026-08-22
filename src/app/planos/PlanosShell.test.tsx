import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RecommendationResult } from '../../lib/plansContract'
import { PlanosShell } from './PlanosShell'

const { fetchLocationMock, fetchOffersMock, fetchRecommendationsMock } = vi.hoisted(() => ({
  fetchLocationMock: vi.fn(),
  fetchOffersMock: vi.fn(),
  fetchRecommendationsMock: vi.fn(),
}))
vi.mock('../../lib/plansClient', () => ({
  fetchLocation: fetchLocationMock,
  fetchOffers: fetchOffersMock,
  fetchRecommendations: fetchRecommendationsMock,
}))

const listRecordsMock = vi.hoisted(() => vi.fn())
vi.mock('../../lib/measurementRepository', () => ({ listRecords: listRecordsMock }))

afterEach(() => {
  cleanup()
  fetchLocationMock.mockReset()
  fetchOffersMock.mockReset()
  fetchRecommendationsMock.mockReset()
  listRecordsMock.mockReset()
})

const location = { cep: '01310000', city: 'São Paulo', state: 'SP', ibge: '3550308' }

const emptyRecommendation: RecommendationResult = {
  engineVersion: 'v1',
  marketTier: 'LIGHT',
  recommendedRange: { minMbps: 100, idealMbps: 200, maxUsefulMbps: 350 },
  recommendedUploadRange: { minMbps: 5, idealMbps: 10 },
  availabilityFit: 'no_offers',
  profileReasonCodes: [],
  currentPlanComparison: null,
  offers: [],
}

async function preencherCep() {
  fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '01310000' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

describe('PlanosShell — jornada /planos (Issue #10)', () => {
  it('mostra o hero + CEP como estado inicial, sem seções de perfil/ofertas', () => {
    render(<PlanosShell />)
    expect(screen.getByText('O melhor plano não precisa ser o mais rápido.')).toBeInTheDocument()
    expect(screen.queryByText('Como é o uso da sua casa?')).not.toBeInTheDocument()
  })

  it('CEP não encontrado mostra estado vazio dedicado, não uma tela genérica', async () => {
    fetchLocationMock.mockResolvedValue({ ok: false, error: { code: 'PLANS_CEP_NOT_FOUND', retryable: false } })
    render(<PlanosShell />)
    await preencherCep()
    expect(await screen.findByText('CEP não encontrado')).toBeInTheDocument()
  })

  it('avança para o perfil de uso após localização resolvida, e o perfil parte só das respostas da pessoa usuária', async () => {
    fetchLocationMock.mockResolvedValue({ ok: true, data: location })
    render(<PlanosShell />)
    await preencherCep()
    expect(await screen.findByText('São Paulo, SP')).toBeInTheDocument()
    expect(screen.getByText('Como é o uso da sua casa?')).toBeInTheDocument()
    // Sem medição aplicada automaticamente — o IndexedDB não é sequer consultado sem ação explícita.
    expect(listRecordsMock).not.toHaveBeenCalled()
  })

  it('"Usar minha medição" (no hero, antes do CEP) só aplica currentConnection após clique explícito', async () => {
    listRecordsMock.mockResolvedValue([{ id: '1', timestamp: 1700000000000, download: 320, upload: 150, latency: 14 }])
    render(<PlanosShell />)

    expect(listRecordsMock).not.toHaveBeenCalled()
    expect(screen.queryByText(/Usando sua última medição/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Usar minha medição →' }))

    expect(await screen.findByText(/Usando sua última medição/)).toBeInTheDocument()
    expect(screen.getByText(/320 Mbps download/)).toBeInTheDocument()
    expect(listRecordsMock).toHaveBeenCalledTimes(1)
  })

  it('perfil exibe confirmação de que a medição será usada, sem duplicar o controle', async () => {
    fetchLocationMock.mockResolvedValue({ ok: true, data: location })
    listRecordsMock.mockResolvedValue([{ id: '1', timestamp: 1700000000000, download: 320, upload: 150, latency: 14 }])
    render(<PlanosShell />)
    fireEvent.click(screen.getByRole('button', { name: 'Usar minha medição →' }))
    await screen.findByText(/Usando sua última medição/)

    await preencherCep()
    expect(await screen.findByText('Como é o uso da sua casa?')).toBeInTheDocument()
    expect(screen.getByText('Sua última medição será usada para refinar esta recomendação.')).toBeInTheDocument()
  })

  it('recomendação pronta mostra faixa recomendada e ofertas com reasonCodes traduzidos', async () => {
    fetchLocationMock.mockResolvedValue({ ok: true, data: location })
    const recommendation: RecommendationResult = {
      engineVersion: 'v1',
      marketTier: 'CONNECTED_FAMILY',
      recommendedRange: { minMbps: 350, idealMbps: 425, maxUsefulMbps: 500 },
      recommendedUploadRange: { minMbps: 10, idealMbps: 17 },
      availabilityFit: 'in_range_available',
      profileReasonCodes: [],
      currentPlanComparison: null,
      offers: [
        {
          id: 'PROVIDER_A:o1', provider: { code: 'PROVIDER_A', name: 'Provider A' }, providerOfferId: 'o1', name: 'Plano Fibra 600',
          serviceType: 'SCM', price: 99.9, promoPrice: null, postPromoPrice: null, downloadMbps: 600, uploadMbps: 300,
          technologies: ['FTTH'], fidelityMonths: 12, officialUrl: null, validity: { start: null, end: null }, source: 'TEST',
          recommendation: { score: 92, classification: 'best_match', reasonCodes: ['download_within_ideal_range'] },
        },
      ],
    }
    fetchRecommendationsMock.mockResolvedValue({ ok: true, data: recommendation })
    render(<PlanosShell />)
    await preencherCep()
    await screen.findByText('Como é o uso da sua casa?')
    fireEvent.click(screen.getByRole('button', { name: 'Ver minha recomendação' }))

    expect(await screen.findByText('350–500 Mega')).toBeInTheDocument()
    expect(screen.getByText('Provider A')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
    expect(await screen.findByText('Dentro da faixa que faz sentido para sua casa')).toBeInTheDocument()
  })

  it('recommendation API indisponível: mostra erro humano com retry e NUNCA cai para GET /offers como recomendação', async () => {
    fetchLocationMock.mockResolvedValue({ ok: true, data: location })
    fetchRecommendationsMock.mockResolvedValue({ ok: false, error: { code: 'PLANS_UPSTREAM_UNAVAILABLE', retryable: true } })
    render(<PlanosShell />)
    await preencherCep()
    await screen.findByText('Como é o uso da sua casa?')
    fireEvent.click(screen.getByRole('button', { name: 'Ver minha recomendação' }))

    expect(await screen.findByText('Não foi possível calcular sua recomendação')).toBeInTheDocument()
    expect(screen.queryByText('Planos disponíveis para você')).not.toBeInTheDocument()
    expect(fetchOffersMock).not.toHaveBeenCalled()

    fetchRecommendationsMock.mockResolvedValueOnce({ ok: true, data: emptyRecommendation })
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await waitFor(() => expect(fetchRecommendationsMock).toHaveBeenCalledTimes(2))
  })

  it('sem ofertas no catálogo para a região (availabilityFit: no_offers), mostra estado vazio específico', async () => {
    fetchLocationMock.mockResolvedValue({ ok: true, data: location })
    fetchRecommendationsMock.mockResolvedValue({ ok: true, data: emptyRecommendation })
    render(<PlanosShell />)
    await preencherCep()
    await screen.findByText('Como é o uso da sua casa?')
    fireEvent.click(screen.getByRole('button', { name: 'Ver minha recomendação' }))

    expect(await screen.findByText('Sem ofertas para esta região')).toBeInTheDocument()
  })
})
