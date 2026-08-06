"use client";

import { Velocimetro } from "@/components/Velocimetro";
import { buildSpeedometerView } from "@/components/home/speedometerView";
import { PROBLEM_PHASES, RUNNING_PHASES, type ProblemPhase } from "@/lib/speedTestPhase";
import type { SpeedometerOutcome } from "@/lib/speedometerIdentity";
import type { DiagnosticoJornada } from "@/hooks/useDiagnosticoJornada";

interface Props {
  motor: DiagnosticoJornada["motor"];
}

const ICONE_DESFECHO: Record<SpeedometerOutcome, string> = {
  complete: "check_circle",
  partial: "warning",
  inconclusive: "warning",
  contaminated: "warning",
  cancelled: "cancel",
};

export function VelocimetroAoVivo({ motor }: Props) {
  const { phase, liveValue, result } = motor;
  const isProblem = PROBLEM_PHASES.includes(phase as ProblemPhase);
  const terminalOutcome: SpeedometerOutcome | null = result && !isProblem ? result.status : null;
  const { fraction, dialNumber, dialUnit, identity } = buildSpeedometerView({
    phase,
    liveValue,
    result,
    isResult: Boolean(result) && !isProblem,
    isProblem,
    terminalOutcome,
  });

  const seloProprio = terminalOutcome !== null;

  return (
    <div className="relative w-full flex flex-col items-center gap-3">
      <div
        aria-hidden="true"
        className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[75%] aspect-square rounded-full blur-3xl pointer-events-none"
        style={{ background: `color-mix(in srgb, ${identity.color} 20%, transparent)` }}
      />

      <div className="relative w-full flex justify-center">
        <Velocimetro
          fraction={fraction}
          phaseColor={identity.color}
          isRunning={RUNNING_PHASES.includes(phase)}
          phase={phase}
          liveValue={liveValue}
          value={dialNumber}
          unit={dialUnit}
          phaseLabel={seloProprio ? undefined : identity.label}
          narrative={seloProprio ? undefined : identity.narrative}
        />
      </div>

      {seloProprio && (
        <div
          className="relative flex items-center gap-1.5 rounded-full border px-3.5 py-1.5"
          style={{ borderColor: "color-mix(in srgb, var(--border) 30%, transparent)", background: "var(--bg-card)" }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]" style={{ color: identity.color }}>
            {ICONE_DESFECHO[terminalOutcome]}
          </span>
          <span className="font-medium text-[13px] text-[color:var(--text-primary)]">
            {identity.narrative.replace(/\.$/, "")}
          </span>
        </div>
      )}
    </div>
  );
}
