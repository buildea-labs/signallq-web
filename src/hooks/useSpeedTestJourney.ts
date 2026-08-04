"use client";

import { useEffect, useRef, useState } from "react";
import { useSpeedTest, type ProblemPhase } from "@/hooks/useSpeedTest";
import { usePostResultProblem } from "@/hooks/usePostResultProblem";
import { contextualProblemFromSearch } from "@/lib/contextualEntry";
import type { ContextualAnswer } from "@/lib/contextualQuestionFlow";
import { addComparison } from "@/lib/comparisonRepository";
import { updateRecordDiagnostic } from "@/lib/measurementRepository";
import { createMeasurementSessionContext } from "@/lib/measurementSessionContext";
import { readMeasurementSession } from "@/lib/measurementSessionStore";
import type { PostResultProblema } from "@/lib/postResultProblem";
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
  // Aprofundamento pós-resultado (bug crítico do diagnóstico, GH#1367
  // follow-up): ao escolher um problema depois do resultado Rápido, o app
  // troca de verdade para o modo Completo e reexecuta a medição — nada disso
  // existia antes; a escolha só alimentava perguntas contextuais sobre um
  // resultado que continuava sendo só de download.
  const [emAprofundamentoPosResultado, setEmAprofundamentoPosResultado] = useState(false);
  const [notaAprofundamentoCancelado, setNotaAprofundamentoCancelado] = useState(false);
  const [downloadMbpsAntesDoAprofundamento, setDownloadMbpsAntesDoAprofundamento] = useState<number | null>(null);
  const abandonoRegistrado = useRef(false);
  const comparacaoPersistida = useRef<string | null>(null);
  const { phase, liveValue, phaseResults, result, measurementContext, cancelTest, retry, forceStart, restaurarResultadoAnterior } =
    useSpeedTest(modo);
  const {
    postResultProblem,
    postResultAnswers,
    postResultMeasurementContext,
    postResultFlowState,
    respostaDiagnosticaPosResultado,
    selecionarProblemaPosResultado: selecionarProblemaPosResultadoBase,
    atualizarRespostasPosResultado,
    resetarProblemaPosResultado,
  } = usePostResultProblem(result);

  const isIdle = phase === "idle";
  const isRunning = RUNNING_PHASES.includes(phase);
  const isResult =
    phase === "concluido" || phase === "parcial" || phase === "inconclusivo" || phase === "contaminado";
  const isProblem = PROBLEM_PHASES.includes(phase as ProblemPhase);
  // Em caso de falha/cancelamento de um reteste, `useSpeedTest` preserva a
  // rodada anterior; ela continua visível abaixo do estado de falha.
  const hasVisibleResult = isResult || (isProblem && result !== null);
  // Bug crítico (revisão do Caio, reprodução determinística): `result` de uma
  // rodada anterior (ex.: `contaminated`) nunca é limpo durante um reteste
  // (intencional em `useSpeedTestController.ts`, serve de fallback visível em
  // caso de erro/cancelamento). Sem a guarda de `isRunning` aqui, esse
  // resultado antigo era lido como terminal enquanto a NOVA medição ainda
  // está rodando (fases `latencia`/`download`/`upload`/`processando`),
  // fazendo o velocímetro mostrar cor/rótulo do resultado velho ("Contaminado",
  // laranja) por cima de uma medição que nem terminou. Nenhuma fase de
  // execução pode produzir um outcome terminal.
  const terminalOutcome: SpeedometerOutcome | null =
    phase === "cancelado"
      ? "cancelled"
      : isRunning || isProblem
        ? null
        : result?.status ?? null;
  const showDial = isIdle || isRunning || terminalOutcome !== null || isProblem;
  const shellAlign: "center" | "start" = isRunning || isProblem ? "center" : "start";
  const shouldCollectContextualQuestions = isResult && measurementContext?.entry === "problem";
  const shouldResumeContextualQuestions = isIdle && questionarioRetomavel && measurementContext?.entry === "problem";
  // Falha (não cancelamento) durante o aprofundamento: mantém o mesmo cartão
  // de erro genérico já usado no fluxo principal (`problemStates.ts`), só
  // acrescido de contexto — nunca um componente novo.
  const erroDuranteAprofundamento = isProblem && phase !== "cancelado" && emAprofundamentoPosResultado;
  // "Este é o resultado do teste completo..." só quando o download realmente
  // mudou em relação à estimativa rápida anterior — comparação puramente
  // booleana, sem exibir os dois valores (spec Juliana §3).
  const downloadMudouNoAprofundamento =
    emAprofundamentoPosResultado &&
    downloadMbpsAntesDoAprofundamento !== null &&
    result !== null &&
    result.download.mbps !== downloadMbpsAntesDoAprofundamento;

  // Cancelamento do aprofundamento pós-resultado: volta ao resultado rápido
  // original (nunca trava numa tela de loading/erro) e permite escolher de
  // novo, sem forçar nova escolha nem perder o resultado rápido já medido.
  useEffect(() => {
    if (phase !== "cancelado" || !emAprofundamentoPosResultado) return;
    restaurarResultadoAnterior();
    setModo("rapido");
    setEmAprofundamentoPosResultado(false);
    resetarProblemaPosResultado();
    setNotaAprofundamentoCancelado(true);
  }, [phase, emAprofundamentoPosResultado, restaurarResultadoAnterior, resetarProblemaPosResultado]);

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
    resetarProblemaPosResultado();
    setEmAprofundamentoPosResultado(false);
    setNotaAprofundamentoCancelado(false);
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
    resetarProblemaPosResultado();
    setEmAprofundamentoPosResultado(false);
    setNotaAprofundamentoCancelado(false);
    forceStart(createMeasurementSessionContext("problem", problemaPercebido));
  };

  const iniciarReteste = () => {
    if (!result) return;
    setRetesteBase(result);
    setComparacaoReteste(null);
    setComparacaoNaoSalva(false);
    resetarProblemaPosResultado();
    setEmAprofundamentoPosResultado(false);
    setNotaAprofundamentoCancelado(false);
    retry();
  };

  // Aprofundamento pós-resultado (bug crítico #1+#2): dispara tanto na
  // primeira escolha de um problema quanto num "Tentar novamente" depois de
  // uma falha do teste completo — reusa o mesmo teste completo real
  // (download+upload+latência+jitter), nunca um novo teste rápido. Usa
  // `retry` (isRepeat=true) e não `forceStart`, de propósito: preserva
  // `result` (o resultado rápido anterior) como fallback visível durante a
  // execução e em caso de cancelamento/erro (spec Juliana §4).
  const iniciarAprofundamento = () => {
    setNotaAprofundamentoCancelado(false);
    setDownloadMbpsAntesDoAprofundamento(result ? result.download.mbps : null);
    setEmAprofundamentoPosResultado(true);
    setModo("completo");
    retry("completo");
  };

  const selecionarProblemaPosResultado = (valor: PostResultProblema) => {
    selecionarProblemaPosResultadoBase(valor);
    if (valor === "sem-problema") return;
    iniciarAprofundamento();
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

  const autoStartDisparado = useRef(false);
  const [isAutoStarting, setIsAutoStarting] = useState(true);

  useEffect(() => {
    if (modo === "rapido" && !problemaPercebido && isIdle && !autoStartDisparado.current) {
      if (typeof window !== "undefined" && !window.location.search.includes("problem=")) {
        const hasAutoStarted = sessionStorage.getItem("speedtest_autostarted") === "true";
        autoStartDisparado.current = true;
        
        if (!hasAutoStarted) {
          sessionStorage.setItem("speedtest_autostarted", "true");
          // Espera um tick para garantir que react renderize
          setTimeout(() => {
            iniciarTesteDireto();
            setIsAutoStarting(false);
          }, 0);
        } else {
          setIsAutoStarting(false);
        }
      } else {
        setIsAutoStarting(false);
      }
    } else if (isIdle && isAutoStarting) {
      setIsAutoStarting(false);
    }
    
    if (result && result.status === 'complete') {
        const testResults = {
          latency: result.latency.ms,
          download: result.download.mbps,
          upload: result.upload.mbps,
          jitter: result.latency.p95Ms ? Math.abs(result.latency.p95Ms - result.latency.ms) : 0,
          timestamp: Date.now()
        };
        if (typeof window !== "undefined") {
          sessionStorage.setItem("signallq_last_result", JSON.stringify(testResults));
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, problemaPercebido, isIdle, result]);

  return {
    modo, setModo, copiado,
    phase, liveValue, phaseResults, result, measurementContext,
    isIdle, isRunning, isResult, isProblem, hasVisibleResult, terminalOutcome, showDial, shellAlign,
    isAutoStarting,
    shouldCollectContextualQuestions, shouldResumeContextualQuestions,
    entradaProblemaAberta, problemaPercebido, respostaDiagnostica,
    retesteBase, comparacaoReteste, comparacaoNaoSalva,
    setRespostasContextuais,
    postResultProblem, postResultAnswers, postResultMeasurementContext,
    postResultFlowState, respostaDiagnosticaPosResultado,
    selecionarProblemaPosResultado, atualizarRespostasPosResultado,
    emAprofundamentoPosResultado, notaAprofundamentoCancelado,
    erroDuranteAprofundamento, downloadMudouNoAprofundamento, iniciarAprofundamento,
    abrirEntradaPorProblema, fecharEntradaPorProblema, selecionarProblema,
    iniciarTesteDireto, iniciarTesteComProblema, iniciarReteste,
    cancelTest, retry, compartilhar, copiarResumo,
  };
}
