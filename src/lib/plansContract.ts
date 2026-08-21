// Contratos do `signallq-plans` consumidos por `/planos`. Verificados contra
// o Worker real (https://signallq-plans.buildealabs.workers.dev) — não são
// mais especulação da documentação da Issue #10: os nomes de campo, o
// envelope { data, meta } e os códigos de erro aqui batem com respostas
// reais observadas depois do deploy de #4–#9/#13. O backend é a única
// autoridade sobre `recommendedRange`, `marketTier`, `score`,
// `classification`, `reasonCodes` e a ordem das ofertas — este arquivo só
// declara o formato, nunca recalcula nada disso.

export interface LocationResult {
  cep: string
  city: string
  state: string
  ibge: string
}

/** Documentado como `UsageIntensityTier` no domínio do signallq-plans. */
export type MarketTier = 'LIGHT' | 'MODERATE' | 'CONNECTED_FAMILY' | 'INTENSIVE' | 'VERY_INTENSIVE'

/** Cálculo contínuo de banda — nunca um rótulo pronto: o front formata a
 * faixa a partir destes três números (ver FaixaRecomendada.tsx). */
export interface BandwidthRange {
  minMbps: number
  idealMbps: number
  maxUsefulMbps: number
}

export interface UploadRange {
  minMbps: number
  idealMbps: number
}

/** Resume offers[] sem o front re-derivar nada que o engine já decidiu. */
export type AvailabilityFit = 'in_range_available' | 'only_alternatives_available' | 'no_offers'

export type CurrentPlanStatus = 'below_range' | 'within_range' | 'above_range' | 'unknown'

/** Só presente quando a requisição incluiu `currentPlan`. */
export interface CurrentPlanComparison {
  status: CurrentPlanStatus
  reasonCodes: string[]
}

export interface OfferProvider {
  code: string
  name: string
}

export interface OfferValidity {
  start: string | null
  end: string | null
}

export interface Offer {
  /** `${provider.code}:${providerOfferId}` — já é uma key estável, não recalcular. */
  id: string
  provider: OfferProvider
  providerOfferId: string
  name: string
  serviceType: string
  price: number
  promoPrice: number | null
  postPromoPrice: number | null
  downloadMbps: number | null
  uploadMbps: number | null
  technologies: string[]
  fidelityMonths: number | null
  officialUrl: string | null
  validity: OfferValidity
  source: string
}

/** Vocabulário estável definido em signallq-plans/src/recommendation/reasonCodes.ts
 * (OfferClassification) — "best_value" deliberadamente não existe. */
export type OfferClassification = 'best_match' | 'good_option' | 'insufficient' | 'overkill'

/** Oferta com a avaliação do engine — `recommendation.*` é opaco ao front:
 * exibido e traduzido (ver reasonCodeCopy.ts), nunca recalculado. */
export interface RankedOffer extends Offer {
  recommendation: {
    score: number
    classification: OfferClassification
    reasonCodes: string[]
  }
}

export interface UsageProfile {
  people: number
  devices: number
  streaming4k: boolean
  gaming: boolean
  homeOffice: boolean
  frequentLargeUploads: boolean
  alwaysOnDevices: boolean
}

/** Só enviado quando a pessoa usuária aciona explicitamente "Usar minha
 * medição" — nunca lido/aplicado automaticamente do histórico local. */
export interface CurrentConnectionInput {
  downloadMbps: number
  uploadMbps: number
  latencyMs: number
}

/** Ainda sem formulário no front (issue #144 lista como opcional) — o tipo
 * existe para o dia em que essa entrada for coletada; não inventar coleta
 * disso sem UI real. */
export interface CurrentPlanInput {
  contractedDownloadMbps: number | null
  contractedUploadMbps: number | null
  monthlyPriceBrl: number | null
}

export interface RecommendationRequest {
  ibge: string
  profile: UsageProfile
  currentConnection?: CurrentConnectionInput
  currentPlan?: CurrentPlanInput
}

/** Achatado a partir de `data.recommendation` + `data.offers` da resposta
 * real (ver plansProxy.ts) — mais conveniente para os componentes do que
 * espelhar o aninhamento do wire 1:1. */
export interface RecommendationResult {
  engineVersion: string
  marketTier: MarketTier
  recommendedRange: BandwidthRange
  recommendedUploadRange: UploadRange
  /** Ordem de chegada é autoridade de ranking orgânico — nunca reordenar. */
  offers: RankedOffer[]
  availabilityFit: AvailabilityFit
  profileReasonCodes: string[]
  currentPlanComparison: CurrentPlanComparison | null
}

export interface OffersResult {
  ibge: string
  offers: Offer[]
}
