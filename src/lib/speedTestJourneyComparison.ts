import { addComparison } from './comparisonRepository'
import { compareRetest, comparisonMode, type RetestComparison } from './retestComparison'
import type { SpeedTestResult } from './speedEngine'

export interface PersistRetestComparisonResult {
  comparison: RetestComparison | null
  persisted: boolean
}

export async function persistRetestComparison(
  base: SpeedTestResult | null,
  result: SpeedTestResult | null,
  alreadyPersistedId: string | null,
): Promise<PersistRetestComparisonResult> {
  if (!base || !result || base.id === result.id) return { comparison: null, persisted: false }

  const comparison = compareRetest(base, result)
  const mode = comparisonMode(result.mode)
  const comparisonId = `${base.id}:${result.id}`
  if (!comparison.compatible || !mode || alreadyPersistedId === comparisonId) {
    return { comparison, persisted: false }
  }

  await addComparison({ id: comparisonId, createdAt: Date.now(), beforeId: base.id, afterId: result.id, mode })
  return { comparison, persisted: true }
}

export function retestComparisonId(base: SpeedTestResult, result: SpeedTestResult) {
  return `${base.id}:${result.id}`
}
