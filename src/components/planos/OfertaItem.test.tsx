import { render, screen, cleanup } from '@testing-library/react'
import { expect, test, afterEach } from 'vitest'
import { OfertaItem } from './OfertaItem'
import type { RankedOffer } from '../../lib/plansContract'

afterEach(cleanup)

function createOffer(overrides: Partial<RankedOffer> = {}): RankedOffer {
  const base: RankedOffer = {
    id: 'CLARO:CLR001',
    provider: { code: 'CLARO', name: 'Claro' },
    providerOfferId: 'CLR001',
    name: 'Claro 600 Mega',
    serviceType: 'SCM',
    price: 100,
    promoPrice: null,
    postPromoPrice: null,
    downloadMbps: 600,
    uploadMbps: 300,
    technologies: ['FTTH'],
    fidelityMonths: 12,
    officialUrl: null,
    validity: { start: null, end: null },
    source: 'CLARO_REGULATORY_ZIP',
    recommendation: {
      score: 80,
      classification: 'best_match',
      reasonCodes: ['meets_minimum_download'],
    },
  }
  return { ...base, ...overrides }
}

// ---------------------------------------------------------------------------
// isTopRecommendation badge
// ---------------------------------------------------------------------------

test('rank-1 offer (isTopRecommendation=true) shows "Recomendado" badge', () => {
  render(<OfertaItem offer={createOffer()} expanded={false} onToggle={() => {}} isTopRecommendation={true} />)
  expect(screen.getByText('Recomendado')).toBeInTheDocument()
})

test('non-rank-1 best_match does NOT show "Recomendado" badge', () => {
  render(<OfertaItem offer={createOffer()} expanded={false} onToggle={() => {}} isTopRecommendation={false} />)
  expect(screen.queryByText('Recomendado')).not.toBeInTheDocument()
  expect(screen.getByText('Combina com o seu perfil')).toBeInTheDocument()
})

test('without isTopRecommendation prop, badge is absent by default', () => {
  render(<OfertaItem offer={createOffer()} expanded={false} onToggle={() => {}} />)
  expect(screen.queryByText('Recomendado')).not.toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// Fidelity display — three semantic states
// ---------------------------------------------------------------------------

test('fidelityMonths null → renders "Fidelidade não informada"', () => {
  render(<OfertaItem offer={createOffer({ fidelityMonths: null })} expanded={false} onToggle={() => {}} />)
  expect(screen.getByText('Fidelidade não informada')).toBeInTheDocument()
})

test('fidelityMonths 0 → renders "Sem fidelidade"', () => {
  render(<OfertaItem offer={createOffer({ fidelityMonths: 0 })} expanded={false} onToggle={() => {}} />)
  expect(screen.getByText('Sem fidelidade')).toBeInTheDocument()
})

test('fidelityMonths 12 → renders "12 meses de fidelidade"', () => {
  render(<OfertaItem offer={createOffer({ fidelityMonths: 12 })} expanded={false} onToggle={() => {}} />)
  expect(screen.getByText('12 meses de fidelidade')).toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// Upload display — null is unknown, never zero
// ---------------------------------------------------------------------------

test('uploadMbps null → renders "Upload não informado"', () => {
  render(<OfertaItem offer={createOffer({ uploadMbps: null })} expanded={false} onToggle={() => {}} />)
  expect(screen.getByText('Upload não informado')).toBeInTheDocument()
})

test('uploadMbps 300 → renders speed', () => {
  render(<OfertaItem offer={createOffer({ uploadMbps: 300 })} expanded={false} onToggle={() => {}} />)
  expect(screen.getByText(/300 Mbps/)).toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// Promo price display
// ---------------------------------------------------------------------------

test('promoPrice shown as primary, regular price crossed out', () => {
  render(
    <OfertaItem
      offer={createOffer({ price: 100, promoPrice: 80 })}
      expanded={false}
      onToggle={() => {}}
    />,
  )
  expect(screen.getByText('Preço Promocional')).toBeInTheDocument()
  // Regular price with strikethrough is visible
  expect(screen.getByText(/R\$ 100,00 \/mês \(regular\)/)).toBeInTheDocument()
})

test('no promoPrice → shows only regular price, no promo badge', () => {
  render(<OfertaItem offer={createOffer({ price: 100, promoPrice: null })} expanded={false} onToggle={() => {}} />)
  expect(screen.queryByText('Preço Promocional')).not.toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// Classification badges
// ---------------------------------------------------------------------------

test('good_option → "Boa opção para o seu perfil"', () => {
  render(
    <OfertaItem
      offer={createOffer({ recommendation: { score: 65, classification: 'good_option', reasonCodes: [] } })}
      expanded={false}
      onToggle={() => {}}
    />,
  )
  expect(screen.getByText('Boa opção para o seu perfil')).toBeInTheDocument()
})

test('overkill → "Mais rápido do que você precisa"', () => {
  render(
    <OfertaItem
      offer={createOffer({ recommendation: { score: 40, classification: 'overkill', reasonCodes: [] } })}
      expanded={false}
      onToggle={() => {}}
    />,
  )
  expect(screen.getByText('Mais rápido do que você precisa')).toBeInTheDocument()
})

test('insufficient → "Abaixo do que seu perfil pede"', () => {
  render(
    <OfertaItem
      offer={createOffer({ recommendation: { score: 20, classification: 'insufficient', reasonCodes: [] } })}
      expanded={false}
      onToggle={() => {}}
    />,
  )
  expect(screen.getByText('Abaixo do que seu perfil pede')).toBeInTheDocument()
})
