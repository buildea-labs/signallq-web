"use client";

import { PageShell } from "@/components/PageShell";
import { CompleteDiagnosis } from "@/components/home/CompleteDiagnosis";
import { HomeProductContext } from "@/components/home/HomeProductContext";
import { QuickTestJourney } from "@/components/home/QuickTestJourney";
import { useSpeedTestJourney } from "@/hooks/useSpeedTestJourney";

export function HomeClient() {
  const journey = useSpeedTestJourney();

  return (
    <PageShell align={journey.shellAlign} contentMax={journey.layout.contentMax}>
      {/* Toda rota do site declara um `<h1>` (Histórico, Diagnóstico, Meu IP,
          Comparar…) — a Home era a única sem nenhum heading, então a página
          chegava à tecnologia assistiva sem título e sem estrutura de
          documento (axe `page-has-heading-one`). O desenho aprovado da Home
          não tem título visível e não é alterado aqui: o heading é `sr-only`,
          mesmo recurso já usado em `Velocimetro` e `HistoricoClient`. */}
      <h1 className="sr-only">Teste de velocidade da sua internet</h1>
      <QuickTestJourney journey={journey} />
      {!journey.isProblem && <CompleteDiagnosis journey={journey} />}
      <HomeProductContext visible={journey.isIdle || journey.hasVisibleResult} />
    </PageShell>
  );
}
