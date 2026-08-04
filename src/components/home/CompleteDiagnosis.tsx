"use client";

import Link from "next/link";
import { PlayStoreBadge } from "@/components/PlayStoreBadge";
import { ResultAdSlot } from "@/components/ResultAdSlot";
import { GuidedDiagnosis } from "@/components/speedtest/GuidedDiagnosis";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { ResultTechnicalDetails } from "./ResultTechnicalDetails";
import { RetestComparison } from "./RetestComparison";
import { STATUS_LABEL, STATUS_MESSAGE } from "./homeCopy";

/** Leitura completa do resultado: conclusão+próxima ação, comparação, detalhes e ações finais. */
export function CompleteDiagnosis({ journey }: { journey: SpeedTestJourney }) {
  const { result, hasVisibleResult, respostaDiagnostica, retesteBase, comparacaoReteste, modo, postResultProblem, emAprofundamentoPosResultado } = journey;
  if (!hasVisibleResult || !result || modo === "rapido") return null;

  const statusCompleto = result.status === "complete";
  const statusMensagem = STATUS_MESSAGE[result.status];
  // Aprofundamento pós-resultado ativo (bug crítico #1+#2): a conclusão
  // específica já aparece em `PostResultProblemPrompt`
  // (`respostaDiagnosticaPosResultado`, calculada com o contexto declarado +
  // respostas guiadas). Sem esta guarda, esta seção duplicaria "Próxima
  // ação" com um segundo texto genérico (sem o contexto declarado) assim que
  // `modo` vira "completo" de verdade — reproduzido via teste de integração.
  const aprofundamentoPosResultadoAtivo = Boolean(postResultProblem) && postResultProblem !== "sem-problema";

  return (
    <div className="w-full max-w-[640px] flex flex-col">

      {statusMensagem && (
        <div className="flex items-start justify-center gap-2 py-4 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--warning)]">
            warning
          </span>
          <div className="font-normal text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">
            <b className="text-[color:var(--text-primary)]">{STATUS_LABEL[result.status]}.</b> {statusMensagem}
          </div>
        </div>
      )}

      {respostaDiagnostica && !aprofundamentoPosResultadoAtivo && (
        <section aria-labelledby="resultado-conclusao" className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
          <h1 id="resultado-conclusao" className="m-0 font-bold text-[22px] sm:text-[24px] leading-[1.25] text-[color:var(--text-primary)] tracking-tight">
            {respostaDiagnostica.conclusion}
          </h1>
          <p className="mt-2 mb-0 font-normal text-[14px] leading-[1.45] text-[color:var(--text-secondary)]">{respostaDiagnostica.impact}</p>

          <div className="mt-4">
            <h2 className="m-0 font-medium text-[11px] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">Próxima ação</h2>
            <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{respostaDiagnostica.nextAction}</p>
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

      {/* Única ação primária da etapa: reteste. "Ver histórico" é navegação de
          saída, rebaixada ao mesmo peso de Compartilhar/Copiar resumo (#71 §3.2/§3.4.6). */}
      <button
        onClick={
          statusCompleto
            ? journey.iniciarReteste
            // Bug crítico (revisão do Caio): este botão também aparece para
            // resultados que não são "complete" (ex.: `contaminated`, rede
            // caiu durante o aprofundamento). Chamar `journey.retry()` puro
            // pulava o único bookkeeping que reseta o fluxo corretamente —
            // sem transição "Aprofundando…" e com o resultado antigo
            // (gauge/badges/banner) preso na tela por cima do novo teste.
            // Se a rede caiu durante um aprofundamento pós-resultado, o
            // reteste deve continuar em modo Completo com a mesma UI de
            // aprofundamento (`iniciarAprofundamento`); caso contrário é um
            // reteste comum, que segue o reset padrão (`iniciarReteste`).
            : emAprofundamentoPosResultado
              ? journey.iniciarAprofundamento
              : journey.iniciarReteste
        }
        className="w-full h-[46px] flex items-center justify-center gap-2 rounded-[var(--radius-button)] border-none bg-[color:var(--accent)] hover:brightness-110 transition-all cursor-pointer mt-6"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[color:var(--on-accent)]">refresh</span>
        <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--on-accent)]">
          {statusCompleto ? "Fazer e testar novamente" : "Testar novamente"}
        </span>
      </button>

      <div className="flex flex-wrap justify-center gap-[10px] mt-6">
        <Link
          href="/historico"
          className="flex items-center gap-[6px] h-[36px] px-2 no-underline hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">history</span>
          <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)]">Ver histórico</span>
        </Link>
        <button
          onClick={journey.compartilhar}
          className="flex items-center gap-[6px] h-[36px] px-2 border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">share</span>
          <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)]">Compartilhar</span>
        </button>
        <button
          onClick={journey.copiarResumo}
          className="flex items-center gap-[6px] h-[36px] px-2 border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">content_copy</span>
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

      {/* Único slot de anúncio autorizado (issue #21): depois de todo o
          resultado e de todas as ações (reteste, compartilhar, copiar
          resumo, questionário contextual) — nunca antes ou entre elas.
          Restrito a `status === "complete"` (leitura literal de "resultado
          completo" da autorização) — não aparece junto de um aviso de
          resultado parcial/inconclusivo/contaminado. `ResultAdSlot` decide
          sozinho, via consentimento e configuração, se de fato renderiza. */}
      {statusCompleto && <ResultAdSlot />}
    </div>
  );
}
