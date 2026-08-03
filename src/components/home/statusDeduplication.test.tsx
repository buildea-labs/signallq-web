import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { CompleteDiagnosis } from "./CompleteDiagnosis";
import { UseCaseSummary } from "./UseCaseSummary";

/**
 * Composição real da tela de resultado no modo Completo: `QuickResult`
 * (que renderiza `UseCaseSummary`) e `CompleteDiagnosis` são irmãos sob
 * `HomeClient`. Esta suíte renderiza os dois juntos, na mesma ordem da
 * página real, para provar que o rótulo de status aparece exatamente uma
 * vez no total — nunca duas vezes — para qualquer status (#71 §3.1).
 */

function buildResult(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    id: "medicao-dedupe-1",
    timestamp: Date.now(),
    mode: "completo",
    status: "complete",
    download: { mbps: 80, peakMbps: 90 },
    upload: { mbps: 15, peakMbps: 18 },
    latency: { ms: 20, samples: 10, validSamples: 10, timeouts: 0, maxMs: 30, p95Ms: 25, peaks: 0 },
    jitter: { ms: 4 },
    packetLoss: { percent: 0 },
    loadedLatency: null,
    bufferbloat: { ms: 10, severity: "none" },
    stabilityScore: 95,
    dns: {} as never,
    connectionType: "wifi",
    server: "teste",
    partial: false,
    ...overrides,
  };
}

function buildJourney(result: SpeedTestResult): SpeedTestJourney {
  return {
    modo: "completo",
    hasVisibleResult: true,
    result,
    respostaDiagnostica: {
      conclusion: "Conclusão de teste.",
      impact: "Impacto de teste.",
      nextAction: "Próxima ação de teste.",
      confidence: "alta",
      version: 1,
    },
    retesteBase: null,
    comparacaoReteste: null,
    comparacaoNaoSalva: false,
    shouldCollectContextualQuestions: false,
    measurementContext: null,
    setRespostasContextuais: vi.fn(),
    iniciarReteste: vi.fn(),
    retry: vi.fn(),
    compartilhar: vi.fn(),
    copiarResumo: vi.fn(),
    copiado: false,
  } as unknown as SpeedTestJourney;
}

function renderResultScreen(result: SpeedTestResult) {
  return render(
    <>
      <UseCaseSummary result={result} />
      <CompleteDiagnosis journey={buildJourney(result)} />
    </>
  );
}

describe("Tela de resultado (Completo) — selo de status sem duplicação (#71 §3.1)", () => {
  afterEach(() => cleanup());

  // Conta só as ocorrências do rótulo de status fora do bloco "Ver detalhes
  // do teste" (#70): a linha "Modo: Completo" ali é um dado técnico
  // incidental, não uma segunda instância do selo de status desta claim.
  function countStatusLabelOutsideDetails(container: HTMLElement, label: string): number {
    const detailsNode = container.querySelector("details");
    const detailsText = detailsNode?.textContent ?? "";
    const detailsOccurrences = detailsText.split(label).length - 1;
    const totalOccurrences = (container.textContent ?? "").split(label).length - 1;
    return totalOccurrences - detailsOccurrences;
  }

  it("status complete: o rótulo aparece uma única vez (selo em UseCaseSummary, sem barra em CompleteDiagnosis)", () => {
    const { container } = renderResultScreen(buildResult({ status: "complete" }));
    expect(countStatusLabelOutsideDetails(container, "Completo")).toBe(1);
  });

  it("status partial: o rótulo aparece uma única vez (sem selo em UseCaseSummary, barra em CompleteDiagnosis)", () => {
    const { container } = renderResultScreen(buildResult({ status: "partial" }));
    expect(countStatusLabelOutsideDetails(container, "Parcial")).toBe(1);
    // A ocorrência vem só da barra de CompleteDiagnosis: o selo dedicado de
    // UseCaseSummary (ícone + "•" + horário) não existe para este status.
    expect(screen.queryByText("check_circle")).not.toBeInTheDocument();
  });
});
