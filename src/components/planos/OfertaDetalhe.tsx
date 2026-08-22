import type { OfferClassification, RankedOffer } from '../../lib/plansContract'
import { reasonCodesToCopy } from '../../lib/reasonCodeCopy'
import { Icone } from './Icone'
import { OperadoraMarca } from './OperadoraMarca'

interface OfertaDetalheProps {
  offer: RankedOffer
  onClose: () => void
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('pt-BR')
}

function formatPrice(priceBRL: number): string {
  return priceBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CLASSIFICATION_UI: Record<OfferClassification, { text: string; bg: string; color: string; icon: string }> = {
  best_match: { text: 'Combina com o seu perfil', bg: 'var(--success-container)', color: 'var(--on-success-container)', icon: 'check_circle' },
  good_option: { text: 'Boa opção para o seu perfil', bg: 'var(--success-container)', color: 'var(--on-success-container)', icon: 'check_circle' },
  insufficient: { text: 'Abaixo do que seu perfil pede', bg: 'var(--warning-container)', color: 'var(--on-warning-container)', icon: 'warning' },
  overkill: { text: 'Mais rápido do que você precisa', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', icon: 'info' },
}


// Painel comercial de detalhe, expandido inline abaixo da oferta
// selecionada (referência 01) — nunca modal. Topo com operadora,
// velocidade, classificação, preço e CTA de fechar; corpo em duas áreas
// (Detalhes da oferta | Por que recomendamos), com o CTA externo
// "Ver no site da operadora" quando o backend envia `officialUrl`.
export function OfertaDetalhe({ offer, onClose }: OfertaDetalheProps) {
  const reasons = reasonCodesToCopy(offer.recommendation.reasonCodes)
  const price = formatPrice(offer.price)
  const detailItems = [
    offer.technologies.length > 0 ? { label: 'Tecnologia', value: offer.technologies.join(', ') } : null,
    { label: 'Fidelização', value: offer.fidelityMonths === 0 ? 'Sem fidelidade' : offer.fidelityMonths != null ? `${offer.fidelityMonths} meses` : 'Não informado' },
    offer.downloadMbps != null ? { label: 'Download', value: `${offer.downloadMbps} Mbps` } : null,
    { label: 'Upload', value: offer.uploadMbps != null ? `${offer.uploadMbps} Mbps` : 'Não informado' },
    formatDate(offer.validity.start) ? { label: 'Vigente desde', value: formatDate(offer.validity.start)! } : null,
    formatDate(offer.validity.end) ? { label: 'Vigente até', value: formatDate(offer.validity.end)! } : null,
    { label: 'Fonte', value: offer.source },
    { label: 'Código da oferta', value: offer.providerOfferId },
  ].filter((item): item is { label: string; value: string } => item !== null)

  return (
    <div
      role="region"
      aria-label={`Detalhes da oferta ${offer.provider.name} ${offer.name}`}
      className="flex w-full flex-col overflow-hidden rounded-[20px]"
      style={{ background: 'var(--bg-card)', border: '2px solid var(--accent)', boxShadow: 'var(--depth-level3-shadow)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-5"
        style={{ background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <OperadoraMarca provider={offer.provider} />
          <span className="title-large">{offer.name}</span>
          <span
            className="label-medium rounded-full px-3 py-1 flex items-center gap-1.5"
            style={{ background: CLASSIFICATION_UI[offer.recommendation.classification].bg, color: CLASSIFICATION_UI[offer.recommendation.classification].color }}
          >
            <Icone name={CLASSIFICATION_UI[offer.recommendation.classification].icon} size={16} />
            {CLASSIFICATION_UI[offer.recommendation.classification].text}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-baseline gap-1">
            {offer.promoPrice != null ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[24px] leading-[1.1] font-bold text-[color:var(--text-primary)]" style={{ fontFamily: 'var(--font-sans)' }}>
                  {formatPrice(offer.promoPrice)}
                </span>
              </div>
            ) : (
              <span className="text-[24px] leading-[1.1] font-bold text-[color:var(--text-primary)]" style={{ fontFamily: 'var(--font-sans)' }}>
                {price}
              </span>
            )}
            <span className="body-medium text-[color:var(--text-secondary)]">/mês</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-none bg-transparent"
          >
            <Icone name="close" size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 p-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <span className="label-overline">Detalhes da oferta</span>
          <dl className="m-0 flex flex-col gap-2">
            {detailItems.map((item) => (
              <div
                key={item.label}
                className="flex items-baseline justify-between gap-4 border-b pb-2"
                style={{ borderColor: 'color-mix(in srgb, var(--border) 22%, transparent)' }}
              >
                <dt className="body-medium m-0 text-[color:var(--text-secondary)]">{item.label}</dt>
                <dd className="label-large m-0 text-right">{item.value}</dd>
              </div>
            ))}
          </dl>
          {offer.officialUrl && (
            <a
              href={offer.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="label-large mt-2 flex h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] border px-5"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              Ver no site da operadora
              <Icone name="open_in_new" size={16} />
            </a>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <span className="label-overline">Por que recomendamos</span>
          {reasons.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {reasons.map((reason) => (
                <li key={reason.id} className="body-large flex items-start gap-2.5">
                  <Icone name={reason.icon} size={18} color={reason.color} className="mt-0.5" />
                  <span style={{ color: reason.type === 'alert' ? 'var(--text-primary)' : 'inherit' }}>{reason.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="body-medium m-0 text-[color:var(--text-secondary)]">
              Esta oferta aparece pela disponibilidade na sua região.
            </p>
          )}

          <p
            className="body-small m-0 mt-2 flex items-start gap-2 rounded-[12px] p-3"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <Icone name="verified_user" size={16} color="var(--accent)" />
            Ranking orgânico: esta ordem não é influenciada por patrocínio, comissão ou publicidade.
          </p>
        </div>
      </div>
    </div>
  )
}
