"use client";

import { classifyLatency, classifyUpload } from "@/lib/classification";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { NIVEL_COR } from "./homeCopy";

interface Props {
  result: SpeedTestResult;
  // O estado da ajuda de Estabilidade vive no componente pai porque ele
  // permanece montado entre medições — o painel some enquanto o teste roda.
  ajudaEstabilidadeAberta: boolean;
  onToggleAjudaEstabilidade: () => void;
}

/** Painel lateral de métricas do resultado (upload, latência, estabilidade). */
export function MetricSidePanel({ result, ajudaEstabilidadeAberta, onToggleAjudaEstabilidade }: Props) {
  const uploadVerdict = classifyUpload(result.upload.mbps);
  const latencyVerdict = classifyLatency(result.latency.ms);

  const painelLateral = [
    {
      icon: "arrow_upward",
      label: "Upload",
      value: result.upload.mbps.toFixed(1),
      caption: `Mbps • ${uploadVerdict.label}`,
      color: NIVEL_COR[uploadVerdict.nivel],
    },
    {
      icon: "network_ping",
      label: "Latência",
      value: Math.round(result.latency.ms).toString(),
      caption: `ms • ${latencyVerdict.label}`,
      color: NIVEL_COR[latencyVerdict.nivel],
    },
    {
      icon: "monitoring",
      label: "Estabilidade",
      value: `${result.stabilityScore.toFixed(0)}`,
      caption: `% • ${result.stabilityScore >= 90 ? "Alta" : result.stabilityScore >= 75 ? "Média" : "Baixa"}`,
      color: result.stabilityScore >= 90 ? "var(--success)" : result.stabilityScore >= 75 ? "var(--warning)" : "var(--error)",
      hasHelp: true,
    },
  ];

  return (
    <div className="grid grid-cols-3 md:flex md:flex-col gap-1 sm:gap-2 w-full md:max-w-[140px]">
      {painelLateral.map((item) => (
        <div key={item.label} className="flex flex-col items-center justify-center p-3 relative">
          <div className="flex items-center gap-1">
            {item.icon && <span className="material-symbols-outlined text-[16px]" style={{ color: item.color }}>{item.icon}</span>}
            <span className="font-semibold text-[10px] uppercase tracking-wide text-[color:var(--text-secondary)]">{item.label}</span>
            {item.hasHelp && (
              <button
                onClick={onToggleAjudaEstabilidade}
                className="ml-1 flex items-center justify-center border-none bg-transparent cursor-pointer hover:opacity-80 transition-opacity p-0"
                aria-label="O que é Estabilidade?"
              >
                <span className="material-symbols-outlined text-[13px] text-[color:var(--text-tertiary)]">help</span>
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-bold text-[18px] tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>{item.value}</span>
          </div>
          {item.caption && <div className="font-medium text-[11px] text-[color:var(--text-tertiary)] mt-1 text-center">{item.caption}</div>}

          {item.hasHelp && ajudaEstabilidadeAberta && (
            <div className="absolute top-10 right-0 p-2 bg-[color:var(--surface-elevated)] border border-[color:var(--border)] rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.12)] z-10 w-[180px]">
              <p className="m-0 text-[11px] leading-[1.4] text-[color:var(--text-primary)] text-center">Indica quão constante sua conexão se manteve durante o teste.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
