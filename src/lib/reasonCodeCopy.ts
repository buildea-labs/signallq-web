// Traduz `reasonCodes` (tokens de domínio do `signallq-plans`) para copy
// humana, curta e coerente com o tom SignallQ. Vocabulário completo e
// verificado contra src/recommendation/reasonCodes.ts do backend real — não
// é mais um exemplo isolado da Issue #10. Um código fora deste dicionário
// (evolução futura do engine) NUNCA é interpretado de forma inventada — cai
// no fallback neutro abaixo.

// Por oferta (RankedOffer.recommendation.reasonCodes)
const OFFER_REASON_CODE_COPY: Record<string, string> = {
  below_minimum_download: 'Abaixo da velocidade mínima recomendada para o seu perfil',
  below_range_near_miss: 'Um pouco abaixo da faixa ideal, mas perto',
  meets_minimum_download: 'Atende à velocidade mínima recomendada',
  download_within_ideal_range: 'Dentro da faixa que faz sentido para sua casa',
  above_range_mild_overshoot: 'Um pouco acima do que você precisa',
  above_max_useful_download: 'Mais rápido do que faria diferença para o seu uso',
  upload_below_need: 'Upload abaixo do que seu uso pede',
  upload_meets_need: 'Upload compatível com o seu uso',
  upload_speed_unknown: 'Velocidade de upload não informada pela operadora',
  price_competitive: 'Preço competitivo entre as opções compatíveis',
  price_premium: 'Preço acima da média das opções compatíveis',
  no_fidelity_lock: 'Sem fidelidade',
  fidelity_required: 'Exige fidelidade',
  fidelity_unknown: 'Fidelidade não informada',
  cheaper_than_current_plan: 'Mais barato que o seu plano atual',
  improves_download_over_current_plan: 'Download melhor que o seu plano atual',
  improves_upload_over_current_plan: 'Upload melhor que o seu plano atual',
}

// Do perfil/faixa em si (RecommendationResult.profileReasonCodes) — só
// aparecem quando currentConnection foi enviado.
const PROFILE_REASON_CODE_COPY: Record<string, string> = {
  current_download_below_need: 'Sua última medição veio abaixo do que seu uso pede',
  current_download_within_need: 'Sua última medição já atende ao seu uso',
  current_upload_below_need: 'Seu upload medido veio abaixo do que seu uso pede',
  current_upload_within_need: 'Seu upload medido já atende ao seu uso',
  high_latency_detected: 'Sua medição indicou latência alta',
}

// De currentPlanComparison.reasonCodes — só aparecem quando currentPlan foi enviado.
const CURRENT_PLAN_REASON_CODE_COPY: Record<string, string> = {
  current_plan_below_range: 'Seu plano atual está abaixo da faixa recomendada',
  current_plan_within_range: 'Seu plano atual já está dentro da faixa recomendada',
  current_plan_above_range: 'Seu plano atual está acima do que seu uso pede',
  current_plan_speed_unknown: 'Velocidade do seu plano atual não informada',
}

const ALL_REASON_CODE_COPY: Record<string, string> = {
  ...OFFER_REASON_CODE_COPY,
  ...PROFILE_REASON_CODE_COPY,
  ...CURRENT_PLAN_REASON_CODE_COPY,
}



export function reasonCodeToCopy(code: string): string | undefined {
  return ALL_REASON_CODE_COPY[code]
}

export type ReasonVisualType = 'success' | 'neutral' | 'alert'

export interface ReasonCopy {
  id: string
  text: string
  type: ReasonVisualType
  icon: string
  color: string
}

function getReasonType(code: string): ReasonVisualType {
  const positives = [
    'meets_minimum_download', 'download_within_ideal_range', 'upload_meets_need',
    'price_competitive', 'no_fidelity_lock', 'cheaper_than_current_plan',
    'improves_download_over_current_plan', 'improves_upload_over_current_plan'
  ]
  const alerts = [
    'below_minimum_download', 'upload_below_need', 'price_premium',
    'fidelity_required', 'above_max_useful_download'
  ]
  
  if (positives.includes(code)) return 'success'
  if (alerts.includes(code)) return 'alert'
  return 'neutral'
}

export function reasonCodesToCopy(codes: string[]): ReasonCopy[] {
  const seen = new Set<string>()
  const result: ReasonCopy[] = []
  
  for (const code of codes) {
    const text = reasonCodeToCopy(code)
    if (!text) continue
    
    if (seen.has(text)) continue
    seen.add(text)
    
    const type = getReasonType(code)
    let icon = 'info'
    let color = 'var(--text-secondary)'
    
    if (type === 'success') {
      icon = 'check_circle'
      color = 'var(--success)'
    } else if (type === 'alert') {
      icon = 'warning'
      color = 'var(--warning)'
    }
    
    result.push({ id: code, text, type, icon, color })
  }
  return result
}