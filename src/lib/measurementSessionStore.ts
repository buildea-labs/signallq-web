import { MEASUREMENT_SESSION_CONTEXT_VERSION, type MeasurementSessionContext } from './measurementSessionContext'
import { isProblemaPercebido } from './problemEntry'
import type { ContextualAnswer } from './contextualQuestionFlow'

export const MEASUREMENT_SESSION_STORE_VERSION = 1 as const
const STORE_KEY = 'signallq_measurement_session_v1'

export type PersistedMeasurementSession = {
  version: typeof MEASUREMENT_SESSION_STORE_VERSION
  context: MeasurementSessionContext
  answers: ContextualAnswer[]
  questionnaireActive: boolean
}

function isContext(value: unknown): value is MeasurementSessionContext {
  if (!value || typeof value !== 'object') return false
  const context = value as Record<string, unknown>
  if (context.version !== MEASUREMENT_SESSION_CONTEXT_VERSION || (context.entry !== 'direct' && context.entry !== 'problem')) return false
  if (context.entry === 'direct') return context.declaredProblem === undefined
  return context.declaredProblem === undefined || (typeof context.declaredProblem === 'string' && isProblemaPercebido(context.declaredProblem))
}

function isAnswer(value: unknown): value is ContextualAnswer {
  if (!value || typeof value !== 'object') return false
  const answer = value as Record<string, unknown>
  return typeof answer.questionId === 'string' && (typeof answer.answerId === 'string' || answer.answerId === null)
}

/** Validador puro para testes e para tratar conteúdo antigo/corrompido como indisponível. */
export function parseMeasurementSession(value: string | null): PersistedMeasurementSession | null {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return null
    const session = parsed as Record<string, unknown>
    if (session.version !== MEASUREMENT_SESSION_STORE_VERSION || !isContext(session.context) || !Array.isArray(session.answers) || !session.answers.every(isAnswer) || typeof session.questionnaireActive !== 'boolean') return null
    return { version: MEASUREMENT_SESSION_STORE_VERSION, context: session.context, answers: session.answers, questionnaireActive: session.questionnaireActive }
  } catch {
    return null
  }
}

function readRaw(): PersistedMeasurementSession | null {
  if (typeof window === 'undefined') return null
  try { return parseMeasurementSession(window.sessionStorage.getItem(STORE_KEY)) } catch { return null }
}

function write(session: PersistedMeasurementSession): void {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.setItem(STORE_KEY, JSON.stringify(session)) } catch { /* armazenamento pode estar bloqueado */ }
}

export function readMeasurementSession(): PersistedMeasurementSession | null { return readRaw() }

export function beginMeasurementSession(context: MeasurementSessionContext): void {
  write({ version: MEASUREMENT_SESSION_STORE_VERSION, context, answers: [], questionnaireActive: false })
}

export function activateQuestionnaire(): void {
  const current = readRaw()
  if (current) write({ ...current, questionnaireActive: true })
}

export function saveQuestionnaireAnswers(answers: ContextualAnswer[]): void {
  const current = readRaw()
  if (current) write({ ...current, answers })
}
