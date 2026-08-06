import { MEASUREMENT_SESSION_CONTEXT_VERSION, type MeasurementSessionContext } from './measurementSessionContext'
import type { ContextualAnswer } from './contextualQuestionFlow'
import type { RedeDeclarada } from './networkEntry'
import type { ProblemaPercebido } from './problemEntry'

/**
 * Vocabulário da pergunta feita *depois* do primeiro resultado rápido
 * ("Você está tendo algum problema agora?"), distinto de `ProblemaPercebido`
 * (declarado *antes* do teste em `problemEntry.ts`).
 *
 * Não inclui "O Wi-Fi não chega bem" (issue #69 lista só estas 6 opções) e
 * substitui a opção pré-teste `jogos-ou-chamadas-ruins` por duas opções
 * diretas, pois a pessoa já está olhando para um resultado e escolhendo a
 * atividade diretamente — perguntar de novo "em que atividade" seria
 * redundante com a árvore em `contextualQuestionFlow.ts`.
 */
export const POST_RESULT_PROBLEMS = [
  { value: 'lenta', label: 'Está lenta' },
  { value: 'travando', label: 'Está travando' },
  { value: 'jogos-com-lag', label: 'Jogos com lag' },
  { value: 'chamadas-ruins', label: 'Vídeos ou chamadas ruins' },
  { value: 'cai-com-frequencia', label: 'Cai com frequência' },
  { value: 'sem-problema', label: 'Não, só queria testar' },
] as const

export type PostResultProblema = (typeof POST_RESULT_PROBLEMS)[number]['value']

export function isPostResultProblema(value: string): value is PostResultProblema {
  return POST_RESULT_PROBLEMS.some((problema) => problema.value === value)
}

/** As 5 opções que representam um problema; exclui a saída neutra. */
export type DeclaredPostResultProblem = Exclude<PostResultProblema, 'sem-problema'>

/**
 * Mapeia a escolha pós-resultado para o vocabulário oficial já usado pelo
 * fluxo contextual (`contextualQuestionFlow.ts`), sem reinterpretar a causa:
 * "Jogos com lag"/"Vídeos ou chamadas ruins" apenas pré-preenchem a resposta
 * de `web_atividade_q1` que a árvore já perguntaria em seguida, usando os
 * mesmos ids que ela já define (`jogos`/`chamadas`).
 */
export function postResultProblemMapping(
  value: DeclaredPostResultProblem
): { declaredProblem: Exclude<ProblemaPercebido, 'wifi-nao-chega-bem'>; initialAnswers: ContextualAnswer[] } {
  switch (value) {
    case 'lenta':
      return { declaredProblem: 'lenta', initialAnswers: [] }
    case 'travando':
      return { declaredProblem: 'travando', initialAnswers: [] }
    case 'cai-com-frequencia':
      return { declaredProblem: 'cai-com-frequencia', initialAnswers: [] }
    case 'jogos-com-lag':
      return {
        declaredProblem: 'jogos-ou-chamadas-ruins',
        initialAnswers: [{ questionId: 'web_atividade_q1', answerId: 'jogos' }],
      }
    case 'chamadas-ruins':
      return {
        declaredProblem: 'jogos-ou-chamadas-ruins',
        initialAnswers: [{ questionId: 'web_atividade_q1', answerId: 'chamadas' }],
      }
  }
}

/**
 * Contexto sintético só para alimentar `resolveContextualQuestions` a partir
 * da escolha pós-resultado. Nunca é persistido no lugar do `declaredProblem`
 * pré-teste — ver `measurementSessionStore.ts` (`postResultProblem`).
 */
export function buildPostResultMeasurementContext(
  value: PostResultProblema,
  declaredNetwork?: RedeDeclarada,
): MeasurementSessionContext | null {
  if (value === 'sem-problema') return null
  const { declaredProblem } = postResultProblemMapping(value)
  const context: MeasurementSessionContext = {
    version: MEASUREMENT_SESSION_CONTEXT_VERSION,
    entry: 'problem',
    declaredProblem,
  }
  return declaredNetwork ? { ...context, declaredNetwork } : context
}

/** Respostas com que o aprofundamento já deve começar para a opção escolhida. */
export function postResultInitialAnswers(value: PostResultProblema): ContextualAnswer[] {
  if (value === 'sem-problema') return []
  return postResultProblemMapping(value).initialAnswers
}
