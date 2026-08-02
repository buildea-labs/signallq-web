"use client";

import { FaixaMetricas, type ItemFaixaMetricas } from "@/components/FaixaMetricas";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { PROBLEMAS_PERCEBIDOS } from "@/lib/problemEntry";

/** Trio de métricas ao vivo e cancelamento, enquanto o teste executa. */
export function TestRunning({ journey }: { journey: SpeedTestJourney }) {
  const { phase, phaseResults, measurementContext } = journey;

  const executarTrio: ItemFaixaMetricas[] = [
    {
      label: "Latência",
      value: phaseResults.latencia != null ? `${Math.round(phaseResults.latencia)} ms` : "—",
      color: phase === "latencia" ? "var(--phase-latencia)" : phaseResults.latencia != null ? undefined : "var(--text-tertiary)",
    },
    {
      label: "Download",
      value: phaseResults.download != null ? `${phaseResults.download.toFixed(1)} Mbps` : "Aguardando",
      color:
        phase === "download"
          ? "var(--phase-download)"
          : phaseResults.download != null
          ? undefined
          : "var(--text-tertiary)",
    },
    {
      label: "Upload",
      value: phaseResults.upload != null ? `${phaseResults.upload.toFixed(1)} Mbps` : "Aguardando",
      color:
        phase === "upload" ? "var(--phase-upload)" : phaseResults.upload != null ? undefined : "var(--text-tertiary)",
    },
  ];

  return (
    <>
      {measurementContext?.declaredProblem && (
        <p className="m-0 text-center text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">
          Contexto informado: {PROBLEMAS_PERCEBIDOS.find((opcao) => opcao.value === measurementContext.declaredProblem)?.label}
        </p>
      )}
      <FaixaMetricas items={executarTrio} variant="execucao" />
      <button
        onClick={journey.cancelTest}
        className="h-[40px] flex items-center gap-[6px] border-none bg-transparent cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px] text-[color:var(--text-primary)]">close</span>
        <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--text-primary)]">
          Cancelar teste
        </span>
      </button>
    </>
  );
}
