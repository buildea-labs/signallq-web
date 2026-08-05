import type { FasePainel } from "@/hooks/useSpeedTest";
import { fractionForThroughput } from "@/lib/gaugeMath";
import type { SpeedTestResult } from "@/lib/speedEngine";
import {
  SPEEDOMETER_ERROR,
  SPEEDOMETER_OUTCOME,
  SPEEDOMETER_PHASE,
  type SpeedometerIdentity,
  type SpeedometerOutcome,
  type SpeedometerPhase,
} from "@/lib/speedometerIdentity";

export interface SpeedometerView {
  fraction: number;
  dialNumber: string;
  dialUnit: string;
  identity: SpeedometerIdentity;
}

/**
 * O número central do mostrador é inteiro (protótipo, `formatValue`): com uma
 * casa decimal o bloco fica largo o bastante para encostar nos rótulos da
 * escala, e a casa não muda nenhuma decisão de quem lê. As casas decimais
 * continuam disponíveis nos detalhes da medição.
 */
function formatDialNumber(mbps: number): string {
  return Math.round(mbps).toString();
}

export function buildSpeedometerView(input: {
  phase: FasePainel;
  liveValue: number;
  result: SpeedTestResult | null;
  isResult: boolean;
  isProblem: boolean;
  terminalOutcome: SpeedometerOutcome | null;
}): SpeedometerView {
  const { phase, liveValue, result, isResult, isProblem, terminalOutcome } = input;

  let fraction = 0;
  let dialNumber = "—";
  let dialUnit = "";
  const speedometerPhase: SpeedometerPhase = terminalOutcome === "complete"
    ? "concluido"
    : (phase === "idle" || phase === "preparando" || phase === "latencia" || phase === "download" || phase === "upload" || phase === "processando" ? phase : "idle");
  let identity = terminalOutcome
    ? SPEEDOMETER_OUTCOME[terminalOutcome]
    : isProblem
      ? SPEEDOMETER_ERROR
      : SPEEDOMETER_PHASE[speedometerPhase];

  if (phase === "latencia") {
    fraction = 0;
    dialNumber = "0";
    dialUnit = "Mbps";
    identity = SPEEDOMETER_PHASE["preparando"];
  } else if (phase === "download") {
    fraction = fractionForThroughput(liveValue);
    dialNumber = formatDialNumber(liveValue);
    dialUnit = "Mbps";
  } else if (phase === "upload") {
    fraction = fractionForThroughput(liveValue);
    dialNumber = formatDialNumber(liveValue);
    dialUnit = "Mbps";
  } else if (phase === "processando") {
    fraction = 1;
  } else if (isResult && result) {
    fraction = fractionForThroughput(result.download.mbps);
    dialNumber = formatDialNumber(result.download.mbps);
    dialUnit = "Mbps";
  }

  return { fraction, dialNumber, dialUnit, identity };
}
