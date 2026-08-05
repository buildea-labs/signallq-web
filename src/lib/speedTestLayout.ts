import type { FasePainel } from './speedTestPhase'
import type { SpeedTestVisualState } from './speedTestVisualState'

/**
 * Como cada um dos nove estados visuais ocupa a tela.
 *
 * - `stage`  etapa curta que o protótipo mostra centralizada e sem rolagem
 *            (formação, medição, processamento, falha, offline);
 * - `document` conteúdo que rola a partir do topo (resultados).
 *
 * `dial` diz qual leitura o mostrador faz — `hidden` quando o protótipo
 * entrega a tela às métricas/diagnóstico em vez do velocímetro (telas 2.3 e
 * 2.4). Função pura de propósito: a composição não decide layout por conta
 * própria, e cada regra é testável isoladamente.
 */
export interface SpeedTestLayout {
  stage: 'stage' | 'document'
  dial: 'hidden' | 'forming' | 'measuring' | 'result'
  contentMax: string
}

const STAGE_MAX = '560px'
const QUICK_RESULT_MAX = '560px'
const FULL_RESULT_MAX = '720px'

export function speedTestLayoutFor(visualState: SpeedTestVisualState, phase: FasePainel): SpeedTestLayout {
  switch (visualState.state) {
    case 'forming':
      return { stage: 'stage', dial: 'forming', contentMax: STAGE_MAX }

    case 'quick-running':
      // `preparando` é a fase anterior à primeira amostra: mostrar um número
      // (ou um travessão) sugeriria uma leitura que ainda não existe.
      return phase === 'preparando'
        ? { stage: 'stage', dial: 'forming', contentMax: STAGE_MAX }
        : { stage: 'stage', dial: 'measuring', contentMax: STAGE_MAX }

    case 'full-running':
      // Medição terminada e diagnóstico rodando (tela 2.3): a lista de etapas
      // ocupa a tela sozinha — o mostrador não tem mais o que ler.
      if (phase === 'processando') return { stage: 'stage', dial: 'hidden', contentMax: STAGE_MAX }
      return phase === 'preparando'
        ? { stage: 'stage', dial: 'forming', contentMax: STAGE_MAX }
        : { stage: 'stage', dial: 'measuring', contentMax: STAGE_MAX }

    case 'quick-result':
      return { stage: 'document', dial: 'result', contentMax: QUICK_RESULT_MAX }

    case 'restored-result':
      // Um resultado rápido restaurado continua liderado pelo mostrador; um
      // completo é liderado pelo diagnóstico, como na primeira exibição.
      return visualState.mode === 'rapido'
        ? { stage: 'document', dial: 'result', contentMax: QUICK_RESULT_MAX }
        : { stage: 'document', dial: 'hidden', contentMax: FULL_RESULT_MAX }

    case 'diagnosing':
    case 'full-result':
      return { stage: 'document', dial: 'hidden', contentMax: FULL_RESULT_MAX }

    case 'error':
    case 'offline':
      return { stage: 'stage', dial: 'hidden', contentMax: STAGE_MAX }
  }
}
