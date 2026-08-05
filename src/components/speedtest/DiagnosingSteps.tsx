"use client";

import type { FasePainel } from "@/lib/speedTestPhase";

const STEPS: Array<{ id: FasePainel; label: string }> = [
  { id: "latencia", label: "Tempo de resposta" },
  { id: "download", label: "Velocidade de download" },
  { id: "upload", label: "Velocidade de upload" },
  { id: "processando", label: "Análise da rede" },
];

/**
 * Processamento do diagnóstico — tela 2.3 do protótipo: nada de skeleton
 * pesado, só a lista de etapas com o que já terminou e o que está correndo.
 *
 * O progresso é derivado da fase real do motor (`FasePainel`), não de um
 * contador próprio: não há como a lista dizer "concluído" para algo que a
 * medição não fez.
 */
export function DiagnosingSteps({ phase, onCancel }: { phase: FasePainel; onCancel: () => void }) {
  const currentIndex = STEPS.findIndex((step) => step.id === phase);

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-[22px]">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="m-0 font-bold text-[15px] leading-[1.35] text-[color:var(--text-primary)] sm:text-[17px]">
          Estamos analisando sua rede
        </h2>
        <p className="m-0 text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">Isso leva poucos segundos</p>
      </div>

      <ol className="m-0 flex w-full list-none flex-col gap-[14px] p-0">
        {STEPS.map((step, index) => {
          const done = currentIndex > index;
          const active = currentIndex === index;
          return (
            <li key={step.id} className="flex w-full items-center gap-[10px]">
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full box-border ${
                  done
                    ? "bg-[color:var(--accent)]"
                    : active
                      ? "border-2 border-transparent border-t-[color:var(--accent)] motion-safe:animate-spin"
                      : "border border-[color:color-mix(in_srgb,var(--border)_45%,transparent)]"
                }`}
              >
                {done && (
                  <span className="material-symbols-outlined text-[13px] text-[color:var(--on-accent)]">check</span>
                )}
              </span>
              <span
                className={`text-[13.5px] leading-[1.4] ${
                  done || active
                    ? "font-semibold text-[color:var(--text-primary)]"
                    : "font-normal text-[color:var(--text-tertiary)]"
                }`}
              >
                {step.label}
                <span className="sr-only">{done ? " (concluído)" : active ? " (em andamento)" : " (aguardando)"}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={onCancel}
        className="min-h-[44px] border-none bg-transparent p-0 text-[12px] font-medium text-[color:var(--text-secondary)] underline underline-offset-4 cursor-pointer hover:text-[color:var(--text-primary)]"
      >
        Cancelar teste
      </button>
    </div>
  );
}
