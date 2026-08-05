"use client";

import { Velocimetro, type VelocimetroMode } from "@/components/Velocimetro";
import { ResultStamp } from "@/components/speedtest/ResultStamp";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { useNetworkInfo } from "@/hooks/useNetworkInfo";
import { classifyDownload } from "@/lib/classification";
import { PostResultProblemPrompt } from "./PostResultProblemPrompt";
import { QuickResultDetails } from "./QuickResultDetails";
import { NIVEL_COR } from "./homeCopy";
import { buildSpeedometerView } from "./speedometerView";

const DIAL_MODE = {
  hidden: "settled",
  forming: "forming",
  measuring: "measuring",
  result: "settled",
} as const satisfies Record<SpeedTestJourney["layout"]["dial"], VelocimetroMode>;

/** Mostrador e leitura rápida da medição corrente (conclusão/impacto vivem em CompleteDiagnosis, #71). */
export function QuickResult({ journey }: { journey: SpeedTestJourney }) {
  const { phase, liveValue, result, isRunning, isProblem, isResult, terminalOutcome, modo, layout, visualState } = journey;
  const { isp, region, loading } = useNetworkInfo();
  const { fraction, dialNumber, dialUnit, identity } = buildSpeedometerView({
    phase,
    liveValue,
    result,
    isResult,
    isProblem,
    terminalOutcome,
  });

  const showsDial = layout.dial !== "hidden";
  const isSettled = layout.dial === "result";
  const restored = visualState.state === "restored-result";
  // Cor do arco:
  // - medindo, é sempre o accent (protótipo, telas 1.2/2.2). As cores por
  //   fase do motor fariam o arco pular de verde (download) para âmbar
  //   (upload) no meio da mesma medição, sem que nada tivesse piorado;
  // - assentado, vem da leitura e não do fato de o teste ter acabado — um
  //   download ruim não fica verde só porque a medição concluiu.
  const dialColor = isRunning
    ? "var(--accent)"
    : isSettled && result && terminalOutcome === "complete"
      ? NIVEL_COR[classifyDownload(result.download.mbps).nivel]
      : identity.color;

  return (
    <>
      {/* Selo de procedência do resultado (protótipo, tela 1.3). Fica fora do
          bloco do mostrador de propósito: no resultado completo o velocímetro
          sai de cena, e sem o selo nada distinguiria um resultado restaurado
          de um recém-medido. */}
      {isResult && result && (
        <ResultStamp
          label={
            restored
              ? `Último resultado · ${modo === "rapido" ? "Teste rápido" : "Teste completo"}`
              : `Teste ${modo === "rapido" ? "rápido" : "completo"} · Executado agora`
          }
          tone={terminalOutcome === "complete" ? "success" : "neutral"}
        />
      )}

      {showsDial && (
        <div className="flex w-full flex-col items-center gap-2">
          {/* Sem rótulo de fase sob o mostrador: quem narra a etapa é a linha
              de estado de `TestRunning`, que já é `aria-live`. Dois textos
              simultâneos sobre a mesma fase seriam ruído visual e leitura
              duplicada para tecnologia assistiva. */}
          <Velocimetro
            fraction={fraction}
            phaseColor={dialColor}
            isRunning={isRunning}
            phase={isSettled && result ? "download" : phase}
            liveValue={isSettled && result ? result.download.mbps : liveValue}
            value={layout.dial === "forming" ? undefined : dialNumber}
            unit={layout.dial === "forming" ? undefined : dialUnit}
            metricLabel={isSettled && result ? "Download" : undefined}
            mode={restored && isSettled ? "restored" : DIAL_MODE[layout.dial]}
            hideValue={layout.dial === "forming"}
          />

        </div>
      )}

      {/* Só exibida quando ambos os valores são conhecidos — "Desconhecido" é
          ruído para quem não pediu essa informação (#71 §3.1/§3.4.8).
          Independe do mostrador: no resultado completo o velocímetro sai de
          cena, mas a origem da medição continua sendo informação do resultado. */}
      {isResult && !isProblem && !loading && isp && region && (
        <p className="m-0 flex items-center justify-center gap-2 text-[10px] text-[color:var(--text-secondary)] sm:text-[11px]">
          <span className="line-clamp-1 font-semibold">{isp}</span>
          <span aria-hidden="true" className="font-bold text-[color:var(--accent)]">
            |
          </span>
          <span className="line-clamp-1">{region}</span>
        </p>
      )}

      {/* Gate por `isResult` (não só `result` truthy): durante um reteste
          (isRepeat=true, incluindo o aprofundamento pós-resultado) o
          resultado anterior fica preservado no state para servir de
          fallback em caso de cancelamento/erro, mas não deve continuar
          visível enquanto o novo teste roda — `TestRunning` já ocupa esse
          lugar (spec Juliana §2: "não deixar as duas coisas visíveis ao
          mesmo tempo"). */}
      {isResult && result && (
        <div className="mx-auto flex w-full max-w-[520px] flex-col gap-6 sq-fade-up">
          {/* O aprofundamento pós-resultado muda `modo` para "completo" de
              verdade (bug crítico #1+#2) — por isso este bloco não pode mais
              depender só de `modo === "rapido"`: enquanto houver uma escolha
              pós-resultado ativa ou concluída, o cartão final dela continua
              aparecendo no mesmo lugar de sempre (spec Juliana §2). */}
          {(modo === "rapido" || Boolean(journey.postResultProblem)) && <PostResultProblemPrompt journey={journey} />}

          {/* Só no resultado rápido: no completo, o bloco técnico completo
              (`ResultTechnicalDetails`) já cobre — e supera — estes campos. */}
          {isSettled && modo === "rapido" && <QuickResultDetails result={result} />}
        </div>
      )}
    </>
  );
}
