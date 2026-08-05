"use client";

import { useState } from "react";
import { HelpButton } from "@/components/HelpButton";
import { SegmentedControl } from "@/components/SegmentedControl";
import { AlertScreen, type AlertScreenAction } from "@/components/speedtest/AlertScreen";
import { GuidedDiagnosis } from "@/components/speedtest/GuidedDiagnosis";
import type { ProblemPhase } from "@/hooks/useSpeedTest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { ProblemPrompt } from "./ProblemPrompt";
import { QuickResult } from "./QuickResult";
import { TestRunning } from "./TestRunning";
import { MODOS, MODO_EXPLICACAO } from "./homeCopy";
import { PROBLEMAS } from "./problemStates";

/** Jornada do teste rápido: formação, execução, resultado imediato e falhas. */
export function QuickTestJourney({ journey }: { journey: SpeedTestJourney }) {
  const { phase, isIdle, isRunning, isProblem, modo, layout, visualState, erroDuranteAprofundamento } = journey;
  const problema = isProblem ? PROBLEMAS[phase as ProblemPhase] : null;
  // Ajuda sob demanda para o modo selecionado — substitui o parágrafo
  // permanente que competia com a decisão principal (#71 §3.3/§3.4.7).
  const [modoHelpOpen, setModoHelpOpen] = useState(false);

  const isAlert = visualState.state === "error" || visualState.state === "offline";
  // A entrada da rota autostarta a medição: enquanto isso, a tela mostra
  // apenas a formação do mostrador (tela 1.1) — nenhum controle compete com
  // um teste que já está começando.
  const isPreparing = visualState.state === "forming" && visualState.isAutoStarting;

  const alertActions: AlertScreenAction[] = problema
    ? [
        {
          label: problema.actionLabel,
          variant: "primary",
          onClick: erroDuranteAprofundamento ? journey.iniciarAprofundamento : journey.iniciarTesteDireto,
        },
      ]
    : [];

  return (
    <>
      {journey.shouldResumeContextualQuestions && (
        <div className="w-full max-w-[560px] border-t border-[color-mix(in_srgb,_var(--border)_16%,_transparent)] pt-6">
          <GuidedDiagnosis measurementContext={journey.measurementContext} onAnswersChange={journey.setRespostasContextuais} />
        </div>
      )}

      <div
        className={`flex w-full flex-col items-center ${
          layout.stage === "stage" ? "justify-center gap-6 py-2" : "gap-6"
        }`}
      >
        {isAlert && problema ? (
          <AlertScreen
            icon={problema.icon}
            tone={visualState.state === "offline" || problema.color === "var(--error)" ? "error" : "neutral"}
            title={problema.title}
            description={problema.message}
            actions={alertActions}
          >
            {/* Falha do aprofundamento pós-resultado (spec Juliana §4):
                reaproveita a mesma tela de erro, só acrescida de contexto. */}
            {erroDuranteAprofundamento && (
              <p className="m-0 max-w-[320px] text-[12px] leading-[1.45] text-[color:var(--text-secondary)]">
                Não foi possível concluir o teste completo agora. O resultado rápido acima continua disponível.
              </p>
            )}
          </AlertScreen>
        ) : (
          <>
            <QuickResult journey={journey} />

            {isPreparing && (
              <p className="m-0 text-center text-[13px] font-semibold leading-[1.4] text-[color:var(--text-secondary)]" role="status">
                Preparando sua medição…
              </p>
            )}

            {isIdle && !isPreparing && (
              <div className="flex w-full flex-col items-center gap-5">
                <button
                  type="button"
                  onClick={journey.iniciarTesteDireto}
                  className="flex min-h-[48px] w-full max-w-[280px] items-center justify-center gap-2 rounded-[14px] border-none bg-[color:var(--accent)] px-7 font-bold text-[14.5px] text-[color:var(--on-accent)] shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-[filter] hover:brightness-110 cursor-pointer"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                    speed
                  </span>
                  Testar agora
                </button>
                <span className="text-[12px] leading-[1.3] text-[color:var(--text-tertiary)]">
                  {modo === "rapido" ? "Rápido · ~20 s" : "Completo · ~40 s"}
                </span>

                <ProblemPrompt
                  open={journey.entradaProblemaAberta}
                  selectedProblem={journey.problemaPercebido}
                  onOpen={journey.abrirEntradaPorProblema}
                  onClose={journey.fecharEntradaPorProblema}
                  onSelectProblem={journey.selecionarProblema}
                  onStartWithProblem={journey.iniciarTesteComProblema}
                />

                <div className="flex w-full max-w-[260px] items-center justify-center gap-1">
                  <SegmentedControl options={MODOS} value={modo} onChange={journey.setModo} />
                  <HelpButton
                    text={MODO_EXPLICACAO[modo]}
                    label="O que muda entre os modos?"
                    open={modoHelpOpen}
                    onToggle={() => setModoHelpOpen((current) => !current)}
                    width={240}
                  />
                </div>
              </div>
            )}

            {isRunning && (
              <TestRunning
                phase={journey.phase}
                mode={journey.modo}
                measurementContext={journey.measurementContext}
                deepeningAfterQuickResult={journey.emAprofundamentoPosResultado}
                postResultProblem={journey.postResultProblem}
                onCancel={journey.cancelTest}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
