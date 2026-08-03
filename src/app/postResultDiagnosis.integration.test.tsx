import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Teste de INTEGRAÇÃO do bug de #69 (achado por Caio): antes desta correção,
 * concluir o aprofundamento pós-resultado só exibia "Respostas registradas
 * para esta medição." — nunca o motivo nem a próxima ação, porque
 * `CompleteDiagnosis` (único lugar que os exibia) fica desligado no modo
 * Rápido. Exercita a jornada real (resultado rápido -> "Está lenta" ->
 * responde o aprofundamento até concluir) através da árvore de componentes,
 * não da lógica pura isolada — é exatamente o tipo de teste que faltou e
 * permitiu o bug passar.
 */

vi.mock("@/hooks/useNetworkInfo", () => ({
  useNetworkInfo: () => ({ isp: null, region: null, loading: false }),
}));

vi.mock("@/lib/measurementRepository", () => ({
  updateRecordDiagnostic: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/comparisonRepository", () => ({
  addComparison: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/telemetry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/telemetry")>("@/lib/telemetry");
  return { ...actual, trackFeatureUsed: vi.fn(), trackScreenView: vi.fn() };
});

const fakeResult = {
  id: "medicao-teste-1",
  timestamp: Date.now(),
  mode: "rapido" as const,
  status: "complete" as const,
  download: { mbps: 100, peakMbps: 110 },
  upload: { mbps: 20, peakMbps: 22 },
  latency: { ms: 10, samples: 10, validSamples: 10, timeouts: 0, maxMs: 15, p95Ms: 12, peaks: 0 },
  jitter: { ms: 5 },
  packetLoss: { percent: 0 },
  loadedLatency: null,
  bufferbloat: { ms: 5, severity: "none" as const },
  stabilityScore: 100,
  dns: {} as never,
  connectionType: "wifi",
  server: "teste",
  partial: false,
};

vi.mock("@/hooks/useSpeedTest", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useSpeedTest")>("@/hooks/useSpeedTest");
  return {
    ...actual,
    useSpeedTest: () => ({
      phase: "concluido",
      liveValue: 0,
      phaseResults: {},
      result: fakeResult,
      measurementContext: { version: 1, entry: "direct" },
      cancelTest: vi.fn(),
      retry: vi.fn(),
      forceStart: vi.fn(),
    }),
  };
});

describe("aprofundamento pós-resultado exibe motivo e próxima ação (#69)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("mostra conclusão e próxima ação reais depois de concluir o aprofundamento, sem trocar para modo Completo", async () => {
    const user = userEvent.setup();
    const { HomeClient } = await import("./HomeClient");
    render(<HomeClient />);

    // Resultado rápido já visível (mock de useSpeedTest força fase "concluido").
    expect(await screen.findByText("Você está tendo algum problema agora?")).toBeInTheDocument();

    // Antes de concluir o aprofundamento, o bug nunca chegava a aparecer aqui.
    expect(screen.queryByTestId("post-result-diagnostico")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Está lenta" }));

    // Pergunta de aprofundamento gerada pela árvore contextual (`internet_lenta_q1`).
    expect(await screen.findByText("Quando a lentidão ocorre?")).toBeInTheDocument();

    // Resposta que conclui o aprofundamento em uma única pergunta.
    await user.click(screen.getByRole("button", { name: "Em horários específicos" }));

    const diagnostico = await screen.findByTestId("post-result-diagnostico");
    expect(diagnostico).toBeInTheDocument();

    // Bug corrigido: motivo real (não mais o texto fixo "Respostas registradas...").
    expect(
      screen.queryByText("Respostas registradas para esta medição.")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Próxima ação")).toBeInTheDocument();
    expect(diagnostico.textContent).toBeTruthy();
    expect(diagnostico.textContent!.length).toBeGreaterThan(0);

    // Regra de produto: aprofundamento pós-resultado não força troca de modo.
    expect(screen.getByRole("radio", { name: "Está lenta" })).toBeChecked();
  });
});
