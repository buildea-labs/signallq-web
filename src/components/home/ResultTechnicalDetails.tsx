"use client";

import { useState, type SyntheticEvent } from "react";
import { HelpButton } from "@/components/HelpButton";
import { FEATURE_DIAGNOSIS_EXPANDED, trackFeatureUsed } from "@/lib/telemetry";
import type { ResultView } from "@/lib/resultView";
import { buildTechnicalDetailGroups, type DetailRow } from "./resultTechnicalDetailsRows";

function DetailRowLine({ row, openId, onToggle }: { row: DetailRow; openId: string | null; onToggle: (id: string) => void }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
      <span className="inline-flex items-center font-normal text-[12px] leading-[1.35] text-[color:var(--text-secondary)]">
        {row.label}
        {row.help && (
          <span className="ml-1 inline-flex">
            <HelpButton text={row.help} open={openId === row.id} onToggle={() => onToggle(row.id)} />
          </span>
        )}
      </span>
      <span className="font-medium text-[12px] leading-[1.35] text-right text-[color:var(--text-primary)]">{row.value}</span>
    </div>
  );
}

/**
 * Único bloco expansível de detalhes técnicos (#70): recolhido por padrão,
 * agrupa Velocidade / Resposta da conexão / Sobre o teste — o `MetricSidePanel`
 * sempre-visível foi removido e fundido aqui (ver homeCopy/QuickResult).
 */
export function ResultTechnicalDetails({ result }: { result: ResultView }) {
  const [openHelpId, setOpenHelpId] = useState<string | null>(null);
  const groups = buildTechnicalDetailGroups(result);

  const handleToggleDetails = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open) {
      trackFeatureUsed(FEATURE_DIAGNOSIS_EXPANDED);
    }
  };

  return (
    <section className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
      <details onToggle={handleToggleDetails}>
        <summary className="cursor-pointer font-medium text-[14px] text-[color:var(--accent)]">Ver detalhes da medição</summary>

        <div className="mt-[18px] grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--text-secondary)] tracking-[.3px] uppercase">
                {group.title}
              </div>
              <div className="mt-[10px]">
                {group.rows.map((row) => (
                  <DetailRowLine key={row.id} row={row} openId={openHelpId} onToggle={(id) => setOpenHelpId((current) => (current === id ? null : id))} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 mb-0 font-normal text-[12px] leading-[1.4] text-[color:var(--text-tertiary)]">
          O navegador não confirma provedor, localização, nem lê sinal Wi-Fi ou 4G/5G.{" "}
          <a href="/como-medimos" className="text-[color:var(--accent)] underline underline-offset-2 hover:opacity-80">
            Entenda como o teste mede sua conexão
          </a>
        </p>

        <p className="mt-3 mb-0 font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
          Esta é uma leitura das métricas desta medição, não uma certificação da velocidade contratada.
        </p>
      </details>
    </section>
  );
}
