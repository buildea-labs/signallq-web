"use client";

import { useId } from "react";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { POST_RESULT_PROBLEMS } from "@/lib/postResultProblem";

const TRANSITION_TEXT =
  "Mais um detalhe ajuda a confirmar o motivo mais provável, agora com o resultado completo.";

/**
 * Pergunta pós-resultado (#69): "Você está tendo algum problema agora?".
 * Só aparece depois de um resultado do modo Rápido. Selecionar uma opção já
 * é a ação — não há botão de confirmar separado.
 *
 * Decisão de produto revertida (bug crítico #1+#2, substitui a regra antiga
 * "não trocar modo silenciosamente" do #69): selecionar um problema aqui
 * troca `modo` para "completo" de verdade e reinicia o teste
 * (`journey.iniciarAprofundamento`, via `useSpeedTestJourney`) — a resposta
 * deixa de ser baseada só no download da rodada Rápida. Enquanto o teste roda,
 * este componente some (`TestRunning` ocupa o lugar); ao concluir, volta a
 * aparecer com o resultado completo real.
 */
export function PostResultProblemPrompt({ journey }: { journey: SpeedTestJourney }) {
  const {
    postResultProblem,
    postResultAnswers,
    postResultFlowState,
    respostaDiagnosticaPosResultado,
    notaAprofundamentoCancelado,
    downloadMudouNoAprofundamento,
  } = journey;
  const groupName = useId();
  const isProblemChoice = postResultProblem !== null && postResultProblem !== "sem-problema";
  const flowState = isProblemChoice ? postResultFlowState : null;

  return (
    <div className="w-full flex flex-col items-center gap-4 pt-2">
      {notaAprofundamentoCancelado && (
        <p className="m-0 text-center text-[13px] leading-[1.4] text-[color:var(--text-secondary)]" role="status">
          Teste completo cancelado. O resultado rápido acima continua disponível.
        </p>
      )}
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
        <div className="mt-4">
          <button
            type="button"
            onClick={() => journey.iniciarAprofundamento()}
            className="h-[44px] px-[26px] rounded-full border-none bg-[color:var(--accent)] font-semibold text-[15px] text-[color:var(--on-accent)] cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_14px_color-mix(in_srgb,_var(--accent)_30%,_transparent)]"
          >
            Rodar Teste Completo
          </button>
        </div>
      </fieldset>

      {isProblemChoice && (
        <div className="w-full max-w-[440px] flex flex-col gap-[10px]" aria-live="polite">

          {flowState && (flowState.status === "awaiting_answer" || flowState.status === "invalid_answer") && (
            <div className="flex flex-col gap-[10px]">
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">
                Detalhes do problema
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
            <div
              className="w-full flex flex-col gap-2 text-center"
              data-testid="post-result-diagnostico"
            >
              {respostaDiagnosticaPosResultado ? (
                <>
                  <p className="m-0 font-semibold text-[15px] leading-[1.35] text-[color:var(--text-primary)]">
                    {respostaDiagnosticaPosResultado.conclusion}
                  </p>
                  {/* Só quando o download do teste completo difere da
                      estimativa rápida anterior — comparação booleana, sem
                      mostrar os dois valores (spec Juliana §3). */}
                  {downloadMudouNoAprofundamento && (
                    <p className="m-0 text-[12px] sm:text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">
                      Este é o resultado do teste completo — pode variar um pouco em relação à estimativa rápida anterior.
                    </p>
                  )}
                  <div>
                    <h3 className="m-0 font-medium text-[11px] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">
                      Próxima ação
                    </h3>
                    <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">
                      {respostaDiagnosticaPosResultado.nextAction}
                    </p>
                  </div>
                </>
              ) : (
                <p className="m-0 font-normal text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">
                  Respostas registradas para esta medição.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
