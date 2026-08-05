"use client";

import type { DiagnosticoJornada } from "@/hooks/useDiagnosticoJornada";
import { VelocimetroAoVivo } from "./VelocimetroAoVivo";

interface Props {
  jornada: DiagnosticoJornada;
}

export function InicioAutomatico({ jornada }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 rounded-[28px] border border-[color-mix(in_srgb,_var(--border)_18%,_transparent)] bg-[color:var(--bg-card)] p-4 shadow-[0_18px_42px_rgba(0,0,0,.12)] sm:p-6">
      <div className="text-center">
        <p className="m-0 text-[12px] font-medium uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">
          Teste rápido automático
        </p>
        <h2 className="m-0 mt-1 text-[18px] font-semibold leading-[1.25] text-[color:var(--text-primary)]">
          Medindo sua conexão agora
        </h2>
      </div>
      <VelocimetroAoVivo motor={jornada.motor} />
    </div>
  );
}
