"use client";

import { useEffect, useRef, useState } from "react";
import { useSpeedTest, type ProblemPhase } from "@/hooks/useSpeedTest";
import { contextualProblemFromSearch } from "@/lib/contextualEntry";
import type { ContextualAnswer } from "@/lib/contextualQuestionFlow";
import { addComparison, updateRecordDiagnostic } from "@/lib/historyStore";
import { createMeasurementSessionContext } from "@/lib/measurementSessionContext";
import { readMeasurementSession } from "@/lib/measurementSessionStore";
import type { ProblemaPercebido } from "@/lib/problemEntry";
import { compareRetest, comparisonMode, type RetestComparison } from "@/lib/retestComparison";
import { copyMeasurement, shareMeasurement } from "@/lib/sharing";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { RUNNING_PHASES } from "@/lib/speedTestPhase";
import type { SpeedometerOutcome } from "@/lib/speedometerIdentity";
import {
  FEATURE_SPEEDTEST_COMPARTILHOU,
  FEATURE_SPEEDTEST_ENTRADA_DIRETA,
  FEATURE_SPEEDTEST_ENTRADA_PROBLEMA,
  FEATURE_SPEEDTEST_PROBLEMA_ABANDONADO,
  FEATURE_SPEEDTEST_PROBLEMA_SELECIONADO,
  trackFeatureUsed,
} from "@/lib/telemetry";
import { createWebDiagnosticResponse } from "@/lib/webDiagnosticResponse";

export const PROBLEM_PHASES: ProblemPhase[] = [
  "sem-conexao",
  "conexao-interrompida",
  "endpoint-indisponivel",
  "erro-inesperado",
  "cancelado",
  "bloqueado-outra-aba",
];

export type SpeedTestJourney = ReturnType<typeof useSpeedTestJourney>;

/**
 * Estado e orquestração da jornada da Home: modo de teste, entrada por
 * problema, questionário contextual, reteste/comparação, telemetria,
 * persistência e compartilhamento. A UI só consome o que este hook devolve.
 */
export function useSpeedTestJourney() {
  const [modo, setModo] = useState<"rapido" | "completo">("rapido");
  const [copiado, setCopiado] = useState(false);
  const [entradaProblemaAberta, setEntradaProblemaAberta] = useState(false);
  const [problemaPercebido, setProblemaPercebido] = useState<ProblemaPercebido | null>(null);
  const [questionarioRetomavel, setQuestionarioRetomavel] = useState(false);
  const [respostasContextuais, setRespostasContextuais] = useState<ContextualAnswer[]>(
    () => readMeasurementSession()?.answers ?? []
  );
  const [retesteBase, setRetesteBase] = useState<SpeedTestResult | null>(null);
  const [comparacaoReteste, setComparacaoReteste] = useState<RetestComparison | null>(null);
  const [comparacaoNaoSalva, setComparacaoNaoSalva] = useState(false);
  const abandonoRegistrado = useRef(false);
  const comparacaoPersistida = useRef<string | null>(null);
  const { phase, liveValue, phaseResults, result, measurementContext, cancelTest, retry, forceStart } = useSpeedTest(modo);

  const isIdle = phase === "idle";
  const isRunning = RUNNING_PHASES.includes(phase);
  const isResult =
    phase === "concluido" || phase === "parcial" || phase === "inconclusivo" || phase === "contaminado";
  const isProblem = PROBLEM_PHASES.includes(phase as ProblemPhase);
  // Em caso de falha/cancelamento de um reteste, `useSpeedTest` preserva a
  // rodada anterior; ela continua visível abaixo do estado de falha.
  const hasVisibleResult = isResult || (isProblem && result !== null);
  const terminalOutcome: SpeedometerOutcome | null =
    phase === "cancelado"
      ? "cancelled"
      : isProblem
        ? null
        : result?.status ?? null;
  const showDial = isIdle || isRunning || terminalOutcome !== null || isProblem;
  const shellAlign: "center" | "start" = isRunning || isProblem ? "center" : "start";
  const shouldCollectContextualQuestions = isResult && measurementContext?.entry === "problem";
  const shouldResumeContextualQuestions = isIdle && questionarioRetomavel && measurementContext?.entry === "problem";

  useEffect(() => {
    const session = readMeasurementSession();
    setQuestionarioRetomavel(Boolean(session?.questionnaireActive));
    setRespostasContextuais(session?.answers ?? []);
  }, []);

  useEffect(() => {
    const contextualProblem = contextualProblemFromSearch(window.location.search);
    if (!contextualProblem) return;
    // A rota editorial só prepara uma escolha local; nunca inicia teste nem
    // envia dados sem uma nova ação explícita da pessoa.
    setEntradaProblemaAberta(true);
    setProblemaPercebido(contextualProblem);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    const registrarAbandono = () => {
      if (phase === "idle" && problemaPercebido && !abandonoRegistrado.current) {
        abandonoRegistrado.current = true;
        trackFeatureUsed(FEATURE_SPEEDTEST_PROBLEMA_ABANDONADO);
      }
    };
    window.addEventListener("pagehide", registrarAbandono);
    return () => window.removeEventListener("pagehide", registrarAbandono);
  }, [phase, problemaPercebido]);

  useEffect(() => {
    if (!retesteBase || !result || retesteBase.id === result.id) return;
    const comparison = compareRetest(retesteBase, result);
    setComparacaoReteste(comparison);
    const mode = comparisonMode(result.mode);
    const comparisonId = `${retesteBase.id}:${result.id}`;
    if (!comparison.compatible || !mode || comparacaoPersistida.current === comparisonId) return;
    comparacaoPersistida.current = comparisonId;
    void addComparison({ id: comparisonId, createdAt: Date.now(), beforeId: retesteBase.id, afterId: result.id, mode })
      .catch(() => setComparacaoNaoSalva(true));
  }, [result, retesteBase]);

  const respostaDiagnostica = result ? createWebDiagnosticResponse(result, measurementContext, respostasContextuais) : null;
  useEffect(() => {
    if (!result || !respostaDiagnostica || result.status !== 'complete') return;
    void updateRecordDiagnostic(result.id, {
      conclusion: respostaDiagnostica.conclusion,
      confidence: respostaDiagnostica.confidence,
      nextAction: respostaDiagnostica.nextAction,
      contractVersion: respostaDiagnostica.version,
    });
  }, [result, respostaDiagnostica]);

  const selecionarProblema = (valor: ProblemaPercebido) => {
    abandonoRegistrado.current = false;
    setProblemaPercebido(valor);
    trackFeatureUsed(FEATURE_SPEEDTEST_PROBLEMA_SELECIONADO);
  };

  const iniciarTesteDireto = () => {
    setProblemaPercebido(null);
    setEntradaProblemaAberta(false);
    trackFeatureUsed(FEATURE_SPEEDTEST_ENTRADA_DIRETA);
    forceStart(createMeasurementSessionContext("direct"));
  };

  const abrirEntradaPorProblema = () => {
    setEntradaProblemaAberta(true);
    trackFeatureUsed(FEATURE_SPEEDTEST_ENTRADA_PROBLEMA);
  };

  const fecharEntradaPorProblema = () => setEntradaProblemaAberta(false);

  const iniciarTesteComProblema = () => {
    if (!problemaPercebido) return;
    abandonoRegistrado.current = true;
    forceStart(createMeasurementSessionContext("problem", problemaPercebido));
  };

  const iniciarReteste = () => {
    if (!result) return;
    setRetesteBase(result);
    setComparacaoReteste(null);
    setComparacaoNaoSalva(false);
    retry();
  };

  const compartilhar = async () => {
    if (!result) return;
    const outcome = await shareMeasurement({ timestamp: result.timestamp, downloadMbps: result.download.mbps, uploadMbps: result.upload.mbps, latencyMs: result.latency.ms, conclusion: respostaDiagnostica?.conclusion, nextAction: respostaDiagnostica?.nextAction });
    if (outcome !== "cancelled") trackFeatureUsed(FEATURE_SPEEDTEST_COMPARTILHOU);
  };

  const copiarResumo = async () => {
    if (!result) return;
    const outcome = await copyMeasurement({ timestamp: result.timestamp, downloadMbps: result.download.mbps, uploadMbps: result.upload.mbps, latencyMs: result.latency.ms, conclusion: respostaDiagnostica?.conclusion, nextAction: respostaDiagnostica?.nextAction });
    if (outcome === "copied" || outcome === "manual-copy") {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
      trackFeatureUsed(FEATURE_SPEEDTEST_COMPARTILHOU);
    }
  };

  return {
    modo, setModo, copiado,
    phase, liveValue, phaseResults, result, measurementContext,
    isIdle, isRunning, isResult, isProblem, hasVisibleResult, terminalOutcome, showDial, shellAlign,
    shouldCollectContextualQuestions, shouldResumeContextualQuestions,
    entradaProblemaAberta, problemaPercebido, respostaDiagnostica,
    retesteBase, comparacaoReteste, comparacaoNaoSalva,
    setRespostasContextuais,
    abrirEntradaPorProblema, fecharEntradaPorProblema, selecionarProblema,
    iniciarTesteDireto, iniciarTesteComProblema, iniciarReteste,
    cancelTest, retry, compartilhar, copiarResumo,
  };
}
