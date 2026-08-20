import type { RankedOffer } from '../../lib/plansContract'
import { Icone } from './Icone'
import { OperadoraMarca } from './OperadoraMarca'

interface OfertaItemProps {
  offer: RankedOffer
  isBestMatch: boolean
  expanded: boolean
  onToggle: () => void
}

function formatPrice(priceBRL: number | null): { reais: string; centavos: string } | null {
  if (priceBRL == null) return null
  const [reais, centavos] = priceBRL.toFixed(2).split('.')
  return { reais: Number(reais).toLocaleString('pt-BR'), centavos }
}

function AttributeRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="body-medium flex items-center gap-2 text-[color:var(--text-secondary)]">
      <Icone name={icon} size={18} color="var(--accent)" />
      {children}
    </span>
  )
}

// Card de oferta com aparência de produto à venda (referência 01):
// operadora no topo, velocidade como manchete, preço com destaque
// comercial, atributos com ícone, compatibilidade e CTA. A oferta #1 do
// ranking orgânico recebe peso visual maior (borda em accent, selo
// "Recomendado" e CTA preenchido) — o realce acompanha o ranking do
// backend, nunca é decidido aqui.
export function OfertaItem({ offer, isBestMatch, expanded, onToggle }: OfertaItemProps) {
  const price = formatPrice(offer.priceBRL)

  return (
    <div
      className="relative flex h-full flex-col gap-4 rounded-[20px] p-5"
      style={{
        background: 'var(--bg-card)',
        border: `${isBestMatch ? 2 : 1}px solid ${isBestMatch || expanded ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: isBestMatch ? 'var(--depth-level3-shadow)' : 'var(--depth-level2-shadow)',
      }}
    >
      {isBestMatch && (
        <span
          className="label-small absolute -top-3 left-5 rounded-full px-3 py-1 uppercase tracking-[0.4px]"
          style={{ background: 'var(--success)', color: 'var(--bg-card)' }}
        >
          Recomendado
        </span>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <OperadoraMarca provider={offer.provider} />
      </div>

      <div className="flex flex-col gap-1">
        <span
          className="text-[26px] leading-[1.15] font-bold tracking-[-0.2px]"
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}
        >
          {offer.planName}
        </span>
        {price && (
          <span className="flex items-baseline gap-1" style={{ color: 'var(--text-primary)' }}>
            <span className="body-medium">R$</span>
            <span className="text-[28px] leading-[1.1] font-bold" style={{ fontFamily: 'var(--font-sans)' }}>
              {price.reais},{price.centavos}
            </span>
            <span className="body-medium text-[color:var(--text-secondary)]">/mês</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
        {offer.downloadMbps != null && (
          <AttributeRow icon="download">
            Download <b className="text-[color:var(--text-primary)]">{offer.downloadMbps} Mbps</b>
          </AttributeRow>
        )}
        {offer.uploadMbps != null && (
          <AttributeRow icon="upload">
            Upload <b className="text-[color:var(--text-primary)]">{offer.uploadMbps} Mbps</b>
          </AttributeRow>
        )}
        {offer.technology?.length ? <AttributeRow icon="cable">{offer.technology.join(', ')}</AttributeRow> : null}
        <AttributeRow icon={offer.fidelityMonths != null ? 'event_available' : 'lock_open'}>
          {offer.fidelityMonths != null ? `${offer.fidelityMonths} meses de fidelidade` : 'Sem fidelidade'}
        </AttributeRow>
      </div>

      {offer.compatible && (
        <span
          className="label-large flex items-center gap-2 rounded-[10px] px-3 py-2"
          style={{ background: 'var(--success-container)', color: 'var(--on-success-container)' }}
        >
          <Icone name="check_circle" size={18} />
          Combina com o seu perfil
        </span>
      )}

      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="label-large mt-auto flex h-11 items-center justify-center rounded-[var(--radius-pill)] px-4"
        style={
          isBestMatch
            ? { background: 'var(--accent)', color: 'var(--on-accent)' }
            : { border: '1px solid var(--accent)', color: 'var(--accent)' }
        }
      >
        {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
      </button>
    </div>
  )
}
