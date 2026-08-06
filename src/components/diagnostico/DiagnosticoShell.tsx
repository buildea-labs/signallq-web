"use client";

import type { ReactNode } from "react";
import { useDiagnosticoJornada } from "@/hooks/useDiagnosticoJornada";
import { InicioAutomatico } from "./InicioAutomatico";
import { ResultadoRapido } from "./ResultadoRapido";
import { TesteCompleto } from "./TesteCompleto";
import { ResultadoCompleto } from "./ResultadoCompleto";

interface Props {
  ferramentas: ReactNode;
}

function telaAtual(jornada: ReturnType<typeof useDiagnosticoJornada>, ferramentas: ReactNode) {
  switch (jornada.estado.nome) {
    case "inicio_automatico":
      return <InicioAutomatico jornada={jornada} />;
    case "resultado_rapido":
      return <ResultadoRapido jornada={jornada} ferramentas={ferramentas} />;
    case "teste_completo":
      return <TesteCompleto jornada={jornada} />;
    case "resultado_completo":
      return <ResultadoCompleto jornada={jornada} ferramentas={ferramentas} />;
  }
}

export function DiagnosticoShell({ ferramentas }: Props) {
  const jornada = useDiagnosticoJornada();

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <header className="w-full max-w-[960px] flex flex-col items-center gap-2 text-center">
        <span className="rounded-full border border-[color-mix(in_srgb,_var(--border)_24%,_transparent)] bg-[color:var(--bg-card)] px-3 py-1 text-[12px] font-medium leading-[1.3] text-[color:var(--accent)]">
          Protótipo WebApp + Desktop
        </span>
        <h1 className="m-0 max-w-[680px] text-[28px] font-bold leading-[1.15] tracking-tight text-[color:var(--text-primary)] sm:text-[36px]">
          Diagnóstico guiado sem transformar a Home em painel técnico
        </h1>
        <p className="m-0 max-w-[620px] text-[14px] leading-[1.55] text-[color:var(--text-secondary)]">
          A rota valida a nova jornada em paralelo: teste rápido automático, aprofundamento opcional e ferramentas contextuais reaproveitadas.
        </p>
      </header>
      <div key={jornada.estado.nome} className="w-full sq-fade-up">
        {telaAtual(jornada, ferramentas)}
      </div>
    </div>
  );
}
