'use client'

import { useState } from 'react'
import type { LocationResult, RankedOffer } from '../../lib/plansContract'
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

/** Ordenação/filtro de EXIBIÇÃO iniciado pela pessoa usuária — nunca
 * substitui o ranking orgânico devolvido pelo backend, só reordena/filtra o
 * que já está na tela quando ela pede. `recomendado` volta à ordem
 * original. `sem_fidelidade` é FILTRO, não reordenação. */
function applyDisplayChoice(offers: RankedOffer[], sort: SortOption): RankedOffer[] {
  if (sort === 'recomendado') return offers
  if (sort === 'sem_fidelidade') return offers.filter((offer) => offer.fidelityMonths == null || offer.fidelityMonths === 0)
  const sorted = [...offers]
  if (sort === 'menor_preco') sorted.sort((a, b) => (a.priceBRL ?? Infinity) - (b.priceBRL ?? Infinity))
  else if (sort === 'maior_velocidade') sorted.sort((a, b) => (b.downloadMbps ?? -Infinity) - (a.downloadMbps ?? -Infinity))
  return sorted
}

interface OfertasListaProps {
  offers: RankedOffer[]
  location: LocationResult
  onTrocarLocalizacao: () => void
  /** Renderizado entre o cabeçalho e as abas — a faixa recomendada, que na
   * referência 01 vive dentro desta seção, acima dos filtros. */
  children?: React.ReactNode
}

// Seção comercial de ofertas (referência 01): título + município/UF +
// alterar localização, faixa recomendada, abas de exibição, grade de até 3
// cards e detalhe expandido inline em largura total.
export function OfertasLista({ offers, location, onTrocarLocalizacao, children }: OfertasListaProps) {
  const [sort, setSort] = useState<SortOption>('recomendado')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const bestMatchId = offers[0]?.id ?? null
  const hasCompatible = offers.some((offer) => offer.compatible)
  const displayOffers = applyDisplayChoice(offers, sort)
  // Só mostra o detalhe se a oferta continuar visível na seleção atual —
  // trocar para um filtro que a esconde não pode deixar o painel órfão.
  const selectedOffer = displayOffers.find((offer) => offer.id === selectedId) ?? null

  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[28px] leading-[1.2] font-bold tracking-[-0.3px] sm:text-[32px]" style={{ fontFamily: 'var(--font-sans)' }}>
            Planos disponíveis para você
          </h2>
          <span className="flex flex-wrap items-center gap-2">
            <span className="body-large text-[color:var(--text-secondary)]">
              {location.municipio}, {location.uf}
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

      {!hasCompatible && offers.length > 0 && (
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
          {/* A grade de ofertas permanece intacta ao expandir (referência
              01): o painel de detalhe abre ABAIXO da linha inteira, não no
              meio dela — não quebra a comparação lado a lado. */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayOffers.map((offer) => (
              <OfertaItem
                key={offer.id}
                offer={offer}
                isBestMatch={offer.id === bestMatchId}
                expanded={selectedId === offer.id}
                onToggle={() => setSelectedId((current) => (current === offer.id ? null : offer.id))}
              />
            ))}
          </div>
          {selectedOffer && <OfertaDetalhe offer={selectedOffer} onClose={() => setSelectedId(null)} />}
        </>
      )}
    </section>
  )
}
