import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { CompleteDiagnosis } from "./CompleteDiagnosis";

/**
 * Composição real da tela de resultado no modo Completo: desde a
 * implementação do protótipo, o diagnóstico lidera a tela e `UseCaseSummary`
 * passou a viver dentro de `CompleteDiagnosis`, logo abaixo das métricas —
 * antes era irmão dele sob `HomeClient`, via `QuickResult`.
 *
 * Renderizar `CompleteDiagnosis` sozinho é, portanto, a tela inteira do
 * resultado completo: basta ela para provar que o rótulo de status aparece
 * exatamente uma vez no total — nunca duas — para qualquer status (#71 §3.1).
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
  return render(<CompleteDiagnosis journey={buildJourney(result)} />);
}

describe("Tela de resultado (Completo) — selo de status sem duplicação (#71 §3.1)", () => {
  afterEach(() => cleanup());

  function countStatusLabel(container: HTMLElement, label: string): number {
    return (container.textContent ?? "").split(label).length - 1;
  }

  // Desde a implementação da tela 2.4, o selo de status vive dentro de
  // "Ver detalhes da medição" (junto de `UseCaseSummary`), porque o protótipo
  // não tem selo nem cartão na tela principal. A claim de não-duplicação
  // continua valendo: uma ocorrência no total, venha ela de onde vier.
  it("status complete: um único selo de status, e dentro do bloco de detalhes", () => {
    const { container } = renderResultScreen(buildResult({ status: "complete" }));

    // O selo é o par ícone + rótulo; "Completo" também aparece como dado
    // técnico ("Modo: Completo"), que não é uma segunda instância do selo.
    expect(screen.getAllByText("check_circle")).toHaveLength(1);

    // O selo vive dentro do bloco de detalhes, não na tela principal (2.4).
    const detalhes = container.querySelector("details");
    expect(detalhes?.contains(screen.getByText("check_circle"))).toBe(true);
  });

  it("status partial: o rótulo aparece uma única vez, na barra de aviso fora dos detalhes", () => {
    const { container } = renderResultScreen(buildResult({ status: "partial" }));
    expect(countStatusLabel(container, "Parcial")).toBe(1);
    expect(container.querySelector("details")?.textContent).not.toContain("Parcial");
    // O selo dedicado (ícone + "•" + horário) não existe para este status.
    expect(screen.queryByText("check_circle")).not.toBeInTheDocument();
  });
});
