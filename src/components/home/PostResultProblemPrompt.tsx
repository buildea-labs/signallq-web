"use client";

import { useId } from "react";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { resolveContextualQuestions } from "@/lib/contextualQuestionFlow";
import { POST_RESULT_PROBLEMS } from "@/lib/postResultProblem";

const TRANSITION_TEXT =
  "Algumas perguntas rápidas ajudam a apontar o motivo mais provável — sem exigir um novo teste.";

/**
 * Pergunta pós-resultado (#69): "Você está tendo algum problema agora?".
 * Só aparece depois de um resultado do modo Rápido. Selecionar uma opção já
 * é a ação — não há botão de confirmar separado. Um problema selecionado
 * inicia o aprofundamento contextual na mesma tela, sem novo teste e sem
 * trocar o modo automaticamente para Completo.
 */
export function PostResultProblemPrompt({ journey }: { journey: SpeedTestJourney }) {
  const { postResultProblem, postResultMeasurementContext, postResultAnswers } = journey;
  const groupName = useId();
  const isProblemChoice = postResultProblem !== null && postResultProblem !== "sem-problema";
  const flowState = isProblemChoice
    ? resolveContextualQuestions(postResultMeasurementContext, postResultAnswers)
    : null;

  return (
    <div className="w-full flex flex-col items-center gap-4 pt-2">
      <fieldset className="w-full max-w-[440px] border-none p-0 m-0 flex flex-col items-center gap-3">
        <legend className="m-0 mb-1 w-full px-0 text-center font-semibold text-[16px] leading-[1.35] text-[color:var(--text-primary)]">
          Você está tendo algum problema agora?
        </legend>
        <div className="flex flex-wrap justify-center gap-2">
          {POST_RESULT_PROBLEMS.map((opcao) => {
            const checked = postResultProblem === opcao.value;
            return (
              <label
                key={opcao.value}
                className={`h-9 px-[14px] rounded-full border flex items-center cursor-pointer font-medium text-[13px] sm:text-[14px] leading-[1.2] transition-colors ${
                  checked
                    ? "border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--text-primary)]"
                    : "border-[color:var(--border)] bg-transparent text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
                }`}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={opcao.value}
                  checked={checked}
                  onChange={() => journey.selecionarProblemaPosResultado(opcao.value)}
                  className="sr-only"
                />
                {opcao.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {isProblemChoice && (
        <div className="w-full max-w-[440px] flex flex-col gap-[10px]" aria-live="polite">
          <p className="m-0 text-center font-normal text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">
            {TRANSITION_TEXT}
          </p>

          {flowState && (flowState.status === "awaiting_answer" || flowState.status === "invalid_answer") && (
            <div className="flex flex-col gap-[10px]">
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">
                Contexto do teste
              </div>
              <h3 className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">
                {flowState.question.text}
              </h3>
              {flowState.status === "invalid_answer" && (
                <p className="m-0 text-[13px] leading-[1.4] text-[color:var(--error)]">
                  Escolha uma das opções disponíveis ou pule esta pergunta.
                </p>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {flowState.question.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      journey.atualizarRespostasPosResultado([
                        ...postResultAnswers,
                        { questionId: flowState.question.id, answerId: option.id },
                      ])
                    }
                    className="min-h-11 rounded-xl border border-[color:var(--border)] bg-transparent px-3 text-left font-medium text-[14px] leading-[1.35] text-[color:var(--text-primary)] cursor-pointer hover:bg-[color:var(--bg-secondary)]"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {flowState.question.optional && (
                <button
                  type="button"
                  onClick={() =>
                    journey.atualizarRespostasPosResultado([
                      ...postResultAnswers,
                      { questionId: flowState.question.id, answerId: null },
                    ])
                  }
                  className="w-fit border-none bg-transparent p-0 font-medium text-[13px] text-[color:var(--accent)] cursor-pointer hover:underline"
                >
                  Pular por agora
                </button>
              )}
            </div>
          )}

          {flowState && flowState.status === "concluded" && (
            <p className="m-0 text-center font-normal text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">
              Respostas registradas para esta medição.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
