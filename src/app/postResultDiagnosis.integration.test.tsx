import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Teste de INTEGRAÇÃO do caminho declarado do diagnóstico, sobre a jornada do
 * protótipo: do resultado rápido, o link "Problemas com a sua internet?" abre
 * o sheet (tela 2.1); dentro dele a pessoa declara rede e problema, responde a
 * pergunta de aprofundamento e confirma. Só então o teste completo roda.
 *
 * Duas regressões ficam travadas aqui:
 *
 * 1. O aprofundamento reexecuta a medição de verdade (`retry("completo")`) —
 *    antes, escolher um problema só mostrava perguntas contextuais sobre um
 *    resultado que continuava sendo só de download.
 * 2. A medição não começa sozinha por causa de uma resposta: antes, um efeito
 *    disparava o teste assim que o fluxo de perguntas concluía. Agora só o CTA
 *    "Diagnosticar minha internet" inicia.
 *
 * E a tela 2.4 é verificada no que o protótipo exige dela: uma única conclusão,
 * com a ação no mesmo bloco, e nenhum questionário reapresentado.
 *
 * `useSpeedTest` é mockado (fase estática "concluido", `retry` espiado) porque
 * este teste cobre a árvore de componentes/orquestração — o motor real e as
 * fases de execução são cobertos via Playwright (ver `e2e/`).
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
      injectResult: vi.fn(),
    }),
  };
});

describe("diagnóstico declarado pelo sheet, sobre o resultado rápido", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    retrySpy.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("declara rede e problema no sheet, confirma e só então reexecuta a medição em modo Completo", async () => {
    const user = userEvent.setup();
    const { HomeClient } = await import("./HomeClient");
    render(<HomeClient />);

    // Resultado rápido já visível (mock força fase "concluido"), sem
    // questionário na própria tela.
    const abrirSheet = await screen.findByRole("button", { name: /Problemas com a sua internet/ });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(abrirSheet);
    const sheet = screen.getByRole("dialog", { name: "Diagnosticar minha internet" });

    await user.click(screen.getByRole("radio", { name: "Wi-Fi" }));
    await user.click(screen.getByRole("radio", { name: "Está lenta" }));

    // Pergunta de aprofundamento gerada pela árvore contextual
    // (`internet_lenta_q1`), dentro do sheet — não na tela de resultado.
    expect(await screen.findByText("Quando a lentidão ocorre?")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Em horários específicos" }));

    // Responder não mede: só o CTA mede.
    expect(retrySpy).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Diagnosticar minha internet" })
    );
    expect(retrySpy).toHaveBeenCalledWith("completo");
    expect(sheet).not.toBeInTheDocument();

    // Tela 2.4: uma única conclusão, com "Próxima ação", e nenhum
    // questionário reapresentado.
    const diagnostico = await screen.findByTestId("post-result-diagnostico");
    expect(diagnostico.textContent).toBeTruthy();
    // Uma única conclusão, sem seção "Próxima ação" separada — o protótipo
    // (tela 2.4) traz diagnóstico e ação no mesmo bloco.
    expect(diagnostico.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.queryByText("Próxima ação")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Está lenta" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Testar novamente" })).toBeInTheDocument();
  });

  it("permite ir ao teste completo sem declarar nada, direto pelo CTA do resultado", async () => {
    const user = userEvent.setup();
    const { HomeClient } = await import("./HomeClient");
    render(<HomeClient />);

    await user.click(await screen.findByRole("button", { name: "Fazer teste completo" }));
    expect(retrySpy).toHaveBeenCalledWith("completo");
  });
});
