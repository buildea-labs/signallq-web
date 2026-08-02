"use client";

import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { PROBLEMAS_PERCEBIDOS } from "@/lib/problemEntry";

/** Trio de métricas ao vivo e cancelamento, enquanto o teste executa. */
export function TestRunning({ journey }: { journey: SpeedTestJourney }) {
  const { phase, measurementContext } = journey;

  let statusText = "Preparando teste...";
  if (phase === "latencia") statusText = "Medindo tempo de resposta inicial...";
  else if (phase === "download") {
    statusText = journey.modo === "rapido" ? "Quase acabando..." : "Avaliando capacidade de download...";
  } else if (phase === "upload") statusText = "Quase acabando, medindo upload...";
  else if (phase === "processando") statusText = "Consolidando resultado...";

  return (
    <>
      {measurementContext?.declaredProblem && (
        <p className="m-0 text-center text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">
          Contexto informado: {PROBLEMAS_PERCEBIDOS.find((opcao) => opcao.value === measurementContext.declaredProblem)?.label}
        </p>
      )}
      <p className="m-0 mt-4 text-center text-[16px] font-medium text-[color:var(--text-primary)] animate-pulse">
        {statusText}
      </p>
      <button
        onClick={journey.cancelTest}
        className="h-[40px] flex items-center gap-[6px] border-none bg-transparent cursor-pointer"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[color:var(--text-primary)]">close</span>
        <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--text-primary)]">
          Cancelar teste
        </span>
      </button>
    </>
  );
}
