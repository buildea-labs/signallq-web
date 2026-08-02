import { ListaChaveValor } from "@/components/ListaChaveValor";
import { formatarDataHora, formatarDuracao } from "@/lib/measurementFormat";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { BUFFERBLOAT_LABEL } from "./homeCopy";

/** Detalhes por tipo de uso e técnicos, recolhidos por padrão. */
export function ResultTechnicalDetails({ result }: { result: SpeedTestResult }) {
  return (
    <section className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
      <h2 className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">Detalhes por tipo de uso e técnicos</h2>
      <details className="mt-3">
      <summary className="cursor-pointer font-medium text-[14px] text-[color:var(--accent)]">Mostrar detalhes técnicos</summary>
      <div className="mt-[18px]">
        <p className="m-0 font-normal text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">O painel acima resume a capacidade da sua conexão para diferentes usos baseado na velocidade aferida. Valores individuais como Jitter e Latência abaixo complementam a visão técnica.</p>
      </div>

      <p className="mt-4 mb-0 font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">Esta é uma leitura das métricas desta medição, não uma certificação da velocidade contratada.</p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
      <ListaChaveValor
        title="Contexto"
        items={[
          { label: "Infraestrutura", value: result.server },
          { label: "Duração", value: formatarDuracao(result.durationMs) },
          { label: "Data e hora local", value: formatarDataHora(result.timestamp) },
        ]}
      />
      <ListaChaveValor
        title="Detalhes técnicos"
        items={[
          { label: "Jitter", value: result.jitter ? `${result.jitter.ms.toFixed(1)} ms` : "Indisponível" },
          {
            label: "Bufferbloat",
            value: `${result.bufferbloat.ms.toFixed(1)} ms · ${BUFFERBLOAT_LABEL[result.bufferbloat.severity]}`,
          },
          { label: "Estabilidade", value: `${result.stabilityScore.toFixed(0)}%` },
          {
            label: "DNS (DoH)",
            value: result.dns.latencyMs == null ? "Indisponível" : `${result.dns.latencyMs} ms`,
          },
        ]}
      />
      <p className="sm:col-span-2 mt-1 mb-0 font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">O navegador não confirma provedor, localização, nem lê sinal Wi-Fi ou 4G/5G.</p>
    </div>
      </details>
    </section>
  );
}
