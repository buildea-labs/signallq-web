"use client";

import type { ReactNode } from "react";
import type { DiagnosticoJornada } from "@/hooks/useDiagnosticoJornada";
import { VelocimetroAoVivo } from "./VelocimetroAoVivo";

interface Props {
  jornada: DiagnosticoJornada;
  ferramentas: ReactNode;
}

export function ResultadoCompleto({ jornada, ferramentas }: Props) {
  const { diagnostico } = jornada;
  return (
    <div className="mx-auto grid w-full max-w-[1060px] grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,560px)_minmax(360px,440px)] lg:gap-8">
      <section
        aria-labelledby="diagnostico-completo-titulo"
        className="rounded-[28px] border border-[color-mix(in_srgb,_var(--border)_18%,_transparent)] bg-[color:var(--bg-card)] p-4 shadow-[0_18px_42px_rgba(0,0,0,.12)] sm:p-6 lg:sticky lg:top-6"
      >
        <div className="mb-3 text-center">
          <p className="m-0 text-[12px] font-medium uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">
            Tela WebApp
          </p>
          <h2 id="diagnostico-completo-titulo" className="m-0 mt-1 text-[18px] font-semibold leading-[1.25] text-[color:var(--text-primary)]">
            Resultado completo
          </h2>
        </div>
        <VelocimetroAoVivo motor={jornada.motor} />
      </section>

      <aside className="flex w-full flex-col gap-4 rounded-[28px] border border-[color-mix(in_srgb,_var(--border)_18%,_transparent)] bg-[color:var(--bg-card)] p-4 shadow-[0_18px_42px_rgba(0,0,0,.10)] sm:p-6">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[12px] font-medium uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">
            Painel desktop
          </p>
          <h2 className="m-0 text-[22px] font-bold leading-[1.25] text-[color:var(--text-primary)]">
            {diagnostico?.conclusion ?? "Resultado pronto para aprofundar"}
          </h2>
          <p className="m-0 text-[14px] leading-[1.45] text-[color:var(--text-secondary)]">
            {diagnostico?.nextAction ?? "Use as ferramentas abaixo para investigar DNS, jogos ou IP público sem salvar dados extras no Histórico."}
          </p>
        </div>

        {diagnostico?.confidence && (
          <div className="rounded-2xl border border-[color-mix(in_srgb,_var(--border)_16%,_transparent)] bg-[color:var(--bg-secondary)] p-3 text-[13px] leading-[1.45] text-[color:var(--text-secondary)]">
            {diagnostico.confidence}
          </div>
        )}

        {ferramentas}

        <button
          type="button"
          onClick={jornada.reiniciar}
          className="flex h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-transparent text-[14px] font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:var(--bg-secondary)]"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">refresh</span>
          Recomeçar diagnóstico
        </button>
      </aside>
    </div>
  );
}
