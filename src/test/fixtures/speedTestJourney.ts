import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { speedTestLayoutFor } from "@/lib/speedTestLayout";
import { deriveSpeedTestVisualState } from "@/lib/speedTestVisualState";

type JourneyStub = Partial<SpeedTestJourney> & Record<string, unknown>;

/**
 * Completa um dublê de `SpeedTestJourney` com `visualState` e `layout`
 * **derivados** pelas mesmas funções puras que a aplicação usa.
 *
 * Fixar esses dois campos à mão criaria uma segunda fonte de verdade nos
 * testes: um dublê poderia afirmar um estado visual que a jornada real nunca
 * produziria para aquela fase.
 */
export function withDerivedJourneyState(stub: JourneyStub): SpeedTestJourney {
  const phase = (stub.phase ?? "idle") as SpeedTestJourney["phase"];
  const mode = (stub.modo ?? "rapido") as "rapido" | "completo";

  const visualState = deriveSpeedTestVisualState({
    phase,
    mode,
    result: (stub.result ?? null) as SpeedTestJourney["result"],
    liveValue: (stub.liveValue ?? 0) as number,
    phaseResults: (stub.phaseResults ?? {}) as SpeedTestJourney["phaseResults"],
    measurementContext: (stub.measurementContext ?? null) as SpeedTestJourney["measurementContext"],
    isAutoStarting: Boolean(stub.isAutoStarting),
    restoredResult: Boolean(stub.resultadoRestaurado),
    deepeningAfterQuickResult: Boolean(stub.emAprofundamentoPosResultado),
  });

  return {
    ...stub,
    visualState,
    layout: speedTestLayoutFor(visualState, phase),
  } as unknown as SpeedTestJourney;
}
