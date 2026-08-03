import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { CompleteDiagnosis } from "./CompleteDiagnosis";

/**
 * Cobertura de componente da claim estrutural de #71 (§3.1): "hierarquia
 * única de conclusão" — CompleteDiagnosis deve ser a única fonte da
 * conclusão/impacto/próxima ação do resultado, exibida como um único h1,
 * nunca duplicada por um segundo bloco de status.
 */

function buildResult(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    id: "medicao-completa-1",
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

function buildJourney(overrides: Partial<SpeedTestJourney> = {}): SpeedTestJourney {
  const result = overrides.result === undefined ? buildResult() : overrides.result;
  return {
    modo: "completo",
    hasVisibleResult: true,
    result,
    respostaDiagnostica: result
      ? {
          conclusion: "Sua conexão está estável para os principais usos.",
          impact: "Navegação, streaming e chamadas devem funcionar sem oscilação perceptível.",
          nextAction: "Nenhuma ação necessária agora.",
          confidence: "alta",
          version: 1,
        }
      : null,
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
    ...overrides,
  } as unknown as SpeedTestJourney;
}

describe("CompleteDiagnosis — hierarquia única de conclusão (#71 §3.1)", () => {
  afterEach(() => cleanup());

  it("mostra a conclusão como único heading e a próxima ação uma única vez, sem barra de status quando a medição está completa", () => {
    render(<CompleteDiagnosis journey={buildJourney()} />);

    const headings = screen.getAllByRole("heading");
    const h1s = headings.filter((node) => node.tagName === "H1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Sua conexão está estável para os principais usos.");

    expect(screen.getAllByText("Próxima ação")).toHaveLength(1);

    // Status "complete" não tem STATUS_MESSAGE associada: nenhuma barra de
    // aviso duplicando o que o h1 já concluiu.
    expect(screen.queryByText("warning", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText(/Completo\./)).not.toBeInTheDocument();
  });

  it("mantém uma única fonte de conclusão mesmo quando a barra de status de atenção aparece (resultado parcial)", () => {
    const journey = buildJourney({ result: buildResult({ status: "partial" }) });
    render(<CompleteDiagnosis journey={journey} />);

    // A barra de status existe (prosa, não heading) e o h1 de conclusão
    // continua sendo o único heading de nível 1 da tela.
    expect(screen.getByText(/Alguma fase não terminou/)).toBeInTheDocument();
    const h1s = screen.getAllByRole("heading").filter((node) => node.tagName === "H1");
    expect(h1s).toHaveLength(1);
  });

  it("não renderiza nada no modo rápido (evita segunda instância de CompleteDiagnosis fora do modo Completo)", () => {
    const { container } = render(<CompleteDiagnosis journey={buildJourney({ modo: "rapido" })} />);
    expect(container).toBeEmptyDOMElement();
  });
});
