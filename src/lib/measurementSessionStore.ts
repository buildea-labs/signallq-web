import { MEASUREMENT_SESSION_CONTEXT_VERSION, type MeasurementSessionContext } from './measurementSessionContext'
import { isProblemaPercebido } from './problemEntry'
import { isPostResultProblema, type PostResultProblema } from './postResultProblem'
import type { ContextualAnswer } from './contextualQuestionFlow'

export const MEASUREMENT_SESSION_STORE_VERSION = 2 as const
const STORE_KEY = 'signallq_measurement_session_v1'

/**
 * Escolha feita na pergunta pós-resultado (#69) e respostas do aprofundamento
 * que ela dispara. É um dado novo e distinto de `context.declaredProblem`
 * (declarado antes do teste): nunca sobrescreve nem reaproveita esse campo,
 * mesmo quando aponta para o mesmo vocabulário de causa (`postResultProblem.ts`).
 */
export type PersistedPostResultProblem = { value: PostResultProblema; answers: ContextualAnswer[] }

export type PersistedMeasurementSession = {
  version: typeof MEASUREMENT_SESSION_STORE_VERSION
  context: MeasurementSessionContext
  answers: ContextualAnswer[]
  questionnaireActive: boolean
  postResultProblem: PersistedPostResultProblem | null
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

function isPostResultProblem(value: unknown): value is PersistedPostResultProblem | null {
  if (value === null) return true
  if (!value || typeof value !== 'object') return false
  const postResult = value as Record<string, unknown>
  return (
    typeof postResult.value === 'string' &&
    isPostResultProblema(postResult.value) &&
    Array.isArray(postResult.answers) &&
    postResult.answers.every(isAnswer)
  )
}

/** Validador puro para testes e para tratar conteúdo antigo/corrompido como indisponível. */
export function parseMeasurementSession(value: string | null): PersistedMeasurementSession | null {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return null
    const session = parsed as Record<string, unknown>
    if (
      session.version !== MEASUREMENT_SESSION_STORE_VERSION ||
      !isContext(session.context) ||
      !Array.isArray(session.answers) ||
      !session.answers.every(isAnswer) ||
      typeof session.questionnaireActive !== 'boolean' ||
      !isPostResultProblem(session.postResultProblem)
    )
      return null
    return {
      version: MEASUREMENT_SESSION_STORE_VERSION,
      context: session.context,
      answers: session.answers,
      questionnaireActive: session.questionnaireActive,
      postResultProblem: session.postResultProblem as PersistedPostResultProblem | null,
    }
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
  write({ version: MEASUREMENT_SESSION_STORE_VERSION, context, answers: [], questionnaireActive: false, postResultProblem: null })
}

export function activateQuestionnaire(): void {
  const current = readRaw()
  if (current) write({ ...current, questionnaireActive: true })
}

export function saveQuestionnaireAnswers(answers: ContextualAnswer[]): void {
  const current = readRaw()
  if (current) write({ ...current, answers })
}

/**
 * Grava a escolha da pergunta pós-resultado (#69) e as respostas iniciais já
 * implícitas nela (ver `postResultProblem.ts`). Nunca toca em `context`/
 * `answers` do fluxo pré-teste — são campos independentes.
 */
export function savePostResultProblem(value: PostResultProblema, initialAnswers: ContextualAnswer[]): void {
  const current = readRaw()
  const base: PersistedMeasurementSession = current ?? {
    version: MEASUREMENT_SESSION_STORE_VERSION,
    context: { version: MEASUREMENT_SESSION_CONTEXT_VERSION, entry: 'direct' },
    answers: [],
    questionnaireActive: false,
    postResultProblem: null,
  }
  write({ ...base, postResultProblem: { value, answers: initialAnswers } })
}

/** Atualiza somente as respostas do aprofundamento pós-resultado em andamento. */
export function savePostResultAnswers(answers: ContextualAnswer[]): void {
  const current = readRaw()
  if (!current || !current.postResultProblem) return
  write({ ...current, postResultProblem: { ...current.postResultProblem, answers } })
}
