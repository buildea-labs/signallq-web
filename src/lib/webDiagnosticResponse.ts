import { classifyDownload, classifyJitter, classifyLatency, classifyUpload } from './classification'
import type { ContextualAnswer } from './contextualQuestionFlow'
import type { MeasurementSessionContext } from './measurementSessionContext'
import type { SpeedTestResult } from './speedEngine'

/** Resposta local browser-safe; mantém uma única fronteira para futuro adaptador Cloudflare. */
export const WEB_DIAGNOSTIC_RESPONSE_VERSION = 1 as const

export type WebDiagnosticResponse = {
  version: typeof WEB_DIAGNOSTIC_RESPONSE_VERSION
  conclusion: string
  impact: string
  confidence: string
  nextAction: string
  androidCta?: { reason: string }
}

export function createWebDiagnosticResponse(
  result: SpeedTestResult,
  context: MeasurementSessionContext | null,
  answers: ContextualAnswer[],
): WebDiagnosticResponse {
  const base = { version: WEB_DIAGNOSTIC_RESPONSE_VERSION as typeof WEB_DIAGNOSTIC_RESPONSE_VERSION }
  if (result.status === 'contaminated') return {
    ...base, conclusion: 'A medição foi alterada durante o teste.',
    impact: 'Os números podem não representar uma única condição da sua conexão.',
    confidence: 'Confiança baixa: a rede mudou enquanto o teste acontecia.',
    nextAction: 'Faça um novo teste sem trocar de rede ou sair do local.',
  }
  if (result.status === 'partial' || result.status === 'inconclusive') return {
    ...base, conclusion: 'Ainda não há dados suficientes para uma leitura confiável.',
    impact: 'Parte da medição não terminou como esperado.',
    confidence: 'Confiança baixa: este resultado é parcial ou inconclusivo.',
    nextAction: 'Faça um novo teste e mantenha esta tela aberta até o fim.',
  }

  const download = classifyDownload(result.download.mbps)
  const upload = classifyUpload(result.upload.mbps)
  const latency = classifyLatency(result.latency.ms)
  const jitter = classifyJitter(result.jitter?.ms)
  const signals = [download.nivel, upload.nivel, latency.nivel, jitter.nivel]
  const criticalSignals = signals.filter((signal) => signal === 'error').length + (result.bufferbloat.severity === 'severe' ? 1 : 0)
  const attentionSignals = signals.filter((signal) => signal === 'warning').length + (result.bufferbloat.severity === 'moderate' ? 1 : 0)
  const hasDeclaredContext = context?.entry === 'problem'
  const answeredContext = answers.length > 0

  if (download.nivel !== 'success' && upload.nivel === 'success' && latency.nivel === 'success' && jitter.nivel === 'success' && ['none', 'mild'].includes(result.bufferbloat.severity)) return {
    ...base,
    conclusion: 'A velocidade de download desta rodada ficou abaixo do esperado, mas a leitura é limitada.',
    impact: 'Sem outros sinais nesta medição, não dá para afirmar que há um problema geral na conexão.',
    confidence: 'Confiança baixa: uma métrica isolada não confirma a origem nem a recorrência do problema.',
    nextAction: 'Faça um novo teste nas mesmas condições para verificar se esse resultado se repete.',
  }

  if (criticalSignals >= 2 || (criticalSignals >= 1 && attentionSignals >= 1)) return {
    ...base,
    conclusion: 'A medição mostra mais de um sinal que pode afetar o uso.',
    impact: 'Jogos, chamadas, vídeo ou downloads podem oscilar, conforme as métricas e o uso informado.',
    confidence: hasDeclaredContext && answeredContext ? 'Confiança moderada: combina métricas do navegador e seu contexto declarado.' : 'Confiança moderada: o navegador observou as métricas, mas não enxerga toda a rede local.',
    nextAction: 'Repita o teste em outro momento e compare as mesmas condições.',
    ...(needsAndroidContext(context) ? { androidCta: { reason: 'Para verificar sinal, canais e alcance do Wi-Fi, são necessários dados que o navegador não consegue ler.' } } : {}),
  }
  if (criticalSignals === 1 || attentionSignals >= 2) return {
    ...base,
    conclusion: 'Há um sinal de atenção nesta medição, mas não uma causa confirmada.',
    impact: 'Algumas atividades podem ficar menos estáveis dependendo do horário e do uso da rede.',
    confidence: hasDeclaredContext ? 'Confiança moderada: esta é uma hipótese baseada na medição e no contexto declarado.' : 'Confiança moderada: a medição indica atenção, sem confirmar a origem.',
    nextAction: 'Faça um novo teste nas mesmas condições para verificar se o sinal se repete.',
    ...(needsAndroidContext(context) ? { androidCta: { reason: 'Para verificar sinal, canais e alcance do Wi-Fi, são necessários dados que o navegador não consegue ler.' } } : {}),
  }
  return {
    ...base,
    conclusion: 'Esta medição não mostrou um sinal forte de instabilidade.',
    impact: hasDeclaredContext ? 'O problema percebido pode variar por horário, aplicativo ou condição local que o navegador não observa.' : 'A conexão apresentou métricas estáveis nesta rodada.',
    confidence: hasDeclaredContext ? 'Confiança moderada: uma única medição não confirma nem descarta um problema intermitente.' : 'Confiança moderada: esta é uma fotografia desta conexão neste momento.',
    nextAction: hasDeclaredContext ? 'Repita o teste quando perceber o problema novamente.' : 'Use este resultado como referência e repita se a experiência mudar.',
    ...(needsAndroidContext(context) ? { androidCta: { reason: 'Para verificar sinal, canais e alcance do Wi-Fi, são necessários dados que o navegador não consegue ler.' } } : {}),
  }
}

function needsAndroidContext(context: MeasurementSessionContext | null): boolean {
  return context?.declaredProblem === 'wifi-nao-chega-bem'
}
