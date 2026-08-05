"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { GuidedDiagnosis } from "@/components/speedtest/GuidedDiagnosis";
import type { ContextualAnswer } from "@/lib/contextualQuestionFlow";
import { createMeasurementSessionContext } from "@/lib/measurementSessionContext";
import { PROBLEMAS_PERCEBIDOS, type ProblemaPercebido } from "@/lib/problemEntry";
import type { DiagnosticoJornada } from "@/hooks/useDiagnosticoJornada";
import { VelocimetroAoVivo } from "./VelocimetroAoVivo";

interface Props {
  jornada: DiagnosticoJornada;
  ferramentas: ReactNode;
}

const ICONE_PROBLEMA: Record<ProblemaPercebido, string> = {
  lenta: "hourglass_bottom",
  travando: "sync_problem",
  "cai-com-frequencia": "wifi_off",
  "wifi-nao-chega-bem": "wifi",
  "jogos-ou-chamadas-ruins": "sports_esports",
};

export function ResultadoRapido({ jornada, ferramentas }: Props) {
  const [problema, setProblema] = useState<ProblemaPercebido | null>(null);
  const [respostas, setRespostas] = useState<ContextualAnswer[]>([]);

  const measurementContext = problema ? createMeasurementSessionContext("problem", problema) : null;

  function iniciarTesteCompleto() {
    const context = measurementContext ?? createMeasurementSessionContext("direct");
    jornada.iniciarTesteCompleto(context, respostas);
  }

  return (
    <div className="mx-auto grid w-full max-w-[1060px] grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,560px)_minmax(360px,440px)] lg:gap-8">
      <section
        aria-labelledby="diagnostico-rapido-titulo"
        className="rounded-[28px] border border-[color-mix(in_srgb,_var(--border)_18%,_transparent)] bg-[color:var(--bg-card)] p-4 shadow-[0_18px_42px_rgba(0,0,0,.12)] sm:p-6 lg:sticky lg:top-6"
      >
        <div className="mb-3 text-center">
          <p className="m-0 text-[12px] font-medium uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">
            Tela WebApp
          </p>
          <h2 id="diagnostico-rapido-titulo" className="m-0 mt-1 text-[18px] font-semibold leading-[1.25] text-[color:var(--text-primary)]">
            Resultado rápido
          </h2>
        </div>
        <VelocimetroAoVivo motor={jornada.motor} />
      </section>

      <aside className="flex w-full flex-col gap-4 rounded-[28px] border border-[color-mix(in_srgb,_var(--border)_18%,_transparent)] bg-[color:var(--bg-card)] p-4 shadow-[0_18px_42px_rgba(0,0,0,.10)] sm:p-6">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[12px] font-medium uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">
            Painel desktop
          </p>
          <h2 className="m-0 text-[18px] font-bold leading-[1.3] text-[color:var(--text-primary)]">
            O que está acontecendo com sua internet?
          </h2>
          <p className="m-0 text-[13px] leading-[1.45] text-[color:var(--text-secondary)]">
            Escolha um sintoma para aprofundar ou rode o teste completo sem contexto.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2">
          {PROBLEMAS_PERCEBIDOS.map((item) => {
            const selected = problema === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setProblema((atual) => (atual === item.value ? null : item.value))}
                className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-medium transition-colors active:scale-[0.97] ${
                  selected
                    ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,_var(--accent)_12%,_transparent)] text-[color:var(--accent)]"
                    : "border-[color:var(--border)] bg-[color:var(--bg-card)] text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-[16px]">
                  {ICONE_PROBLEMA[item.value]}
                </span>
                <span className="text-center leading-[1.2]">{item.label}</span>
              </button>
            );
          })}
        </div>

        {measurementContext && (
          <GuidedDiagnosis measurementContext={measurementContext} onAnswersChange={setRespostas} />
        )}

        <button
          type="button"
          onClick={iniciarTesteCompleto}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border-none bg-[linear-gradient(135deg,_var(--accent),_color-mix(in_srgb,_var(--accent)_65%,_black))] text-[15px] font-semibold text-[color:var(--on-accent)] shadow-[0_14px_30px_color-mix(in_srgb,_var(--accent)_45%,_transparent),_0_2px_6px_rgba(0,0,0,.25)] transition-transform hover:brightness-110 active:scale-[0.98]"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">science</span>
          Teste completo
        </button>

        {ferramentas}
      </aside>
    </div>
  );
}
