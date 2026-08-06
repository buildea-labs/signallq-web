"use client";

import { useEffect, useState } from "react";
import { useSpeedTest, type ProblemPhase } from "@/hooks/useSpeedTest";
import { usePostResultProblem } from "@/hooks/usePostResultProblem";
import { useRetestComparison } from "@/hooks/useRetestComparison";
import { useSpeedTestDeepening } from "@/hooks/useSpeedTestDeepening";
import { useSpeedTestEntry } from "@/hooks/useSpeedTestEntry";
import type { ContextualAnswer } from "@/lib/contextualQuestionFlow";
import { updateRecordDiagnostic } from "@/lib/measurementRepository";
import { createMeasurementSessionContext } from "@/lib/measurementSessionContext";
import { readMeasurementSession } from "@/lib/measurementSessionStore";
import type { RedeDeclarada } from "@/lib/networkEntry";
import type { PostResultProblema } from "@/lib/postResultProblem";
import type { ProblemaPercebido } from "@/lib/problemEntry";
import { copySpeedTestResult, shareSpeedTestResult } from "@/lib/speedTestJourneySharing";
import { speedTestLayoutFor } from "@/lib/speedTestLayout";
import { RUNNING_PHASES } from "@/lib/speedTestPhase";
import { deriveSpeedTestVisualState } from "@/lib/speedTestVisualState";
import type { SpeedometerOutcome } from "@/lib/speedometerIdentity";
import {
  FEATURE_SPEEDTEST_COMPARTILHOU,
  FEATURE_SPEEDTEST_ENTRADA_DIRETA,
  FEATURE_SPEEDTEST_ENTRADA_PROBLEMA,
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
 * Estado e orquestração da jornada de Velocidade: início automático,
 * restauração, sheet de diagnóstico, aprofundamento, reteste/comparação,
 * telemetria, persistência e compartilhamento. A UI só consome o que este
 * hook devolve.
 */
export function useSpeedTestJourney() {
  const [modo, setModo] = useState<"rapido" | "completo">("rapido");
  const [copiado, setCopiado] = useState(false);
  // Sheet "Diagnosticar minha internet" (protótipo, tela 2.1) e o que ele
  // declara. Substituiu a tela ociosa de entrada por problema: o protótipo não
  // tem tela ociosa — a rota entra medindo.
  const [sheetDiagnosticoAberto, setSheetDiagnosticoAberto] = useState(false);
  const [redeDeclarada, setRedeDeclarada] = useState<RedeDeclarada | null>(null);
  const [respostasContextuais, setRespostasContextuais] = useState<ContextualAnswer[]>(
    () => readMeasurementSession()?.answers ?? []
  );
  const [resultadoRestaurado, setResultadoRestaurado] = useState(false);
  const { phase, liveValue, phaseResults, result, measurementContext, cancelTest, retry, forceStart, restaurarResultadoAnterior, injectResult } =
    useSpeedTest(modo);
  const { retesteBase, comparacaoReteste, comparacaoNaoSalva, iniciarComparacao } = useRetestComparison(result);
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
  const shouldCollectContextualQuestions = isResult && measurementContext?.entry === "problem";

  const aprofundamento = useSpeedTestDeepening({
    phase,
    isProblem,
    result,
    onCancelado: () => {
      restaurarResultadoAnterior();
      setModo("rapido");
      resetarProblemaPosResultado();
    },
  });

  useEffect(() => {
    setRespostasContextuais(readMeasurementSession()?.answers ?? []);
  }, []);

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

  const iniciarTesteDireto = (contextualProblem?: ProblemaPercebido) => {
    resetarProblemaPosResultado();
    setResultadoRestaurado(false);
    aprofundamento.limpar();
    setModo("rapido");
    if (contextualProblem) {
      // Entrada vinda de uma rota editorial (`/?context=...`): o problema já
      // foi declarado lá, então a medição começa com esse contexto em vez de
      // abrir uma tela para declarar de novo o que a pessoa já disse.
      trackFeatureUsed(FEATURE_SPEEDTEST_ENTRADA_PROBLEMA);
      trackFeatureUsed(FEATURE_SPEEDTEST_PROBLEMA_SELECIONADO);
      forceStart(createMeasurementSessionContext("problem", contextualProblem));
      return;
    }
    trackFeatureUsed(FEATURE_SPEEDTEST_ENTRADA_DIRETA);
    forceStart(createMeasurementSessionContext("direct"));
  };

  const abrirSheetDiagnostico = () => setSheetDiagnosticoAberto(true);
  const fecharSheetDiagnostico = () => setSheetDiagnosticoAberto(false);
  const declararRede = (valor: RedeDeclarada) => setRedeDeclarada(valor);

  const iniciarReteste = () => {
    if (!result) return;
    iniciarComparacao(result);
    resetarProblemaPosResultado();
    setResultadoRestaurado(false);
    aprofundamento.limpar();
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
    aprofundamento.iniciar(result);
    setResultadoRestaurado(false);
    setModo("completo");
    retry("completo");
  };

  const selecionarProblemaPosResultado = (valor: PostResultProblema) => {
    selecionarProblemaPosResultadoBase(valor);
  };

  /**
   * CTA do sheet. O aprofundamento passou a exigir esta ação explícita: antes,
   * um efeito o disparava assim que o fluxo de perguntas concluía, então a
   * medição começava sozinha por causa de uma resposta — nunca de um "sim,
   * pode medir". Sem problema escolhido, roda o teste completo mesmo assim,
   * como o protótipo permite.
   */
  const confirmarDiagnostico = () => {
    fecharSheetDiagnostico();
    iniciarAprofundamento();
  };

  const compartilhar = async () => {
    if (!result) return;
    const outcome = await shareSpeedTestResult(result, respostaDiagnostica);
    if (outcome !== "cancelled") trackFeatureUsed(FEATURE_SPEEDTEST_COMPARTILHOU);
  };

  const copiarResumo = async () => {
    if (!result) return;
    const outcome = await copySpeedTestResult(result, respostaDiagnostica);
    if (outcome === "copied" || outcome === "manual-copy") {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
      trackFeatureUsed(FEATURE_SPEEDTEST_COMPARTILHOU);
    }
  };

  const { isAutoStarting } = useSpeedTestEntry({
    isIdle,
    result,
    onRestore: (restaurado) => {
      setResultadoRestaurado(true);
      setModo(restaurado.mode === "rapido" ? "rapido" : "completo");
      setTimeout(() => injectResult(restaurado), 0);
    },
    onStart: iniciarTesteDireto,
  });

  const visualState = deriveSpeedTestVisualState({
    phase,
    mode: modo,
    result,
    liveValue,
    phaseResults,
    measurementContext,
    isAutoStarting,
    restoredResult: resultadoRestaurado,
    deepeningAfterQuickResult: aprofundamento.ativo,
  });

  // Layout é consequência do estado visual, nunca uma segunda decisão tomada
  // dentro dos componentes.
  const layout = speedTestLayoutFor(visualState, phase);
  const shellAlign: "center" | "start" = layout.stage === "stage" ? "center" : "start";

  return {
    modo, copiado,
    phase, liveValue, phaseResults, result, measurementContext,
    isIdle, isRunning, isResult, isProblem, hasVisibleResult, terminalOutcome, showDial, shellAlign,
    isAutoStarting,
    visualState, layout,
    shouldCollectContextualQuestions,
    sheetDiagnosticoAberto, redeDeclarada, respostaDiagnostica,
    retesteBase, comparacaoReteste, comparacaoNaoSalva,
    setRespostasContextuais,
    postResultProblem, postResultAnswers, postResultMeasurementContext,
    postResultFlowState, respostaDiagnosticaPosResultado,
    selecionarProblemaPosResultado, atualizarRespostasPosResultado,
    emAprofundamentoPosResultado: aprofundamento.ativo,
    notaAprofundamentoCancelado: aprofundamento.notaCancelado,
    erroDuranteAprofundamento: aprofundamento.erroDurante,
    downloadMudouNoAprofundamento: aprofundamento.downloadMudou,
    iniciarAprofundamento,
    abrirSheetDiagnostico, fecharSheetDiagnostico, declararRede, confirmarDiagnostico,
    iniciarTesteDireto, iniciarReteste,
    cancelTest, retry, compartilhar, copiarResumo,
  };
}
