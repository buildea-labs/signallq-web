"use client";

import { PlayStoreBadge } from "@/components/PlayStoreBadge";
import { GuidedDiagnosis } from "@/components/speedtest/GuidedDiagnosis";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { ResultTechnicalDetails } from "./ResultTechnicalDetails";
import { RetestComparison } from "./RetestComparison";
import { STATUS_LABEL, STATUS_MESSAGE } from "./homeCopy";

/** Leitura completa do resultado: ação, comparação, detalhes e ações finais. */
export function CompleteDiagnosis({ journey }: { journey: SpeedTestJourney }) {
  const { result, hasVisibleResult, respostaDiagnostica, retesteBase, comparacaoReteste } = journey;
  if (!hasVisibleResult || !result) return null;

  const statusCompleto = result.status === "complete";
  const statusMensagem = STATUS_MESSAGE[result.status];

  return (
    <div className="w-full max-w-[640px] flex flex-col">

      {statusMensagem && (
        <div className="flex items-start justify-center gap-2 py-4 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
          <span className="material-symbols-outlined text-[16px] text-[color:var(--warning)]">
            warning
          </span>
          <div className="font-normal text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">
            <b className="text-[color:var(--text-primary)]">{STATUS_LABEL[result.status]}.</b> {statusMensagem}
          </div>
        </div>
      )}

      {respostaDiagnostica && (
        <section aria-labelledby="resultado-acao" className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
          <div className="grid gap-4 sm:grid-cols-1">
            <div>
              <h2 className="m-0 font-medium text-[11px] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">Próxima ação</h2>
              <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{respostaDiagnostica.nextAction}</p>
            </div>
          </div>
          {respostaDiagnostica.androidCta && (
            <div className="mt-4 flex flex-wrap items-center gap-[10px] rounded-xl border border-[color:var(--border)] p-3">
              <p className="m-0 flex-1 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{respostaDiagnostica.androidCta.reason}</p>
              <PlayStoreBadge height={32} source="home-resultado-wifi-contextual" />
            </div>
          )}
        </section>
      )}

      {retesteBase && comparacaoReteste && (
        <RetestComparison comparacao={comparacaoReteste} comparacaoNaoSalva={journey.comparacaoNaoSalva} />
      )}



      <ResultTechnicalDetails result={result} />

      <a
        href="/como-medimos"
        className="self-center mt-6 font-medium text-[14px] leading-[1.43] text-[color:var(--accent)] no-underline hover:underline"
      >
        Entenda como o teste mede sua conexão
      </a>

      <div className="flex gap-3 mt-6">
        <button
          onClick={statusCompleto ? journey.iniciarReteste : journey.retry}
          className="flex-1 h-[46px] flex items-center justify-center gap-2 rounded-[var(--radius-button)] border-none bg-[color:var(--accent)] hover:brightness-110 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-[color:var(--on-accent)]">refresh</span>
          <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--on-accent)]">
            {statusCompleto ? "Fazer e testar novamente" : "Testar novamente"}
          </span>
        </button>
        <a
          href="/historico"
          className="flex-1 h-[46px] flex items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color:var(--border)] no-underline hover:bg-[color:var(--bg-secondary)] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] text-[color:var(--accent)]">history</span>
          <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--accent)]">Ver histórico</span>
        </a>
      </div>

      <div className="flex flex-wrap justify-center gap-[10px] mt-6">
        <button
          onClick={journey.compartilhar}
          className="flex items-center gap-[6px] h-[36px] px-2 border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">share</span>
          <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)]">Compartilhar</span>
        </button>
        <button
          onClick={journey.copiarResumo}
          className="flex items-center gap-[6px] h-[36px] px-2 border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">content_copy</span>
          <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)]">
            {journey.copiado ? "Copiado!" : "Copiar resumo"}
          </span>
        </button>
      </div>

      {journey.shouldCollectContextualQuestions && (
        <div className="mt-6 pt-6 border-t border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
          <GuidedDiagnosis measurementContext={journey.measurementContext} onAnswersChange={journey.setRespostasContextuais} />
        </div>
      )}
    </div>
  );
}
