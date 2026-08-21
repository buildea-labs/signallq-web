// Contratos públicos do `signallq-plans` consumidos por `/planos`. Espelham
// a documentação da Issue #10 (buildea-labs/signallq-plans) — não incluem
// nenhum campo interno de scoring/regra: o backend é a única autoridade
// sobre `RecommendedRange`, `score`, `classification` e ordenação. Este
// arquivo só declara o formato que o front recebe e formata.
//
// GET /api/v1/location, GET /api/v1/offers e POST /api/v1/recommendations
// ainda estão atrás das issues #9 e #13 (signallq-plans), ambas abertas no
// momento desta implementação — os tipos aqui refletem a documentação da
// Issue #10, não uma resposta real observada.

export interface LocationResult {
  cep: string
  municipio: string
  uf: string
  ibge: string
}

/** V1 documentado na Issue #10 — nunca hardcodar faixas numéricas no front;
 * o backend envia `label`/`minMbps`/`maxMbps` já resolvidos. */
export type MarketTier = 'LIGHT' | 'MODERATE' | 'CONNECTED_FAMILY' | 'INTENSIVE' | 'VERY_INTENSIVE'

export interface RecommendedRange {
  tier: MarketTier
  minMbps: number | null
  maxMbps: number | null
  /** Rótulo já formatado pelo backend (ex. "500–700 Mega"). */
  label: string
}

export interface Offer {
  id: string
  provider: string
  planName: string
  priceBRL: number | null
  downloadMbps: number | null
  uploadMbps: number | null
  technology: string[] | null
  fidelityMonths: number | null
  validFrom: string | null
  validUntil: string | null
  sourceCode: string | null
}

/** Oferta com metadados de ranking — `score`/`reasonCodes` são opacos ao
 * front: exibidos e traduzidos (ver `reasonCodeCopy.ts`), nunca recalculados
 * nem usados para reordenar localmente. */
export interface RankedOffer extends Offer {
  compatible: boolean
  score: number
  reasonCodes: string[]
}

export interface RecommendationProfile {
  people: number
  devices: number
  streaming4k: boolean
  gaming: boolean
  homeOffice: boolean
  largeUploads: boolean
  alwaysOnDevices: boolean
}

/** Só enviado quando a pessoa usuária aciona explicitamente "Usar minha
 * medição" — nunca lido/aplicado automaticamente do histórico local. */
export interface CurrentConnectionInput {
  downloadMbps?: number
  uploadMbps?: number
  latencyMs?: number
}

export interface CurrentPlanInput {
  provider?: string
  priceBRL?: number
  downloadMbps?: number
}

export interface RecommendationRequest {
  ibge: string
  profile: RecommendationProfile
  currentConnection?: CurrentConnectionInput
  currentPlan?: CurrentPlanInput
}

export interface RecommendationResult {
  engineVersion: string
  recommendedRange: RecommendedRange
  /** Ordem de chegada é autoridade de ranking orgânico — nunca reordenar. */
  offers: RankedOffer[]
}

export interface OffersResult {
  ibge: string
  offers: Offer[]
}
