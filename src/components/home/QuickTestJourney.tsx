"use client";

import { EstadoVazio } from "@/components/EstadoVazio";
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
  const { phase, isIdle, isRunning, isProblem, showDial, modo } = journey;
  const problema = isProblem ? PROBLEMAS[phase as ProblemPhase] : null;

  return (
    <>
      {isIdle && (
        <div className="flex flex-col items-center gap-[6px] text-center">
          <h1 className="m-0 font-bold text-[26px] sm:text-[30px] leading-[1.2] text-[color:var(--text-primary)]">
            Teste de velocidade
          </h1>
          <p className="m-0 max-w-[460px] font-normal text-[14px] leading-[1.43] text-[color:var(--text-secondary)]">
            Download, upload e latência medidos no seu navegador.
          </p>
        </div>
      )}

      {journey.shouldResumeContextualQuestions && (
        <div className="w-full max-w-[640px] mt-6 pt-6 border-t border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
          <GuidedDiagnosis measurementContext={journey.measurementContext} onAnswersChange={journey.setRespostasContextuais} />
        </div>
      )}

      {showDial && (
        <div className="w-full flex flex-col items-center gap-5">
          <QuickResult journey={journey} />

          {isIdle && (
            <>
              <ProblemPrompt journey={journey} />
              <div className="w-full max-w-[220px] flex justify-center">
                <SegmentedControl options={MODOS} value={modo} onChange={journey.setModo} />
              </div>
              <p className="m-0 max-w-[360px] text-center font-normal text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">
                {MODO_EXPLICACAO[modo]}
              </p>
              <a
                href="/como-medimos"
                className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)] no-underline hover:underline"
              >
                Como medimos sua conexão
              </a>
            </>
          )}

          {isRunning && <TestRunning journey={journey} />}
        </div>
      )}

      {isProblem && problema && (
        <EstadoVazio
          icon={problema.icon}
          title={problema.title}
          message={problema.message}
          actionIcon={problema.actionIcon}
          actionLabel={problema.actionLabel}
          color={problema.color}
          onAction={phase === "bloqueado-outra-aba" ? journey.iniciarTesteDireto : journey.retry}
        />
      )}
    </>
  );
}
