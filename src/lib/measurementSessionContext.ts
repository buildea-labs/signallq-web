import type { ProblemaPercebido } from './problemEntry'

/**
 * Fronteira local e versionada para dados declarados antes da medição.
 *
 * Ela contém somente escolhas explícitas e não identificáveis do visitante.
 * Não é parte de `DiagnosticSnapshot` e não deve ser enviada ao Android ou ao
 * Worker até que o contrato oficial passe a defini-la.
 */
export const MEASUREMENT_SESSION_CONTEXT_VERSION = 1 as const

export type MeasurementEntry = 'direct' | 'problem'

export interface MeasurementSessionContext {
  version: typeof MEASUREMENT_SESSION_CONTEXT_VERSION
  entry: MeasurementEntry
  declaredProblem?: ProblemaPercebido
}

export function createMeasurementSessionContext(
  entry: MeasurementEntry,
  declaredProblem?: ProblemaPercebido,
): MeasurementSessionContext {
  return entry === 'problem' && declaredProblem
    ? { version: MEASUREMENT_SESSION_CONTEXT_VERSION, entry, declaredProblem }
    : { version: MEASUREMENT_SESSION_CONTEXT_VERSION, entry: 'direct' }
}
