'use client'

import { useState, Fragment } from 'react'
import type { AvailabilityFit, LocationResult, RankedOffer } from '../../lib/plansContract'
import { Icone } from './Icone'
import { OfertaDetalhe } from './OfertaDetalhe'
import { OfertaItem } from './OfertaItem'

type SortOption = 'recomendado' | 'menor_preco' | 'maior_velocidade' | 'sem_fidelidade'

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'recomendado', label: 'Recomendadas' },
  { value: 'menor_preco', label: 'Menor preço' },
  { value: 'maior_velocidade', label: 'Mais velocidade' },
  { value: 'sem_fidelidade', label: 'Sem fidelidade' },
]

/** Ordenação/filtro de EXIBIÇÃO iniciado pela pessoa usuária — 
 * A opção 'recomendado' agora prioriza FTTH (Fibra) sobre outras tecnologias,
 * e usa a soma de (Download + Upload) como critério de desempate/ordenação (Issue #157).
 * `sem_fidelidade` é FILTRO, não reordenação. */
function applyDisplayChoice(offers: RankedOffer[], sort: SortOption): RankedOffer[] {
  if (sort === 'sem_fidelidade') return offers.filter((offer) => offer.fidelityMonths === 0)
  
  const sorted = [...offers]
  
  if (sort === 'recomendado') {
    // Preserve organic backend order. No artificial FTTH/speed reordering.
    return sorted;
  }
  
  if (sort === 'menor_preco') sorted.sort((a, b) => a.price - b.price)
  else if (sort === 'maior_velocidade') sorted.sort((a, b) => (b.downloadMbps ?? -Infinity) - (a.downloadMbps ?? -Infinity))
  
  return sorted
}

interface OfertasListaProps {
  offers: RankedOffer[]
  location: LocationResult
  onTrocarLocalizacao: () => void
  /** Autoridade do backend sobre "faltou compatível" — nunca recalculado
   * localmente a partir de `offers` (correção da Issue #10). */
  availabilityFit: AvailabilityFit
  /** Renderizado entre o cabeçalho e as abas — a faixa recomendada, que na
   * referência 01 vive dentro desta seção, acima dos filtros. */
  children?: React.ReactNode
}

// Seção comercial de ofertas (referência 01): título + município/UF +
// alterar localização, faixa recomendada, abas de exibição, grade de até 3
// cards e detalhe expandido inline em largura total.
export function OfertasLista({ offers, location, onTrocarLocalizacao, availabilityFit, children }: OfertasListaProps) {
  const [sort, setSort] = useState<SortOption>('recomendado')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const allDisplayOffers = applyDisplayChoice(offers, sort)
  const top1Id = offers[0]?.id;

  let displayOffers = allDisplayOffers;
  if (!showAll) {
    if (sort === 'recomendado') {
      const selected: typeof allDisplayOffers = [];
      const seenProviders = new Set<string>();
      // Step 1: Pick the first (best) offer from each distinct provider.
      for (const o of allDisplayOffers) {
        if (selected.length >= 3) break;
        if (!seenProviders.has(o.provider.code)) {
          selected.push(o);
          seenProviders.add(o.provider.code);
        }
      }
      // Step 2: Fill remaining slots with the next best globally not yet selected.
      for (const o of allDisplayOffers) {
        if (selected.length >= 3) break;
        if (!selected.includes(o)) {
          selected.push(o);
        }
      }
      // Do NOT sort — the traversal order is the display order.
      displayOffers = selected;
    } else {
      displayOffers = allDisplayOffers.slice(0, 3);
    }
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[28px] leading-[1.2] font-bold tracking-[-0.3px] sm:text-[32px]" style={{ fontFamily: 'var(--font-sans)' }}>
            Planos disponíveis para você
          </h2>
          <span className="flex flex-wrap items-center gap-2">
            <span className="body-large text-[color:var(--text-secondary)]">
              {location.city}, {location.state}
            </span>
            <button type="button" onClick={onTrocarLocalizacao} className="label-large underline" style={{ color: 'var(--accent)' }}>
              Alterar localização
            </button>
          </span>
        </div>
      </div>

      {children}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Exibição das ofertas">
        {SORT_OPTIONS.map((option) => {
          const active = option.value === sort
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setSort(option.value)}
              className="label-large rounded-[var(--radius-pill)] px-4 py-2 transition-colors"
              style={
                active
                  ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', border: '1px solid var(--accent)' }
                  : { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {sort !== 'recomendado' && (
        <p className="body-medium m-0 flex items-center gap-2 text-[color:var(--text-secondary)]">
          <Icone name="swap_vert" size={18} color="var(--accent)" />
          Esta visão foi escolhida por você e é diferente da recomendação orgânica do SignallQ.
        </p>
      )}

      {availabilityFit === 'only_alternatives_available' && (
        <p
          className="body-medium m-0 flex items-start gap-2 rounded-[12px] p-3"
          style={{ background: 'var(--warning-container)', color: 'var(--on-warning-container)' }}
        >
          <Icone name="info" size={18} />
          Nenhuma oferta encontrada está totalmente dentro da faixa recomendada — abaixo estão as alternativas disponíveis na sua região.
        </p>
      )}

      {displayOffers.length === 0 ? (
        <p className="body-medium m-0 text-[color:var(--text-secondary)]">Nenhuma oferta com este filtro. Tente outra visão acima.</p>
      ) : (
        <>
          {!showAll && sort === 'recomendado' && allDisplayOffers.length > 0 && (
            <p className="body-medium mb-4 text-[color:var(--text-secondary)]">
              Mostramos primeiro a melhor opção de cada operadora para facilitar a comparação.
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayOffers.map((offer) => {
              const isSelected = selectedId === offer.id
              return (
                <Fragment key={offer.id}>
                  <OfertaItem
                    offer={offer}
                    isTopRecommendation={offer.id === top1Id}
                    expanded={isSelected}
                    onToggle={() => setSelectedId((current) => (current === offer.id ? null : offer.id))}
                  />
                  {isSelected && (
                    <div className="col-span-full">
                      <OfertaDetalhe offer={offer} onClose={() => setSelectedId(null)} />
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>

          {!showAll && allDisplayOffers.length > 3 && (
            <button 
              type="button" 
              onClick={() => setShowAll(true)} 
              className="label-large mt-2 flex h-12 w-full max-w-[300px] mx-auto items-center justify-center rounded-[var(--radius-pill)] border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              Ver todas as ofertas
            </button>
          )}
        </>
      )}
    </section>
  )
}
