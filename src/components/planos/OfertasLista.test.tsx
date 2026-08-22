import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { expect, test, afterEach } from 'vitest'
import { OfertasLista } from './OfertasLista'
import type { RankedOffer, AvailabilityFit, LocationResult } from '../../lib/plansContract'

afterEach(cleanup)

const mockLocation: LocationResult = {
  cep: '21735210',
  city: 'Rio de Janeiro',
  state: 'RJ',
  ibge: '3304557',
}

function createOffer(
  providerOfferId: string,
  providerCode: string,
  name: string,
  fidelityMonths: number | null = 12,
  score = 80,
): RankedOffer {
  return {
    id: `${providerCode}:${providerOfferId}`,
    provider: { code: providerCode, name: providerCode },
    providerOfferId,
    name,
    serviceType: 'SCM',
    price: 100,
    promoPrice: null,
    postPromoPrice: null,
    downloadMbps: 500,
    uploadMbps: 250,
    technologies: ['FTTH'],
    fidelityMonths,
    officialUrl: null,
    validity: { start: null, end: null },
    source: 'CLARO_REGULATORY_ZIP',
    recommendation: {
      score,
      classification: 'best_match',
      reasonCodes: ['meets_minimum_download'],
    },
  }
}

const FIT: AvailabilityFit = 'in_range_available'



// Simpler: use getAllByRole('heading') or just check order via getAllByText within grid
function getOfferNamesInOrder(container: HTMLElement): string[] {
  // The offer name is the only element with text matching "Claro N" / "Nio N" etc.
  // We look for the cards in DOM order using the offer name span.
  // OfertaItem renders the name inside <span className="text-[26px]...">
  const spans = Array.from(container.querySelectorAll('span')).filter(
    s => /^(Claro|Nio|Vivo)\s+\S/.test(s.textContent ?? ''),
  );
  return spans.map(s => s.textContent ?? '');
}

// ---------------------------------------------------------------------------
// Test: diversity showcase with 2-provider scenario (the bug case)
// Backend:  Claro #1, Claro #2, Nio #1, Claro #3
// Vitrine:  Claro #1, Nio #1, Claro #2   (Nio is discovered second, but in position 2)
// ---------------------------------------------------------------------------
test('diversity order: 2 providers — Claro #1, Claro #2, Nio #1 → vitrine Claro#1 Nio#1 Claro#2', () => {
  const offers = [
    createOffer('1', 'CLARO', 'Claro 1', 12, 90),
    createOffer('2', 'CLARO', 'Claro 2', 12, 80),
    createOffer('3', 'NIO',   'Nio 1',   null, 70),
    createOffer('4', 'CLARO', 'Claro 3', 12, 60),
  ]
  const { container } = render(
    <OfertasLista offers={offers} location={mockLocation} onTrocarLocalizacao={() => {}} availabilityFit={FIT} />,
  )

  const names = getOfferNamesInOrder(container)
  // Must show exactly 3 in this order
  expect(names).toEqual(['Claro 1', 'Nio 1', 'Claro 2'])
})

// ---------------------------------------------------------------------------
// Test: diversity showcase with 3+ providers
// Backend: Claro #1, Claro #2, Nio #1, Vivo #1
// Vitrine: Claro #1, Nio #1, Vivo #1
// ---------------------------------------------------------------------------
test('diversity order: 3 providers — Claro#1, Claro#2, Nio#1, Vivo#1 → vitrine Claro#1 Nio#1 Vivo#1', () => {
  const offers = [
    createOffer('1', 'CLARO', 'Claro 1', 12, 90),
    createOffer('2', 'CLARO', 'Claro 2', 12, 85),
    createOffer('3', 'NIO',   'Nio 1',   null, 70),
    createOffer('4', 'VIVO',  'Vivo 1',  12, 60),
  ]
  const { container } = render(
    <OfertasLista offers={offers} location={mockLocation} onTrocarLocalizacao={() => {}} availabilityFit={FIT} />,
  )

  const names = getOfferNamesInOrder(container)
  expect(names).toEqual(['Claro 1', 'Nio 1', 'Vivo 1'])

  // Diversity label is shown
  expect(
    screen.getByText('Mostramos primeiro a melhor opção de cada operadora para facilitar a comparação.'),
  ).toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// Test: "Ver todas" shows full organic order (no diversity, no limit)
// ---------------------------------------------------------------------------
test('ver todas: shows all offers in full organic order', () => {
  const offers = [
    createOffer('1', 'CLARO', 'Claro 1', 12, 90),
    createOffer('2', 'CLARO', 'Claro 2', 12, 85),
    createOffer('3', 'NIO',   'Nio 1',   null, 70),
    createOffer('4', 'CLARO', 'Claro 3', 12, 60),
  ]
  const { container } = render(
    <OfertasLista offers={offers} location={mockLocation} onTrocarLocalizacao={() => {}} availabilityFit={FIT} />,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Ver todas as ofertas' }))

  const names = getOfferNamesInOrder(container)
  expect(names).toEqual(['Claro 1', 'Claro 2', 'Nio 1', 'Claro 3'])

  // Diversity disclaimer is gone
  expect(screen.queryByText(/Mostramos primeiro a melhor opção/)).not.toBeInTheDocument()
})

// ---------------------------------------------------------------------------
// Test: "Sem fidelidade" filter — ONLY fidelityMonths === 0
// ---------------------------------------------------------------------------
test('filtro "Sem fidelidade" includes ONLY fidelityMonths === 0, excludes null and positive', () => {
  const offers = [
    createOffer('1', 'CLARO', 'Claro Null', null),
    createOffer('2', 'NIO',   'Nio Zero',   0),
    createOffer('3', 'VIVO',  'Vivo Twelve', 12),
  ]
  render(
    <OfertasLista offers={offers} location={mockLocation} onTrocarLocalizacao={() => {}} availabilityFit={FIT} />,
  )

  // Click the "Sem fidelidade" sort button (use aria-pressed to scope to filter buttons)
  const semFidelidade = screen
    .getAllByRole('button', { name: 'Sem fidelidade' })
    .find(btn => btn.getAttribute('aria-pressed') !== null)!
  fireEvent.click(semFidelidade)

  // null must NOT appear (unknown ≠ no fidelity)
  expect(screen.queryByText('Claro Null')).not.toBeInTheDocument()
  // 0 (explicit "no fidelity") must appear
  expect(screen.getByText('Nio Zero')).toBeInTheDocument()
  // positive must NOT appear
  expect(screen.queryByText('Vivo Twelve')).not.toBeInTheDocument()
})
