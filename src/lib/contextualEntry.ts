import { isProblemaPercebido, type ProblemaPercebido } from './problemEntry'

/** Only a declared local problem is accepted from an editorial link. */
export function contextualProblemFromSearch(search: string): ProblemaPercebido | null {
  const candidate = new URLSearchParams(search).get('context')
  return candidate && isProblemaPercebido(candidate) ? candidate : null
}
