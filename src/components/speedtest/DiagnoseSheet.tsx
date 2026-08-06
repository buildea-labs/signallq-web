"use client";

import { useId, useRef } from "react";
import { SheetChip, SheetChipGroup } from "@/components/speedtest/SheetChip";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { ContextualQuestionFlowState } from "@/lib/contextualQuestionFlow";
import { REDES_DECLARADAS, type RedeDeclarada } from "@/lib/networkEntry";
import { POST_RESULT_PROBLEMS, type PostResultProblema } from "@/lib/postResultProblem";

interface DiagnoseSheetProps {
  open: boolean;
  network: RedeDeclarada | null;
  problem: PostResultProblema | null;
  flowState: ContextualQuestionFlowState | null;
  onSelectNetwork: (value: RedeDeclarada) => void;
  onSelectProblem: (value: PostResultProblema) => void;
  onAnswer: (questionId: string, answerId: string | null) => void;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Sheet "Diagnosticar minha internet" (protótipo, tela 2.1).
 *
 * Não é uma tela própria: sobe por cima do resultado rápido, exatamente pelo
 * motivo que o protótipo dá — o resultado do teste continua com uma única URL
 * indexável. Os dois grupos (Rede e Problema) são opcionais; a pessoa pode
 * confirmar sem responder nada e cair no teste completo sem contexto.
 *
 * A pergunta de aprofundamento que o fluxo contextual já fazia depois do
 * resultado aparece aqui dentro, antes da confirmação — assim o resultado
 * completo (tela 2.4) nunca reapresenta questionário, como o protótipo pede.
 */
export function DiagnoseSheet({
  open,
  network,
  problem,
  flowState,
  onSelectNetwork,
  onSelectProblem,
  onAnswer,
  onClose,
  onConfirm,
}: DiagnoseSheetProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, panel, onClose);

  if (!open) return null;

  const question =
    flowState?.status === "awaiting_answer" || flowState?.status === "invalid_answer" ? flowState.question : null;

  return (
    // Acima do banner de consentimento (`z-[1010]`): um modal coberto por uma
    // barra fixa deixaria o CTA inalcançável no mobile.
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-[color:var(--scrim)]" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-[520px] flex-col gap-4 overflow-y-auto rounded-t-[20px] bg-[color:var(--bg-card)] px-5 pb-7 pt-5 shadow-[0_-8px_32px_rgba(0,0,0,.22)] sm:mb-6 sm:rounded-[20px]"
      >
        <span
          aria-hidden="true"
          className="mx-auto h-1 w-9 shrink-0 rounded-full bg-[color:color-mix(in_srgb,var(--border)_45%,transparent)]"
        />

        <h2 id={titleId} className="m-0 font-bold text-[16px] leading-[1.3] text-[color:var(--text-primary)]">
          Diagnosticar minha internet
        </h2>

        <SheetChipGroup label="Rede">
          {REDES_DECLARADAS.map((rede) => (
            <SheetChip
              key={rede.value}
              label={rede.label}
              checked={network === rede.value}
              onClick={() => onSelectNetwork(rede.value)}
            />
          ))}
        </SheetChipGroup>

        <SheetChipGroup label="Problema">
          {POST_RESULT_PROBLEMS.map((opcao) => (
            <SheetChip
              key={opcao.value}
              label={opcao.label}
              checked={problem === opcao.value}
              onClick={() => onSelectProblem(opcao.value)}
            />
          ))}
        </SheetChipGroup>

        {question && (
          <div aria-live="polite">
            <SheetChipGroup label="Detalhes do problema">
              <h3 className="m-0 mb-2 w-full font-semibold text-[14px] leading-[1.35] text-[color:var(--text-primary)]">
                {question.text}
              </h3>
              {flowState?.status === "invalid_answer" && (
                <p className="m-0 mb-2 w-full text-[12px] leading-[1.4] text-[color:var(--error)]">
                  Escolha uma das opções disponíveis ou pule esta pergunta.
                </p>
              )}
              {question.options.map((option) => (
                <SheetChip
                  key={option.id}
                  label={option.label}
                  checked={false}
                  onClick={() => onAnswer(question.id, option.id)}
                />
              ))}
            </SheetChipGroup>
            {question.optional && (
              <button
                type="button"
                onClick={() => onAnswer(question.id, null)}
                className="mt-2 min-h-[36px] border-none bg-transparent p-0 text-[12px] font-medium text-[color:var(--accent)] underline underline-offset-4 cursor-pointer"
              >
                Pular por agora
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onConfirm}
          className="mt-1 min-h-[50px] w-full rounded-[14px] border-none bg-[color:var(--accent)] px-5 font-bold text-[14.5px] text-[color:var(--on-accent)] shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-[filter] hover:brightness-110 cursor-pointer"
        >
          Diagnosticar minha internet
        </button>
      </div>
    </div>
  );
}
