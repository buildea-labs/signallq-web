import { useEffect, useMemo, useState } from 'react'
import type { MeasurementSessionContext } from '../../lib/measurementSessionContext'
import { resolveContextualQuestions, type ContextualAnswer } from '../../lib/contextualQuestionFlow'
import { activateQuestionnaire, readMeasurementSession, saveQuestionnaireAnswers } from '../../lib/measurementSessionStore'

type Props = { measurementContext: MeasurementSessionContext | null; onAnswersChange?: (answers: ContextualAnswer[]) => void }

/**
 * Apresentação do fluxo local de perguntas. O resolvedor define perguntas e
 * transições; este componente apenas preserva os códigos das respostas.
 */
export function GuidedDiagnosis({ measurementContext, onAnswersChange }: Props) {
  const [answers, setAnswers] = useState<ContextualAnswer[]>(() => readMeasurementSession()?.answers ?? [])
  const state = useMemo(() => resolveContextualQuestions(measurementContext, answers), [measurementContext, answers])

  useEffect(() => {
    const restored = readMeasurementSession()
    if (restored && restored.context.entry === measurementContext?.entry && restored.context.declaredProblem === measurementContext?.declaredProblem) {
      setAnswers(restored.answers)
    }
    activateQuestionnaire()
  }, [measurementContext])

  useEffect(() => { onAnswersChange?.(answers) }, [answers, onAnswersChange])

  const reset = () => {
    setAnswers([])
    saveQuestionnaireAnswers([])
  }
  const appendAnswer = (answerId: string | null) => {
    if (!('question' in state)) return
    setAnswers((current) => {
      const next = [...current, { questionId: state.question.id, answerId }]
      saveQuestionnaireAnswers(next)
      return next
    })
  }

  if (state.status === 'awaiting_answer' || state.status === 'invalid_answer') {
    return (
      <div className="flex flex-col gap-[10px]" aria-live="polite">
        <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">
          Detalhes do problema
        </div>
        <h3 className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">{state.question.text}</h3>
        {state.status === 'invalid_answer' && (
          <p className="m-0 text-[13px] leading-[1.4] text-[color:var(--error)]">Escolha uma das opções disponíveis ou pule esta pergunta.</p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {state.question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => appendAnswer(option.id)}
              className="min-h-11 rounded-xl border border-[color:var(--border)] bg-transparent px-3 text-left font-medium text-[14px] leading-[1.35] text-[color:var(--text-primary)] cursor-pointer hover:bg-[color:var(--bg-secondary)]"
            >
              {option.label}
            </button>
          ))}
        </div>
        {state.question.optional && (
          <button type="button" onClick={() => appendAnswer(null)} className="w-fit border-none bg-transparent p-0 font-medium text-[13px] text-[color:var(--accent)] cursor-pointer hover:underline">
            Pular por agora
          </button>
        )}
      </div>
    )
  }

  if (state.status === 'insufficient_data') {
    return <FlowNotice title="Faltam informações" message="Não foi possível continuar com as informações disponíveis." onReset={reset} />
  }
  if (state.status === 'unavailable') {
    return <FlowNotice title="Contexto indisponível" message="Este fluxo não está disponível para esta sessão." onReset={reset} />
  }
  return (
    <div className="flex flex-col gap-[10px]" aria-live="polite">
      <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">Detalhes do problema</div>
      <p className="m-0 font-normal text-[14px] leading-[1.43] text-[color:var(--text-secondary)]">
        {answers.length ? 'Respostas registradas para a próxima etapa.' : 'Nenhuma pergunta adicional é necessária para esta sessão.'}
      </p>
      {answers.length > 0 && <button type="button" onClick={reset} className="w-fit border-none bg-transparent p-0 font-medium text-[13px] text-[color:var(--accent)] cursor-pointer hover:underline">Recomeçar perguntas</button>}
    </div>
  )
}

function FlowNotice({ title, message, onReset }: { title: string; message: string; onReset: () => void }) {
  return (
    <div className="flex flex-col gap-[10px]" role="status">
      <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">Detalhes do problema</div>
      <h3 className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">{title}</h3>
      <p className="m-0 font-normal text-[14px] leading-[1.43] text-[color:var(--text-secondary)]">{message}</p>
      <button type="button" onClick={onReset} className="w-fit border-none bg-transparent p-0 font-medium text-[13px] text-[color:var(--accent)] cursor-pointer hover:underline">Tentar novamente</button>
    </div>
  )
}
