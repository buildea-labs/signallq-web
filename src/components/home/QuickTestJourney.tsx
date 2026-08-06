"use client";

import { AlertScreen, type AlertScreenAction } from "@/components/speedtest/AlertScreen";
import { DiagnoseSheet } from "@/components/speedtest/DiagnoseSheet";
import type { ProblemPhase } from "@/hooks/useSpeedTest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { QuickResult } from "./QuickResult";
import { TestRunning } from "./TestRunning";
import { PROBLEMAS } from "./problemStates";

/**
 * Jornada de Velocidade: formação, execução, resultado e falhas.
 *
 * Não há tela ociosa — o protótipo entra medindo (tela 1.1) e o único caminho
 * declarado para o teste completo é o sheet de diagnóstico sobre o resultado
 * rápido. Por isso não existem mais seletor de modo nem entrada por problema
 * antes da medição.
 */
export function QuickTestJourney({ journey }: { journey: SpeedTestJourney }) {
  const { phase, isRunning, layout, visualState, erroDuranteAprofundamento } = journey;
  const problema = journey.isProblem ? PROBLEMAS[phase as ProblemPhase] : null;

  const isAlert = visualState.state === "error" || visualState.state === "offline";
  const isPreparing = visualState.state === "forming";

  // Falha: o protótipo (tela 1.4) oferece duas saídas — medir de novo ou
  // investigar a conexão. "Verificar conexão" leva ao Ping, que mede o tempo
  // de resposta sem depender de banda. Offline (tela 1.5) tem uma só: não há
  // o que verificar sem internet.
  const alertActions: AlertScreenAction[] = problema
    ? [
        {
          label: problema.actionLabel,
          variant: "primary",
          onClick: erroDuranteAprofundamento ? journey.iniciarAprofundamento : () => journey.iniciarTesteDireto(),
        },
        ...(visualState.state === "error"
          ? [{ label: "Verificar conexão", variant: "secondary" as const, href: "/ping" }]
          : []),
      ]
    : [];

  return (
    <div
      className={`flex w-full flex-col items-center ${
        layout.stage === "stage" ? "justify-center gap-6 py-2" : "gap-6"
      }`}
    >
      {isAlert && problema ? (
        <AlertScreen
          icon={problema.icon}
          tone={problema.color === "var(--error)" ? "error" : "neutral"}
          title={problema.title}
          description={problema.message}
          actions={alertActions}
        >
          {/* Falha do aprofundamento pós-resultado (spec Juliana §4):
              reaproveita a mesma tela de erro, só acrescida de contexto. */}
          {erroDuranteAprofundamento && (
            <p className="m-0 max-w-[320px] text-[12px] leading-[1.45] text-[color:var(--text-secondary)]">
              Não foi possível concluir o teste completo agora. O resultado rápido acima continua disponível.
            </p>
          )}
        </AlertScreen>
      ) : (
        <>
          <QuickResult journey={journey} />

          {isPreparing && (
            <p
              className="m-0 text-center text-[13px] font-semibold leading-[1.4] text-[color:var(--text-secondary)]"
              role="status"
            >
              Preparando sua medição…
            </p>
          )}

          {isRunning && (
            <TestRunning
              phase={journey.phase}
              mode={journey.modo}
              measurementContext={journey.measurementContext}
              deepeningAfterQuickResult={journey.emAprofundamentoPosResultado}
              postResultProblem={journey.postResultProblem}
              onCancel={journey.cancelTest}
            />
          )}
        </>
      )}

      <DiagnoseSheet
        open={journey.sheetDiagnosticoAberto}
        network={journey.redeDeclarada}
        problem={journey.postResultProblem}
        flowState={journey.postResultFlowState}
        onSelectNetwork={journey.declararRede}
        onSelectProblem={journey.selecionarProblemaPosResultado}
        onAnswer={(questionId, answerId) =>
          journey.atualizarRespostasPosResultado([...journey.postResultAnswers, { questionId, answerId }])
        }
        onClose={journey.fecharSheetDiagnostico}
        onConfirm={journey.confirmarDiagnostico}
      />
    </div>
  );
}
