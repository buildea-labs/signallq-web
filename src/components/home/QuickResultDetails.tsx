"use client";

import type { SpeedTestResult } from "@/lib/speedEngine";

/**
 * "Detalhes da medição" do resultado rápido (protótipo, tela 1.3): um
 * disclosure curto, recolhido por padrão, com o que a rodada rápida de fato
 * mediu. Não é o bloco técnico completo do resultado completo
 * (`ResultTechnicalDetails`) — a rodada rápida só mede download, e listar
 * campos vazios sugeriria um diagnóstico que ela não faz.
 */
export function QuickResultDetails({ result }: { result: SpeedTestResult }) {
  const rows = [
    { label: "Download", value: `${Math.round(result.download.mbps)} Mbps` },
    { label: "Servidor", value: result.server || "—" },
  ];

  return (
    <details className="w-full">
      <summary className="cursor-pointer text-[11.5px] leading-[1.4] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
        Detalhes da medição
      </summary>
      <dl className="m-0 mt-2 flex flex-col">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 py-[6px]">
            <dt className="text-[12px] text-[color:var(--text-secondary)]">{row.label}</dt>
            <dd className="m-0 text-right font-semibold text-[12px] text-[color:var(--text-primary)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
