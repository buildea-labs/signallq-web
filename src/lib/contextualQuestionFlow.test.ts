import { describe, expect, it } from 'vitest'
import { createMeasurementSessionContext } from './measurementSessionContext'
import { resolveContextualQuestions } from './contextualQuestionFlow'

describe('contextual question flow', () => {
  it('concludes directly without questions for a direct speed test', () => {
    expect(resolveContextualQuestions(createMeasurementSessionContext('direct')).status).toBe('concluded')
  })

  it('returns one or more questions according to the reported problem', () => {
    const context = createMeasurementSessionContext('problem', 'lenta')
    const first = resolveContextualQuestions(context)
    expect(first.status).toBe('awaiting_answer')
    if (first.status !== 'awaiting_answer') return
    expect(first.question.id).toBe('internet_lenta_q1')
    const second = resolveContextualQuestions(context, [{ questionId: first.question.id, answerId: 'sempre' }])
    expect(second.status).toBe('awaiting_answer')
    if (second.status === 'awaiting_answer') expect(second.question.id).toBe('internet_lenta_q2a')
  })

  it('allows an optional question to be skipped as unavailable data, without assuming an answer', () => {
    const context = createMeasurementSessionContext('problem', 'wifi-nao-chega-bem')
    expect(resolveContextualQuestions(context, []).status).toBe('awaiting_answer')
    expect(resolveContextualQuestions(context, [{ questionId: 'wifi_q1', answerId: null }]).status).toBe('concluded')
  })

  it('separates invalid answers, insufficient data and unavailable versions', () => {
    const context = createMeasurementSessionContext('problem', 'cai-com-frequencia')
    expect(resolveContextualQuestions(context, [{ questionId: 'nao_sei_q2_cai', answerId: 'nao-existe' }]).status).toBe('invalid_answer')
    expect(resolveContextualQuestions({ version: 1, entry: 'problem' }).status).toBe('insufficient_data')
    expect(resolveContextualQuestions({ version: 2 as 1, entry: 'direct' }).status).toBe('unavailable')
  })
})
