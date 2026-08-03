"use client";

import { useEffect, useState } from "react";
import { resolveContextualQuestions, type ContextualAnswer, type ContextualQuestionFlowState } from "@/lib/contextualQuestionFlow";
import type { MeasurementSessionContext } from "@/lib/measurementSessionContext";
import { readMeasurementSession, savePostResultAnswers, savePostResultProblem } from "@/lib/measurementSessionStore";
import {
  buildPostResultMeasurementContext,
  postResultInitialAnswers,
  type PostResultProblema,
} from "@/lib/postResultProblem";
import type { SpeedTestResult } from "@/lib/speedEngine";
import {
  FEATURE_SPEEDTEST_RESULTADO_APROFUNDAMENTO_INICIADO,
  FEATURE_SPEEDTEST_RESULTADO_PROBLEMA_SELECIONADO,
  FEATURE_SPEEDTEST_RESULTADO_SEM_PROBLEMA,
  trackFeatureUsed,
} from "@/lib/telemetry";
import { createWebDiagnosticResponse, type WebDiagnosticResponse } from "@/lib/webDiagnosticResponse";

/**
 * Estado, telemetria e persistência da pergunta pós-resultado (#69):
 * "Você está tendo algum problema agora?" e o aprofundamento contextual que
 * ela dispara. Extraído de `useSpeedTestJourney` (arquitetura acima do limite
 * de ~150-200 linhas do gate `architecture-guardrails`) para manter uma única
 * responsabilidade por hook.
 *
 * Também resolve o motivo/próxima ação do aprofundamento concluído
 * (`respostaDiagnosticaPosResultado`): antes desta correção (#69), o único
 * lugar que exibia conclusion/nextAction era `CompleteDiagnosis`, que fica
 * desligado no modo Rápido — a pessoa nunca via o motivo nem a próxima ação
 * depois de responder o aprofundamento. Usa sempre o contexto/respostas
 * pós-resultado, nunca o contexto pré-teste (esse caminho é
 * `respostaDiagnostica`, calculado separadamente em `useSpeedTestJourney`).
 */
export function usePostResultProblem(result: SpeedTestResult | null) {
  const [postResultProblem, setPostResultProblemState] = useState<PostResultProblema | null>(
    () => readMeasurementSession()?.postResultProblem?.value ?? null
  );
  const [postResultAnswers, setPostResultAnswersState] = useState<ContextualAnswer[]>(
    () => readMeasurementSession()?.postResultProblem?.answers ?? []
  );

  useEffect(() => {
    const session = readMeasurementSession();
    setPostResultProblemState(session?.postResultProblem?.value ?? null);
    setPostResultAnswersState(session?.postResultProblem?.answers ?? []);
  }, []);

  // Nova rodada de teste: `beginMeasurementSession` já limpa `postResultProblem`
  // na sessão persistida; sincroniza o estado local para não exibir a escolha
  // de uma medição anterior sobre um resultado novo.
  function resetarProblemaPosResultado() {
    setPostResultProblemState(null);
    setPostResultAnswersState([]);
  }

  const selecionarProblemaPosResultado = (valor: PostResultProblema) => {
    setPostResultProblemState(valor);
    if (valor === "sem-problema") {
      setPostResultAnswersState([]);
      savePostResultProblem(valor, []);
      trackFeatureUsed(FEATURE_SPEEDTEST_RESULTADO_SEM_PROBLEMA);
      return;
    }
    const initialAnswers = postResultInitialAnswers(valor);
    setPostResultAnswersState(initialAnswers);
    savePostResultProblem(valor, initialAnswers);
    trackFeatureUsed(FEATURE_SPEEDTEST_RESULTADO_PROBLEMA_SELECIONADO);
    trackFeatureUsed(FEATURE_SPEEDTEST_RESULTADO_APROFUNDAMENTO_INICIADO);
  };

  const atualizarRespostasPosResultado = (answers: ContextualAnswer[]) => {
    setPostResultAnswersState(answers);
    savePostResultAnswers(answers);
  };

  const postResultMeasurementContext: MeasurementSessionContext | null = postResultProblem
    ? buildPostResultMeasurementContext(postResultProblem)
    : null;

  const isProblemChoice = postResultProblem !== null && postResultProblem !== "sem-problema";
  const postResultFlowState: ContextualQuestionFlowState | null = isProblemChoice
    ? resolveContextualQuestions(postResultMeasurementContext, postResultAnswers)
    : null;

  const respostaDiagnosticaPosResultado: WebDiagnosticResponse | null =
    result && postResultFlowState?.status === "concluded"
      ? createWebDiagnosticResponse(result, postResultMeasurementContext, postResultAnswers)
      : null;

  return {
    postResultProblem,
    postResultAnswers,
    postResultMeasurementContext,
    postResultFlowState,
    respostaDiagnosticaPosResultado,
    selecionarProblemaPosResultado,
    atualizarRespostasPosResultado,
    resetarProblemaPosResultado,
  };
}
