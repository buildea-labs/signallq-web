import { describe, expect, it } from 'vitest'
import { createMeasurementSessionContext, MEASUREMENT_SESSION_CONTEXT_VERSION } from './measurementSessionContext'

describe('measurement session context', () => {
  it('keeps a visitor-reported problem in a versioned local boundary', () => {
    expect(createMeasurementSessionContext('problem', 'travando')).toEqual({
      version: MEASUREMENT_SESSION_CONTEXT_VERSION,
      entry: 'problem',
      declaredProblem: 'travando',
    })
  })

  it('does not create a problem session without an explicit reported problem', () => {
    expect(createMeasurementSessionContext('problem')).toEqual({
      version: MEASUREMENT_SESSION_CONTEXT_VERSION,
      entry: 'direct',
    })
  })
})
