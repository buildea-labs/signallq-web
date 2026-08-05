"use client";

import { useState } from "react";
import { HelpButton } from "@/components/HelpButton";
import { SegmentedControl } from "@/components/SegmentedControl";
import { GuidedDiagnosis } from "@/components/speedtest/GuidedDiagnosis";
import type { ProblemPhase } from "@/hooks/useSpeedTest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { ProblemPrompt } from "./ProblemPrompt";
import { QuickResult } from "./QuickResult";
import { TestRunning } from "./TestRunning";
import { MODOS, MODO_EXPLICACAO } from "./homeCopy";
import { PROBLEMAS } from "./problemStates";

/** Jornada do teste rápido: repouso, execução, resultado imediato e falhas. */
export function QuickTestJourney({ journey }: { journey: SpeedTestJourney }) {
  const { phase, isIdle, isRunning, isProblem, showDial, modo, erroDuranteAprofundamento } = journey;
  const problema = isProblem ? PROBLEMAS[phase as ProblemPhase] : null;
  // Ajuda sob demanda para o modo selecionado — substitui o parágrafo
  // permanente que competia com a decisão principal (#71 §3.3/§3.4.7).
  const [modoHelpOpen, setModoHelpOpen] = useState(false);

  return (
    <>
      {journey.shouldResumeContextualQuestions && (
        <div className="w-full max-w-[640px] mt-6 pt-6 border-t border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
          <GuidedDiagnosis measurementContext={journey.measurementContext} onAnswersChange={journey.setRespostasContextuais} />
        </div>
      )}

      {showDial && (
        <div className="w-full flex flex-col items-center gap-5">
          <QuickResult journey={journey} />

          {(isIdle || isProblem) && (
            <>
              <ProblemPrompt
                open={journey.entradaProblemaAberta}
                selectedProblem={journey.problemaPercebido}
                onOpen={journey.abrirEntradaPorProblema}
                onClose={journey.fecharEntradaPorProblema}
                onSelectProblem={journey.selecionarProblema}
                onStartWithProblem={journey.iniciarTesteComProblema}
              />
              <div className="w-full max-w-[260px] flex items-center justify-center gap-1">
                <SegmentedControl options={MODOS} value={modo} onChange={journey.setModo} />
                <HelpButton
                  text={MODO_EXPLICACAO[modo]}
                  label="O que muda entre os modos?"
                  open={modoHelpOpen}
                  onToggle={() => setModoHelpOpen((current) => !current)}
                  width={240}
                />
              </div>

              {isProblem && problema && (
                <div className="mt-4 p-4 rounded-xl bg-[color-mix(in_srgb,_var(--alert-error)_15%,_transparent)] flex flex-col items-center text-center gap-2 max-w-[400px]">
                   <span aria-hidden="true" className="material-symbols-outlined text-[24px] text-[color:var(--alert-error)]">{problema.icon}</span>
                   <span className="font-semibold text-[14px] text-[color:var(--text-primary)]">{problema.title}</span>
                   <span className="text-[13px] text-[color:var(--text-secondary)]">{problema.message}</span>
                   {/* Falha do aprofundamento pós-resultado (spec Juliana §4):
                       reaproveita este mesmo cartão de erro, só acrescido de
                       contexto — nunca um cartão novo. */}
                   {erroDuranteAprofundamento && (
                     <span className="text-[12px] text-[color:var(--text-secondary)]">
                       Não foi possível concluir o teste completo agora. O resultado rápido acima continua disponível.
                     </span>
                   )}
                </div>
              )}
            </>
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
        </div>
      )}
    </>
  );
}
