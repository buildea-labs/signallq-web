import { describe, expect, it } from 'vitest'
import { parseMeasurementSession, MEASUREMENT_SESSION_STORE_VERSION } from './measurementSessionStore'
import { resolveContextualQuestions } from './contextualQuestionFlow'

describe('measurement session serialization', () => {
  it('restores browser-safe context and answers after navigation', () => {
    const raw = JSON.stringify({
      version: MEASUREMENT_SESSION_STORE_VERSION,
      context: { version: 1, entry: 'problem', declaredProblem: 'wifi-nao-chega-bem' },
      answers: [{ questionId: 'wifi_q1', answerId: 'longe' }],
      questionnaireActive: true,
    })
    const restored = parseMeasurementSession(raw)
    expect(restored).toEqual(JSON.parse(raw))
    if (!restored) return
    const flow = resolveContextualQuestions(restored.context, restored.answers)
    expect(flow.status).toBe('awaiting_answer')
    if (flow.status === 'awaiting_answer') expect(flow.question.id).toBe('wifi_q2_longe')
  })

  it('treats corrupt or incompatible persisted state as unavailable', () => {
    expect(parseMeasurementSession('{not json')).toBeNull()
    expect(parseMeasurementSession(JSON.stringify({ version: 99 }))).toBeNull()
  })

  it('accepts an explicit optional skip without inventing an answer', () => {
    const raw = JSON.stringify({
      version: 1, context: { version: 1, entry: 'problem', declaredProblem: 'lenta' },
      answers: [{ questionId: 'internet_lenta_q1', answerId: null }], questionnaireActive: true,
    })
    expect(parseMeasurementSession(raw)?.answers[0].answerId).toBeNull()
  })
})
