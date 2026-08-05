"use client";

import { classifyLatency } from "@/lib/classification";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { NIVEL_COR } from "./homeCopy";

interface Metric {
  id: string;
  label: string;
  value: string;
  unit: string;
  color?: string;
}

function round(value: number) {
  return Math.round(value).toString();
}

/** Métricas do resultado completo, na hierarquia da tela 2.4 do protótipo. */
export function buildFullResultMetrics(result: SpeedTestResult): { primary: Metric[]; secondary: Metric[] } {
  // "Sob carga" é a leitura que o protótipo destaca ao lado do ping; quando o
  // motor não produziu latência sob carga nesta rodada, o jitter ocupa o lugar
  // em vez de deixar um espaço vazio ou um "—" sem explicação.
  const loaded = result.loadedLatency
    ? Math.max(result.loadedLatency.downloadMs, result.loadedLatency.uploadMs)
    : null;

  const secondary: Metric[] =
    loaded !== null
      ? [
          { id: "ping", label: "Ping", value: round(result.latency.ms), unit: "ms" },
          {
            id: "sob-carga",
            label: "Sob carga",
            value: round(loaded),
            unit: "ms",
            color: NIVEL_COR[classifyLatency(loaded).nivel],
          },
        ]
      : [
          { id: "ping", label: "Ping", value: round(result.latency.ms), unit: "ms" },
          {
            id: "jitter",
            label: "Jitter",
            value: result.jitter ? round(result.jitter.ms) : "—",
            unit: result.jitter ? "ms" : "",
          },
        ];

  return {
    primary: [
      { id: "download", label: "Download", value: round(result.download.mbps), unit: "Mbps" },
      { id: "upload", label: "Upload", value: round(result.upload.mbps), unit: "Mbps" },
    ],
    secondary,
  };
}

/**
 * Uma única árvore responsiva: no mobile a dupla download/upload lidera em
 * corpo grande e as leituras de latência ficam numa linha dividida abaixo
 * (tela 2.4); a partir de `lg` os quatro viram tiles de largura igual, como no
 * painel desktop (`desktop-2`). Nenhuma métrica é duplicada por breakpoint.
 */
export function FullResultMetrics({ result }: { result: SpeedTestResult }) {
  const { primary, secondary } = buildFullResultMetrics(result);

  return (
    // Cada `<dt>/<dd>` fica num `<div>` filho direto do `<dl>` — o único
    // aninhamento que a lista de descrição admite. Um invólucro extra para a
    // linha secundária quebraria a estrutura (axe `definition-list`).
    <dl className="m-0 grid w-full grid-cols-2 gap-y-5 lg:grid-cols-4 lg:gap-4">
      {primary.map((metric) => (
        <div key={metric.id} className="min-w-0 px-3 text-center lg:rounded-[14px] lg:bg-[color:var(--bg-secondary)] lg:p-4 lg:text-left">
          <dt className="font-bold text-[11px] uppercase leading-[1.4] tracking-[.5px] text-[color:var(--text-secondary)] sm:text-[12px]">
            {metric.label}
          </dt>
          <dd className="m-0 mt-[6px] font-extrabold leading-none tabular-nums text-[color:var(--text-primary)] text-[38px] sm:text-[44px] lg:text-[26px]">
            {metric.value}
            <span className="ml-1 font-semibold text-[14px] text-[color:var(--text-secondary)] sm:text-[16px] lg:text-[13px]">
              {metric.unit}
            </span>
          </dd>
        </div>
      ))}

      {secondary.map((metric, index) => (
        <div
          key={metric.id}
          className={`min-w-0 px-3 text-center lg:rounded-[14px] lg:bg-[color:var(--bg-secondary)] lg:p-4 lg:text-left ${
            index === 0
              ? "border-r border-[color:color-mix(in_srgb,var(--border)_28%,transparent)] lg:border-r-0"
              : ""
          }`}
        >
          <dt className="font-semibold text-[10px] leading-[1.4] text-[color:var(--text-secondary)] lg:text-[11px] lg:font-bold lg:uppercase lg:tracking-[.5px]">
            {metric.label}
          </dt>
          <dd
            className="m-0 mt-[2px] font-bold leading-none tabular-nums text-[16px] lg:mt-[6px] lg:text-[26px] lg:font-extrabold"
            style={{ color: metric.color ?? "var(--text-primary)" }}
          >
            {metric.value}
            <span className="ml-[2px] font-semibold text-[11px] text-[color:var(--text-secondary)] lg:ml-1 lg:text-[13px]">
              {metric.unit}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
