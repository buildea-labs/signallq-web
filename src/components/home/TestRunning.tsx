"use client";

import { DiagnosingSteps } from "@/components/speedtest/DiagnosingSteps";
import { MeasurementStatusLine } from "@/components/speedtest/MeasurementStatusLine";
import type { MeasurementSessionContext } from "@/lib/measurementSessionContext";
import { POST_RESULT_PROBLEMS } from "@/lib/postResultProblem";
import type { PostResultProblema } from "@/lib/postResultProblem";
import { PROBLEMAS_PERCEBIDOS } from "@/lib/problemEntry";
import type { FasePainel } from "@/lib/speedTestPhase";

interface TestRunningProps {
  phase: FasePainel;
  mode: "rapido" | "completo";
  measurementContext: MeasurementSessionContext | null;
  deepeningAfterQuickResult: boolean;
  postResultProblem: PostResultProblema | null;
  onCancel: () => void;
}

/** Etapa em execução: passo, estado da medição e cancelamento explícito. */
export function TestRunning({
  phase,
  mode,
  measurementContext,
  deepeningAfterQuickResult,
  postResultProblem,
  onCancel,
}: TestRunningProps) {
  // Aprofundamento pós-resultado (spec Juliana §1): na primeira fase, troca
  // literalmente o texto padrão de latência pela frase de transição — nas
  // fases seguintes (download/upload/processando), os textos já existentes
  // do modo Completo não mudam, sem variante "pós-problema".
  let statusText = "Preparando teste...";
  if (phase === "latencia") {
    statusText = deepeningAfterQuickResult
      ? "Aprofundando com um teste completo…"
      : "Medindo tempo de resposta inicial...";
  } else if (phase === "download") {
    statusText = mode === "rapido" ? "Quase acabando..." : "Avaliando capacidade de download...";
  } else if (phase === "upload") statusText = "Quase acabando, medindo upload...";
  else if (phase === "processando") statusText = "Consolidando resultado...";

  // "1 de 2 · Download" (protótipo, tela 2.2): só no modo Completo, que é o
  // único com mais de uma etapa de throughput.
  const step =
    mode === "completo" && phase === "download"
      ? "1 de 2 · Download"
      : mode === "completo" && phase === "upload"
        ? "2 de 2 · Upload"
        : undefined;

  // O contexto pré-teste (`measurementContext.declaredProblem`) e a escolha
  // pós-resultado são vocabulários e fontes distintos (ver `postResultProblem.ts`);
  // aqui só reaproveitamos o mesmo padrão de exibição ("Contexto informado: ..."),
  // lendo qual dos dois está de fato ativo nesta rodada.
  const declaredProblemLabel = measurementContext?.declaredProblem
    ? PROBLEMAS_PERCEBIDOS.find((opcao) => opcao.value === measurementContext.declaredProblem)?.label
    : postResultProblem && postResultProblem !== "sem-problema"
      ? POST_RESULT_PROBLEMS.find((opcao) => opcao.value === postResultProblem)?.label
      : undefined;

  const contextLine = declaredProblemLabel ? (
    <p className="m-0 text-center text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">
      Contexto informado: {declaredProblemLabel}
    </p>
  ) : null;

  // Medição concluída e diagnóstico rodando (tela 2.3): a lista de etapas
  // substitui o mostrador, sem skeleton pesado.
  if (mode === "completo" && phase === "processando") {
    return (
      <>
        {contextLine}
        <span className="sr-only" role="status" aria-live="polite">
          {statusText}
        </span>
        <DiagnosingSteps phase={phase} onCancel={onCancel} />
      </>
    );
  }

  return (
    <>
      {contextLine}
      <MeasurementStatusLine text={statusText} step={step} />
      <button
        type="button"
        onClick={onCancel}
        className="min-h-[44px] border-none bg-transparent p-0 text-[12px] font-medium text-[color:var(--text-secondary)] underline underline-offset-4 cursor-pointer hover:text-[color:var(--text-primary)]"
      >
        Cancelar teste
      </button>
    </>
  );
}
