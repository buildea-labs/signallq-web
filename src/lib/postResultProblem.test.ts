import { describe, expect, it } from 'vitest'
import { resolveContextualQuestions } from './contextualQuestionFlow'
import {
  POST_RESULT_PROBLEMS,
  buildPostResultMeasurementContext,
  isPostResultProblema,
  postResultInitialAnswers,
  postResultProblemMapping,
} from './postResultProblem'

describe('post-result problem vocabulary (#69)', () => {
  it('lists exactly the 6 options from the issue, in order, without the pre-test Wi-Fi option', () => {
    expect(POST_RESULT_PROBLEMS.map((p) => p.value)).toEqual([
      'lenta',
      'travando',
      'jogos-com-lag',
      'chamadas-ruins',
      'cai-com-frequencia',
      'sem-problema',
    ])
    expect((POST_RESULT_PROBLEMS as readonly { value: string }[]).some((p) => p.value === 'wifi-nao-chega-bem')).toBe(
      false
    )
  })

  it('recognizes only the 6 declared values', () => {
    for (const problema of POST_RESULT_PROBLEMS) expect(isPostResultProblema(problema.value)).toBe(true)
    expect(isPostResultProblema('wifi-nao-chega-bem' as string)).toBe(false)
    expect(isPostResultProblema('qualquer-coisa')).toBe(false)
  })

  it('"Não, só queria testar" builds no measurement context and no answers', () => {
    expect(buildPostResultMeasurementContext('sem-problema')).toBeNull()
    expect(postResultInitialAnswers('sem-problema')).toEqual([])
  })

  it('"Está lenta" / "Está travando" / "Cai com frequência" map straight to the existing declaredProblem vocabulary, without pre-filled answers', () => {
    expect(postResultProblemMapping('lenta')).toEqual({ declaredProblem: 'lenta', initialAnswers: [] })
    expect(postResultProblemMapping('travando')).toEqual({ declaredProblem: 'travando', initialAnswers: [] })
    expect(postResultProblemMapping('cai-com-frequencia')).toEqual({
      declaredProblem: 'cai-com-frequencia',
      initialAnswers: [],
    })
  })

  it('"Jogos com lag" pre-fills web_atividade_q1=jogos and jumps straight to jogos_q1, without reinterpreting the cause', () => {
    const context = buildPostResultMeasurementContext('jogos-com-lag')
    const answers = postResultInitialAnswers('jogos-com-lag')
    expect(answers).toEqual([{ questionId: 'web_atividade_q1', answerId: 'jogos' }])
    const state = resolveContextualQuestions(context, answers)
    expect(state.status).toBe('awaiting_answer')
    if (state.status === 'awaiting_answer') expect(state.question.id).toBe('jogos_q1')
  })

  it('"Vídeos ou chamadas ruins" pre-fills web_atividade_q1=chamadas and jumps straight to chamadas_q1', () => {
    const context = buildPostResultMeasurementContext('chamadas-ruins')
    const answers = postResultInitialAnswers('chamadas-ruins')
    expect(answers).toEqual([{ questionId: 'web_atividade_q1', answerId: 'chamadas' }])
    const state = resolveContextualQuestions(context, answers)
    expect(state.status).toBe('awaiting_answer')
    if (state.status === 'awaiting_answer') expect(state.question.id).toBe('chamadas_q1')
  })

  it('"Está lenta" starts the same first question as the pre-test declared-problem flow', () => {
    const context = buildPostResultMeasurementContext('lenta')
    const state = resolveContextualQuestions(context, [])
    expect(state.status).toBe('awaiting_answer')
    if (state.status === 'awaiting_answer') expect(state.question.id).toBe('internet_lenta_q1')
  })
})
