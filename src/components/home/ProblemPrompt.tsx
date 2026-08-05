"use client";

import type { ProblemaPercebido } from "@/lib/problemEntry";
import { PROBLEMAS_PERCEBIDOS } from "@/lib/problemEntry";

interface ProblemPromptProps {
  open: boolean;
  selectedProblem: ProblemaPercebido | null;
  onOpen: () => void;
  onClose: () => void;
  onSelectProblem: (problem: ProblemaPercebido) => void;
  onStartWithProblem: () => void;
}

/** Entrada por problema percebido, antes de iniciar a medição. */
export function ProblemPrompt({
  open,
  selectedProblem,
  onOpen,
  onClose,
  onSelectProblem,
  onStartWithProblem,
}: ProblemPromptProps) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="h-[40px] rounded-full px-4 border border-[color:var(--border)] bg-transparent cursor-pointer font-medium text-[14px] leading-[1.43] text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
      >
        Minha internet está com problema
      </button>
    );
  }

  return (
    <section aria-labelledby="problema-title" className="w-full max-w-[520px] rounded-2xl border border-[color:var(--border)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 id="problema-title" className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">
          O que está acontecendo?
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 shrink-0 border-none bg-transparent cursor-pointer text-[color:var(--text-secondary)]"
          aria-label="Fechar opções de problema"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <p className="m-0 mt-4 font-bold text-[11px] uppercase leading-[1.4] tracking-[.4px] text-[color:var(--text-secondary)]">
        Problema
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PROBLEMAS_PERCEBIDOS.map((opcao) => (
          <button
            key={opcao.value}
            type="button"
            aria-pressed={selectedProblem === opcao.value}
            onClick={() => onSelectProblem(opcao.value)}
            className={`h-9 px-[14px] rounded-full border flex items-center justify-center font-medium text-[13px] sm:text-[14px] leading-[1.2] cursor-pointer transition-colors ${
              selectedProblem === opcao.value
                ? "border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--text-primary)]"
                : "border-[color:var(--border)] bg-transparent text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
            }`}
          >
            {opcao.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onStartWithProblem}
        disabled={!selectedProblem}
        className="mt-5 h-[48px] w-full rounded-[14px] border-none bg-[color:var(--accent)] px-5 font-bold text-[14.5px] text-[color:var(--on-accent)] shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-[filter] hover:brightness-110 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        Testar agora
      </button>
    </section>
  );
}
