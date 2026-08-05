"use client";

import { PlayStoreBadge } from "@/components/PlayStoreBadge";
import { ResultAdSlot } from "@/components/ResultAdSlot";
import { GuidedDiagnosis } from "@/components/speedtest/GuidedDiagnosis";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { FullResultMetrics } from "./FullResultMetrics";
import { ResultTechnicalDetails } from "./ResultTechnicalDetails";
import { RetestComparison } from "./RetestComparison";
import { UseCaseSummary } from "./UseCaseSummary";
import { STATUS_LABEL, STATUS_MESSAGE } from "./homeCopy";

/** Leitura completa do resultado: conclusão+próxima ação, comparação, detalhes e ações finais. */
export function CompleteDiagnosis({ journey }: { journey: SpeedTestJourney }) {
  const { result, hasVisibleResult, retesteBase, comparacaoReteste, modo, emAprofundamentoPosResultado } = journey;
  if (!hasVisibleResult || !result || modo === "rapido") return null;

  // Uma única conclusão na tela. Quando a pessoa declarou contexto no sheet, a
  // resposta calculada com esse contexto é a boa; sem contexto declarado, vale
  // a genérica. Antes eram dois blocos concorrentes em componentes diferentes.
  const respostaDiagnostica = journey.respostaDiagnosticaPosResultado ?? journey.respostaDiagnostica;

  const statusCompleto = result.status === "complete";
  const statusMensagem = STATUS_MESSAGE[result.status];
  // Aprofundamento pós-resultado ativo (bug crítico #1+#2): a conclusão
  // específica já aparece em `PostResultProblemPrompt`
  // (`respostaDiagnosticaPosResultado`, calculada com o contexto declarado +
  // respostas guiadas). Sem esta guarda, esta seção duplicaria "Próxima
  // ação" com um segundo texto genérico (sem o contexto declarado) assim que
  // `modo` vira "completo" de verdade — reproduzido via teste de integração.
  // aprofundamentoPosResultadoAtivo removido conforme nova especificação UX

  return (
    <div className="w-full max-w-[720px] flex flex-col">

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

      {respostaDiagnostica && (
        <section
          aria-labelledby="resultado-conclusao"
          data-testid="post-result-diagnostico"
          className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]"
        >
          {/* O diagnóstico lidera a tela do resultado completo (protótipo,
              tela 2.4): overline curta e a conclusão em seguida — sem cartão,
              sem ícone decorativo. */}
          <p className="m-0 mb-[6px] font-bold text-[10.5px] uppercase leading-[1.4] tracking-[.4px] text-[color:var(--accent)]">
            Diagnóstico
          </p>
          <h1 id="resultado-conclusao" className="m-0 font-bold text-[20px] sm:text-[24px] leading-[1.3] text-[color:var(--text-primary)] tracking-tight">
            {respostaDiagnostica.conclusion}
          </h1>
          <p className="mt-2 mb-0 font-normal text-[14px] leading-[1.45] text-[color:var(--text-secondary)]">{respostaDiagnostica.impact}</p>

          {/* Só quando o download do teste completo difere da estimativa
              rápida anterior — comparação booleana, sem mostrar os dois
              valores (spec Juliana §3). */}
          {journey.downloadMudouNoAprofundamento && (
            <p className="mt-2 mb-0 text-[12px] leading-[1.4] text-[color:var(--text-tertiary)]">
              Este é o resultado do teste completo — pode variar um pouco em relação à estimativa rápida anterior.
            </p>
          )}

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

      {/* Métricas em hierarquia (protótipo, tela 2.4 e painel `desktop-2`):
          download/upload lideram, ping e latência sob carga vêm em seguida.
          O detalhamento completo continua no bloco expansível abaixo. */}
      <section aria-label="Métricas da medição" className="flex flex-col gap-6 py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
        <FullResultMetrics result={result} />
        <UseCaseSummary result={result} />
      </section>

      {retesteBase && comparacaoReteste && (
        <RetestComparison comparacao={comparacaoReteste} comparacaoNaoSalva={journey.comparacaoNaoSalva} />
      )}

      <ResultTechnicalDetails result={result} />

      {/* Única ação primária da etapa: reteste. "Ver histórico" é navegação de
          saída, rebaixada ao mesmo peso de Compartilhar/Copiar resumo (#71 §3.2/§3.4.6). */}
      {/* Ações da tela 2.4: reteste ocupa a largura, compartilhar é um botão
          quadrado ao lado. "Ver histórico" e "Copiar resumo" saíram daqui —
          navegação de saída e utilitário não competem com a ação principal;
          o Histórico continua no menu do site. */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => {
            if (!statusCompleto && emAprofundamentoPosResultado) {
              journey.iniciarAprofundamento();
              return;
            }
            journey.iniciarReteste();
          }}
          className="flex h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-[color:var(--accent)] bg-transparent transition-colors hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[color:var(--accent)]">refresh</span>
          <span className="font-bold text-[13.5px] leading-[1.43] text-[color:var(--accent)]">Testar novamente</span>
        </button>
        <button
          onClick={journey.compartilhar}
          aria-label="Compartilhar"
          className="flex h-[48px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] border border-[color:color-mix(in_srgb,var(--border)_45%,transparent)] bg-transparent transition-colors hover:bg-[color:var(--bg-secondary)]"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[color:var(--text-primary)]">share</span>
        </button>
      </div>

      {/* Entrada por rota editorial (`/?context=...`): o problema veio da URL,
          mas as perguntas que refinam a causa continuam sendo feitas aqui —
          é o único caminho que não passa pelo sheet de diagnóstico. */}
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
