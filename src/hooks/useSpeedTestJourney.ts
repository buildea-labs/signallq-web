"use client";

import { useEffect, useRef, useState } from "react";
import { useSpeedTest, type ProblemPhase } from "@/hooks/useSpeedTest";
import { usePostResultProblem } from "@/hooks/usePostResultProblem";
import { contextualProblemFromSearch } from "@/lib/contextualEntry";
import type { ContextualAnswer } from "@/lib/contextualQuestionFlow";
import { updateRecordDiagnostic } from "@/lib/measurementRepository";
import { createMeasurementSessionContext } from "@/lib/measurementSessionContext";
import { readMeasurementSession } from "@/lib/measurementSessionStore";
import type { RedeDeclarada } from "@/lib/networkEntry";
import type { PostResultProblema } from "@/lib/postResultProblem";
import type { ProblemaPercebido } from "@/lib/problemEntry";
import type { RetestComparison } from "@/lib/retestComparison";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { persistRetestComparison, retestComparisonId } from "@/lib/speedTestJourneyComparison";
import { persistRestorableSpeedTestResult, readRestorableSpeedTestResult } from "@/lib/speedTestJourneySession";
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
  const [resultadoRestaurado, setResultadoRestaurado] = useState(false);
  const comparacaoPersistida = useRef<string | null>(null);
  const { phase, liveValue, phaseResults, result, measurementContext, cancelTest, retry, forceStart, restaurarResultadoAnterior, injectResult } =
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
  const shouldCollectContextualQuestions = isResult && measurementContext?.entry === "problem";
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
    setRespostasContextuais(readMeasurementSession()?.answers ?? []);
  }, []);

  useEffect(() => {
    if (!retesteBase || !result || retesteBase.id === result.id) return;
    const comparisonId = `${retesteBase.id}:${result.id}`;
    void persistRetestComparison(retesteBase, result, comparacaoPersistida.current)
      .then(({ comparison, persisted }) => {
        if (comparison) setComparacaoReteste(comparison);
        if (persisted) comparacaoPersistida.current = retestComparisonId(retesteBase, result);
      })
      .catch(() => {
        setComparacaoReteste(null);
        if (comparacaoPersistida.current !== comparisonId) setComparacaoNaoSalva(true);
      });
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

  const iniciarTesteDireto = (contextualProblem?: ProblemaPercebido) => {
    resetarProblemaPosResultado();
    setResultadoRestaurado(false);
    setEmAprofundamentoPosResultado(false);
    setNotaAprofundamentoCancelado(false);
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
    setRetesteBase(result);
    setComparacaoReteste(null);
    setComparacaoNaoSalva(false);
    resetarProblemaPosResultado();
    setResultadoRestaurado(false);
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
    setResultadoRestaurado(false);
    setEmAprofundamentoPosResultado(true);
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

  const autoStartDisparado = useRef(false);
  const [isAutoStarting, setIsAutoStarting] = useState(true);

  /**
   * Entrada na rota (protótipo, tela 1.1): não existe tela ociosa.
   *
   * - Com resultado restaurável na sessão: restaura e **não** mede de novo.
   * - Sem resultado restaurável: o velocímetro se forma e o teste rápido
   *   começa sozinho — inclusive quando a pessoa chega de uma rota editorial
   *   com `?problem=`, caso em que o problema declarado lá vira o contexto da
   *   medição.
   *
   * Não há guarda de "já autostartou nesta sessão": cancelar leva ao estado de
   * falha (com "Tentar novamente" explícito) e concluir deixa um resultado
   * restaurável, então nenhum caminho volta a `idle` e cria laço de medição.
   */
  useEffect(() => {
    if (!isIdle || autoStartDisparado.current) {
      if (isIdle && isAutoStarting) setIsAutoStarting(false);
      return;
    }
    autoStartDisparado.current = true;

    const storedFullResult = readRestorableSpeedTestResult();
    if (storedFullResult) {
      setIsAutoStarting(false);
      setResultadoRestaurado(true);
      setModo(storedFullResult.mode === "rapido" ? "rapido" : "completo");
      setTimeout(() => injectResult(storedFullResult), 0);
      return;
    }

    const contextualProblem = contextualProblemFromSearch(window.location.search);
    if (contextualProblem) window.history.replaceState(null, "", window.location.pathname);
    setTimeout(() => {
      iniciarTesteDireto(contextualProblem ?? undefined);
      setIsAutoStarting(false);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIdle]);

  useEffect(() => {
    if (result && result.status === "complete") persistRestorableSpeedTestResult(result);
  }, [result]);

  const visualState = deriveSpeedTestVisualState({
    phase,
    mode: modo,
    result,
    liveValue,
    phaseResults,
    measurementContext,
    isAutoStarting,
    restoredResult: resultadoRestaurado,
    deepeningAfterQuickResult: emAprofundamentoPosResultado,
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
    emAprofundamentoPosResultado, notaAprofundamentoCancelado,
    erroDuranteAprofundamento, downloadMudouNoAprofundamento, iniciarAprofundamento,
    abrirSheetDiagnostico, fecharSheetDiagnostico, declararRede, confirmarDiagnostico,
    iniciarTesteDireto, iniciarReteste,
    cancelTest, retry, compartilhar, copiarResumo,
  };
}
