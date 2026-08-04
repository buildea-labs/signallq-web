import { interpretUseCases } from "@/lib/classification";
import { formatarDataHora } from "@/lib/measurementFormat";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { NIVEL_COR, STATUS_LABEL, USE_CASE_ICONS, USE_CASE_LABELS } from "./homeCopy";

/** Selo de status da medição + leitura por tipo de uso (navegação, streaming...). */
export function UseCaseSummary({ result }: { result: SpeedTestResult }) {
  const useCases = interpretUseCases({
    download: result.download.mbps,
    upload: result.upload.mbps,
    latency: result.latency.ms,
    jitter: result.jitter?.ms ?? null,
  });
  const statusCompleto = result.status === "complete";

  return (
    <div className="w-full flex flex-col items-center gap-4 mt-2">
      {/* Selo de status só aparece aqui quando a medição é completa: para os
          demais status, a barra de aviso em CompleteDiagnosis já é a fonte
          única (evita duplicar o mesmo dado, #71 §3.1). */}
      {statusCompleto && (
        <div className="flex items-center justify-center gap-2">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]" style={{ color: "var(--success)" }}>
            check_circle
          </span>
          <span className="font-medium text-[12px] leading-[1.33]" style={{ color: "var(--success)" }}>
            {STATUS_LABEL[result.status]}
          </span>
          <span className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
            • {formatarDataHora(result.timestamp)}
          </span>
        </div>
      )}
      <div className="w-full max-w-[520px] grid grid-cols-2 sm:grid-cols-4 border border-[color-mix(in_srgb,_var(--border)_14%,_transparent)] rounded-xl overflow-hidden">
      {(Object.keys(USE_CASE_ICONS) as Array<keyof typeof USE_CASE_ICONS>).map((key, index) => {
        const veredictoCaso = useCases[key];
        return (
          <div
            key={key}
            className={`flex flex-col items-center justify-center gap-1 p-3 ${index > 0 ? "border-l border-[color-mix(in_srgb,_var(--border)_14%,_transparent)]" : ""}`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[20px]"
              style={{ color: NIVEL_COR[veredictoCaso.nivel] }}
            >
              {USE_CASE_ICONS[key]}
            </span>
            <span className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-secondary)] text-center">
              {USE_CASE_LABELS[key]}
            </span>
            <span
              className="font-medium text-[12px] leading-[1.33]"
              style={{ color: NIVEL_COR[veredictoCaso.nivel] }}
            >
              {veredictoCaso.label}
            </span>
          </div>
        );
      })}
      </div>
    </div>
  );
}
