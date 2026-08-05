"use client";

import { useEffect } from "react";
import { ToolBackLink } from "@/components/ToolBackLink";
import { Velocimetro } from "@/components/Velocimetro";
import { MeasurementStatusLine } from "@/components/speedtest/MeasurementStatusLine";
import { usePingTool, PING_SAMPLE_COUNT } from "@/hooks/usePingTool";
import { classifyJitter, classifyLatency } from "@/lib/classification";
import { NIVEL_COR } from "@/components/home/homeCopy";

function round(value: number) {
  return Math.round(value).toString();
}

/**
 * Ferramenta de Ping: tempo de resposta da conexão, medido pela mesma sonda do
 * motor de velocidade.
 *
 * O que o navegador consegue medir é o tempo de ida e volta de uma requisição
 * HTTP até a borda de rede da sonda — não existe ICMP em JavaScript. A tela
 * diz isso literalmente, em vez de chamar o número de "ping do servidor".
 */
export function PingTool() {
  const { state, run } = usePingTool();

  // A ferramenta existe para medir: começa sozinha, como o teste de
  // velocidade, e o reteste é a ação explícita.
  useEffect(() => {
    void run();
  }, [run]);

  const summary = state.status === "done" ? state.summary : null;
  const live = state.status === "running" ? (state.samples.at(-1) ?? 0) : 0;
  const value = summary ? summary.ms : live;
  const color = summary ? NIVEL_COR[classifyLatency(summary.ms).nivel] : "var(--accent)";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="w-full">
        <ToolBackLink />
      </div>

      <h1 className="m-0 text-center font-bold text-[20px] leading-[1.3] text-[color:var(--text-primary)] sm:text-[24px]">
        Ping — tempo de resposta da sua conexão
      </h1>

      <Velocimetro
        fraction={0}
        phaseColor={color}
        isRunning={state.status === "running"}
        phase="latencia"
        liveValue={value}
        value={state.status === "idle" ? undefined : round(value)}
        unit="ms"
        metricLabel={summary ? "Ping" : undefined}
        mode={state.status === "running" ? "measuring" : summary ? "settled" : "forming"}
        hideValue={state.status === "idle"}
      />

      {state.status === "running" && (
        <MeasurementStatusLine
          text={`Medindo tempo de resposta… (${state.samples.length} de ${PING_SAMPLE_COUNT})`}
        />
      )}

      {state.status === "error" && (
        <p className="m-0 text-center text-[13px] leading-[1.45] text-[color:var(--error)]" role="status">
          Não conseguimos concluir a medição de tempo de resposta.
        </p>
      )}

      {summary && (
        <dl className="m-0 grid w-full max-w-[440px] grid-cols-3 gap-y-4">
          <div className="min-w-0 px-2 text-center">
            <dt className="font-bold text-[10px] uppercase leading-[1.4] tracking-[.5px] text-[color:var(--text-secondary)]">
              Ping
            </dt>
            <dd className="m-0 mt-[6px] font-extrabold leading-none tabular-nums text-[22px] text-[color:var(--text-primary)]">
              {round(summary.ms)}
              <span className="ml-1 font-semibold text-[12px] text-[color:var(--text-secondary)]">ms</span>
            </dd>
          </div>
          <div className="min-w-0 border-x border-[color:color-mix(in_srgb,var(--border)_28%,transparent)] px-2 text-center">
            <dt className="font-bold text-[10px] uppercase leading-[1.4] tracking-[.5px] text-[color:var(--text-secondary)]">
              Jitter
            </dt>
            <dd
              className="m-0 mt-[6px] font-extrabold leading-none tabular-nums text-[22px]"
              style={{ color: NIVEL_COR[classifyJitter(summary.jitterMs).nivel] }}
            >
              {round(summary.jitterMs)}
              <span className="ml-1 font-semibold text-[12px] text-[color:var(--text-secondary)]">ms</span>
            </dd>
          </div>
          <div className="min-w-0 px-2 text-center">
            <dt className="font-bold text-[10px] uppercase leading-[1.4] tracking-[.5px] text-[color:var(--text-secondary)]">
              Sem resposta
            </dt>
            <dd className="m-0 mt-[6px] font-extrabold leading-none tabular-nums text-[22px] text-[color:var(--text-primary)]">
              {round(summary.packetLossPercent)}
              <span className="ml-1 font-semibold text-[12px] text-[color:var(--text-secondary)]">%</span>
            </dd>
          </div>
        </dl>
      )}

      {state.status !== "running" && (
        <button
          type="button"
          onClick={() => void run()}
          className="min-h-[48px] w-full max-w-[260px] rounded-[14px] border-[1.5px] border-[color:var(--accent)] bg-transparent px-6 font-bold text-[13.5px] text-[color:var(--accent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] cursor-pointer"
        >
          Medir novamente
        </button>
      )}

      <p className="m-0 max-w-[440px] text-center text-[12px] leading-[1.45] text-[color:var(--text-tertiary)]">
        O navegador não faz ping ICMP. Medimos o tempo de ida e volta de {PING_SAMPLE_COUNT} requisições HTTP até a
        borda de rede da sonda do SignallQ — é a leitura mais próxima disponível na Web, e é a mesma usada na fase de
        latência do teste de velocidade.
      </p>
    </div>
  );
}
