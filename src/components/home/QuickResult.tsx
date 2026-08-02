"use client";

import { useState } from "react";
import { Velocimetro } from "@/components/Velocimetro";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { useNetworkInfo } from "@/hooks/useNetworkInfo";
import { MetricSidePanel } from "./MetricSidePanel";
import { UseCaseSummary } from "./UseCaseSummary";
import { buildSpeedometerView } from "./speedometerView";

/** Velocímetro, conclusão e leitura rápida da medição corrente. */
export function QuickResult({ journey }: { journey: SpeedTestJourney }) {
  const [ajudaEstabilidadeAberta, setAjudaEstabilidadeAberta] = useState(false);
  const { phase, liveValue, result, isIdle, isRunning, isProblem, isResult, terminalOutcome, respostaDiagnostica, modo, isAutoStarting } = journey;
  const { isp, region, loading } = useNetworkInfo();
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
      {respostaDiagnostica && !isProblem && modo !== "rapido" && (
        <div className="w-full text-center max-w-[520px] pt-4 mb-4">
          <h1 id="resultado-conclusao" className="m-0 font-bold text-[24px] sm:text-[28px] leading-[1.25] text-[color:var(--text-primary)] tracking-tight">{respostaDiagnostica.conclusion}</h1>
          <p className="mt-2 mb-0 font-normal text-[14px] sm:text-[15px] leading-[1.45] text-[color:var(--text-secondary)] max-w-[480px] mx-auto">{respostaDiagnostica.impact}</p>
        </div>
      )}

      <div className={`w-full ${modo === 'rapido' ? 'max-w-[1024px] mt-0' : 'max-w-[800px] mt-2'} flex justify-center px-4 sm:px-8`}>
        <Velocimetro fraction={fraction} phaseColor={identity.color} isRunning={isRunning} phase={result ? "download" : phase} liveValue={result ? result.download.mbps : liveValue} value={dialNumber} unit={dialUnit} metricLabel={result ? "Download" : undefined} phaseLabel={isRunning || (isProblem && terminalOutcome === null) ? identity.label : undefined} narrative={isRunning || (isProblem && terminalOutcome === null) ? identity.narrative : undefined} compact={modo === "completo" ? (terminalOutcome !== null || isProblem) : isProblem}>
            {(isIdle || isProblem) && !isAutoStarting && (
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

      {result && !isProblem && (
        <div className="w-full max-w-[520px] mt-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto">
          
          {modo === "completo" && (
            <>
              <MetricSidePanel
                result={result}
                ajudaEstabilidadeAberta={ajudaEstabilidadeAberta}
                onToggleAjudaEstabilidade={() => setAjudaEstabilidadeAberta(!ajudaEstabilidadeAberta)}
              />
              <UseCaseSummary result={result} />
            </>
          )}

          {modo === "rapido" && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="m-0 font-medium text-[15px] text-center text-[color:var(--text-secondary)] px-4">
                {result.download.mbps > 100 
                  ? "Sua velocidade é ótima para baixar, mas será que a internet está 100% saudável?" 
                  : result.download.mbps < 30 
                  ? "A velocidade parece restrita. Quer descobrir se há algum gargalo na sua rede?" 
                  : "A velocidade atende, mas sua conexão aguenta uso pesado (como vídeos e jogos)?"}
              </p>
              <button
                onClick={() => {
                  journey.setModo("completo");
                  journey.abrirEntradaPorProblema();
                }}
                className="cursor-pointer bg-[color-mix(in_srgb,_var(--accent)_10%,_transparent)] border border-[color-mix(in_srgb,_var(--accent)_30%,_transparent)] text-[color:var(--accent)] px-5 py-2.5 rounded-full font-semibold text-[14px] hover:bg-[color-mix(in_srgb,_var(--accent)_15%,_transparent)] transition-colors flex items-center gap-2 mt-1"
              >
                <span className="material-symbols-outlined text-[20px]">manage_search</span>
                Diagnóstico Completo
              </button>
            </div>
          )}
        </div>
      )}

      {!isProblem && isResult && (
        <div className="w-full flex justify-center items-center gap-3 mt-4 text-[color:var(--text-secondary)] text-[14px]">
          <span className="font-semibold line-clamp-1">{loading ? "..." : isp || "Desconhecido"}</span>
          <span className="text-[color:var(--accent)] font-bold">|</span>
          <span className="line-clamp-1">{loading ? "..." : region || "Desconhecido"}</span>
        </div>
      )}
    </>
  );
}
