"use client";

import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { PROBLEMAS_PERCEBIDOS } from "@/lib/problemEntry";

/** Entrada por problema percebido, antes de iniciar a medição. */
export function ProblemPrompt({ journey }: { journey: SpeedTestJourney }) {
  const { entradaProblemaAberta, problemaPercebido } = journey;

  if (!entradaProblemaAberta) {
    return (
      <button
        type="button"
        onClick={journey.abrirEntradaPorProblema}
        className="h-[40px] rounded-full px-4 border border-[color:var(--border)] bg-transparent cursor-pointer font-medium text-[14px] leading-[1.43] text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
      >
        Minha internet está com problema
      </button>
    );
  }

  return (
    <section aria-labelledby="problema-title" className="w-full max-w-[520px] rounded-2xl border border-[color:var(--border)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="problema-title" className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">
            O que está acontecendo?
          </h2>
          <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">
            Selecione uma opção para registrar o contexto deste teste.
          </p>
        </div>
        <button
          type="button"
          onClick={journey.fecharEntradaPorProblema}
          className="h-9 w-9 shrink-0 border-none bg-transparent cursor-pointer text-[color:var(--text-secondary)]"
          aria-label="Fechar opções de problema"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PROBLEMAS_PERCEBIDOS.map((opcao) => (
          <button
            key={opcao.value}
            type="button"
            aria-pressed={problemaPercebido === opcao.value}
            onClick={() => journey.selecionarProblema(opcao.value)}
            className={`min-h-11 rounded-xl border px-3 text-left font-medium text-[14px] leading-[1.35] cursor-pointer transition-colors ${
              problemaPercebido === opcao.value
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
        onClick={journey.iniciarTesteComProblema}
        disabled={!problemaPercebido}
        className="mt-4 h-[44px] rounded-full px-5 border-none bg-[color:var(--accent)] cursor-pointer font-semibold text-[14px] text-[color:var(--on-accent)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Testar agora
      </button>
    </section>
  );
}
