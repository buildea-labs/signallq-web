import { describe, expect, it } from 'vitest'
import { contextualProblemFromSearch } from './contextualEntry'

describe('contextualProblemFromSearch', () => {
  it('accepts only an explicit declared problem', () => {
    expect(contextualProblemFromSearch('?context=travando')).toBe('travando')
    expect(contextualProblemFromSearch('?context=admin')).toBeNull()
    expect(contextualProblemFromSearch('?context=')).toBeNull()
  })
})
