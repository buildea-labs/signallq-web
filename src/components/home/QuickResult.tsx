"use client";

import { useState } from "react";
import { Velocimetro } from "@/components/Velocimetro";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { MetricSidePanel } from "./MetricSidePanel";
import { UseCaseSummary } from "./UseCaseSummary";
import { buildSpeedometerView } from "./speedometerView";

/** Velocímetro, conclusão e leitura rápida da medição corrente. */
export function QuickResult({ journey }: { journey: SpeedTestJourney }) {
  const [ajudaEstabilidadeAberta, setAjudaEstabilidadeAberta] = useState(false);
  const { phase, liveValue, result, isIdle, isRunning, isProblem, isResult, terminalOutcome, respostaDiagnostica, modo } = journey;
  const { fraction, dialNumber, dialUnit, identity } = buildSpeedometerView({
    phase,
    liveValue,
    result,
    isResult,
    isProblem,
    terminalOutcome,
  });

  return (
    <>
      {respostaDiagnostica && !isProblem && (
        <div className="w-full text-center max-w-[520px] pt-4">

          <h1 id="resultado-conclusao" className="m-0 font-bold text-[24px] sm:text-[28px] leading-[1.25] text-[color:var(--text-primary)] tracking-tight">{respostaDiagnostica.conclusion}</h1>
          <p className="mt-2 mb-0 font-normal text-[14px] sm:text-[15px] leading-[1.45] text-[color:var(--text-secondary)] max-w-[480px] mx-auto">{respostaDiagnostica.impact}</p>
        </div>
      )}

      <div className="w-full max-w-[520px] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mt-4">
        <div className="w-full sm:w-auto flex justify-center sm:block flex-shrink-0 md:scale-[1.2] transform origin-top md:origin-left mt-2">
          <Velocimetro fraction={fraction} phaseColor={identity.color} isRunning={isRunning} phase={result ? "download" : phase} liveValue={result ? result.download.mbps : liveValue} value={dialNumber} unit={dialUnit} metricLabel={result ? "Download" : undefined} phaseLabel={isRunning || (isProblem && terminalOutcome === null) ? identity.label : undefined} narrative={isRunning || (isProblem && terminalOutcome === null) ? identity.narrative : undefined} compact={terminalOutcome !== null || isProblem}>
            {(isIdle || isProblem) && (
              <div className="absolute left-1/2 bottom-[26px] -translate-x-1/2 flex flex-col items-center gap-[10px] z-10">
                <button
                  onClick={journey.iniciarTesteDireto}
                  className="h-[44px] px-[26px] rounded-full flex items-center gap-2 border-none bg-[color:var(--accent)] shadow-[0_14px_30px_color-mix(in_srgb,_var(--accent)_45%,_transparent),_0_2px_6px_rgba(0,0,0,.25)] whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px] text-[color:var(--on-accent)]">
                    {isProblem ? "refresh" : "speed"}
                  </span>
                  <span className="font-semibold text-[16px] leading-[1.15] text-[color:var(--on-accent)]">
                    {isProblem ? "Tentar novamente" : "Testar agora"}
                  </span>
                </button>
                <span className="font-normal text-[12px] leading-[1.3] text-[color:var(--text-tertiary)]">
                  {modo === "rapido" ? "Rápido · ~20 s" : "Completo · ~40 s"}
                </span>
              </div>
            )}
          </Velocimetro>
        </div>
      </div>

      {result && !isProblem && (
        <details className="w-full max-w-[520px] mt-6 group">
          <summary className="cursor-pointer font-medium text-[14px] text-[color:var(--text-secondary)] list-none flex items-center justify-center gap-2 hover:text-[color:var(--text-primary)] transition-colors">
            <span>Ver detalhes técnicos</span>
            <span className="material-symbols-outlined text-[20px] group-open:rotate-180 transition-transform">expand_more</span>
          </summary>
          <div className="pt-6 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <MetricSidePanel
              result={result}
              ajudaEstabilidadeAberta={ajudaEstabilidadeAberta}
              onToggleAjudaEstabilidade={() => setAjudaEstabilidadeAberta(!ajudaEstabilidadeAberta)}
            />
            <UseCaseSummary result={result} />
          </div>
        </details>
      )}

      {!isProblem && (
        <div className="w-full max-w-[520px] flex">
          <div className="flex-1 flex items-center justify-center gap-[10px] py-3 px-4 mt-4">
            <span className="material-symbols-outlined text-[20px] text-[color:var(--text-secondary)]">dns</span>
            <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--text-primary)]">
              Rede Cloudflare
            </span>
          </div>
        </div>
      )}
    </>
  );
}
