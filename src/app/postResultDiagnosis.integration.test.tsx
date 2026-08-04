import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Teste de INTEGRAÇÃO do bug crítico #1+#2 (diagnóstico não funciona de
 * verdade): antes desta correção, escolher um problema pós-resultado nunca
 * trocava de modo nem reexecutava o teste — só mostrava perguntas
 * contextuais sobre um resultado que continuava sendo só de download
 * (`{mbps:0,peakMbps:0}` fixo de upload no modo Rápido), e `CompleteDiagnosis`
 * ficava desligado o tempo todo (`modo === "rapido"`).
 *
 * Decisão de produto revertida: agora escolher um problema troca `modo` para
 * "completo" de verdade e reinicia o teste (`journey.iniciarAprofundamento`).
 * `useSpeedTest` é mockado aqui (fase estática "concluido", `retry` espiado)
 * porque este teste cobre a árvore de componentes/orquestração — o motor de
 * medição real e as fases de execução são cobertos via Playwright contra um
 * servidor real (ver `e2e/`).
 *
 * Cobre também a deduplicação: uma vez que `modo` vira "completo" de verdade,
 * `CompleteDiagnosis` deixa de retornar `null` e passaria a mostrar sua
 * própria conclusão genérica (`respostaDiagnostica`, sem o contexto
 * declarado) ao lado da conclusão específica de
 * `PostResultProblemPrompt`/`respostaDiagnosticaPosResultado` — duas seções
 * de "Próxima ação" na mesma tela. `CompleteDiagnosis` suprime a sua quando
 * há um aprofundamento pós-resultado ativo.
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

const retrySpy = vi.fn();

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
      retry: retrySpy,
      forceStart: vi.fn(),
      restaurarResultadoAnterior: vi.fn(),
    }),
  };
});

describe("aprofundamento pós-resultado exibe motivo e próxima ação (#69, bug crítico #1+#2)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    retrySpy.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("troca para modo Completo, reinicia o teste e mostra conclusão/próxima ação reais uma única vez, sem duplicar com CompleteDiagnosis", async () => {
    const user = userEvent.setup();
    const { HomeClient } = await import("./HomeClient");
    render(<HomeClient />);

    // Resultado rápido já visível (mock de useSpeedTest força fase "concluido").
    expect(await screen.findByText("Você está tendo algum problema agora?")).toBeInTheDocument();

    // Antes de concluir o aprofundamento, o bug nunca chegava a aparecer aqui.
    expect(screen.queryByTestId("post-result-diagnostico")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Está lenta" }));

    // Bug crítico #1+#2 corrigido: escolher um problema reinicia o teste de
    // verdade em modo Completo (não só mostra perguntas sobre o download antigo).
    expect(retrySpy).toHaveBeenCalledWith("completo");

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
    // Uma única "Próxima ação" na tela: `CompleteDiagnosis` (agora ligado,
    // porque `modo` é "completo" de verdade) suprime sua própria conclusão
    // genérica para não duplicar a conclusão específica já mostrada aqui.
    expect(screen.getByText("Próxima ação")).toBeInTheDocument();
    expect(diagnostico.textContent).toBeTruthy();
    expect(diagnostico.textContent!.length).toBeGreaterThan(0);

    // A escolha continua marcada, e o resto do resultado completo (detalhes
    // técnicos/reteste) também aparece na tela, porque `modo` de fato mudou.
    expect(screen.getByRole("radio", { name: "Está lenta" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Fazer e testar novamente" })).toBeInTheDocument();
  });
});
