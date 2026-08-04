"use client";

import { Velocimetro } from "@/components/Velocimetro";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { useNetworkInfo } from "@/hooks/useNetworkInfo";
import { PostResultProblemPrompt } from "./PostResultProblemPrompt";
import { UseCaseSummary } from "./UseCaseSummary";
import { buildSpeedometerView } from "./speedometerView";

/** Velocímetro e leitura rápida da medição corrente (conclusão/impacto vivem em CompleteDiagnosis, #71). */
export function QuickResult({ journey }: { journey: SpeedTestJourney }) {
  const { phase, liveValue, result, isIdle, isRunning, isProblem, isResult, terminalOutcome, modo, isAutoStarting, postResultProblem, erroDuranteAprofundamento } = journey;
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
      <div className={`w-full ${modo === 'rapido' ? 'max-w-[1024px] mt-0' : 'max-w-[800px] mt-2'} flex justify-center px-4 sm:px-8`}>
        <Velocimetro fraction={fraction} phaseColor={identity.color} isRunning={isRunning} phase={result ? "download" : phase} liveValue={result ? result.download.mbps : liveValue} value={dialNumber} unit={dialUnit} metricLabel={result ? "Download" : undefined} phaseLabel={isRunning || (isProblem && terminalOutcome === null) ? identity.label : undefined} narrative={isRunning || (isProblem && terminalOutcome === null) ? identity.narrative : undefined} compact={modo === "completo" ? (terminalOutcome !== null || isProblem) : isProblem}>
            {(isIdle || isProblem) && !isAutoStarting && (
              <div className="absolute left-1/2 bottom-[26px] -translate-x-1/2 flex flex-col items-center gap-[10px] z-10">
                <button
                  onClick={erroDuranteAprofundamento ? journey.iniciarAprofundamento : journey.iniciarTesteDireto}
                  className="h-[44px] px-[26px] rounded-full flex items-center gap-2 border-none bg-[color:var(--accent)] shadow-[0_14px_30px_color-mix(in_srgb,_var(--accent)_45%,_transparent),_0_2px_6px_rgba(0,0,0,.25)] whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[color:var(--on-accent)]">
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

      {/* Gate por `isResult` (não só `result` truthy): durante um reteste
          (isRepeat=true, incluindo o aprofundamento pós-resultado) o
          resultado anterior fica preservado no state para servir de
          fallback em caso de cancelamento/erro, mas não deve continuar
          visível enquanto o novo teste roda — `TestRunning` já ocupa esse
          lugar (spec Juliana §2: "não deixar as duas coisas visíveis ao
          mesmo tempo"). */}
      {isResult && result && (
        <div className="w-full max-w-[520px] mt-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto">

          {modo === "completo" && <UseCaseSummary result={result} />}

          {/* O aprofundamento pós-resultado muda `modo` para "completo" de
              verdade (bug crítico #1+#2) — por isso este bloco não pode mais
              depender só de `modo === "rapido"`: enquanto houver uma escolha
              pós-resultado ativa ou concluída, o cartão final dela continua
              aparecendo no mesmo lugar de sempre (spec Juliana §2). */}
          {(modo === "rapido" || postResultProblem !== null) && <PostResultProblemPrompt journey={journey} />}
        </div>
      )}

      {/* Só exibida quando ambos os valores são conhecidos — "Desconhecido" é
          ruído para quem não pediu essa informação (#71 §3.1/§3.4.8). */}
      {!isProblem && isResult && !loading && isp && region && (
        <div className="w-full flex justify-center items-center gap-3 mt-4 text-[color:var(--text-secondary)] text-[14px]">
          <span className="font-semibold line-clamp-1">{isp}</span>
          <span className="text-[color:var(--accent)] font-bold">|</span>
          <span className="line-clamp-1">{region}</span>
        </div>
      )}
    </>
  );
}
