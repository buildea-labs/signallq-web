import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { withDerivedJourneyState } from "@/test/fixtures/speedTestJourney";
import type { NetworkInfo } from "@/hooks/useNetworkInfo";
import type { SpeedTestResult } from "@/lib/speedEngine";

/**
 * Cobertura de componente da claim estrutural de #71 (§3.1/§3.4.8): a linha
 * de ISP/Região só é exibida quando ambos os valores são conhecidos —
 * "Desconhecido" é ruído para quem não pediu essa informação. Falha de rede,
 * carregamento em andamento ou dado parcial devem omitir a linha inteira,
 * nunca preenchê-la com um placeholder.
 *
 * A linha acompanha o mostrador (resultado rápido/restaurado). No resultado
 * completo o velocímetro sai de cena e a origem da medição passa a viver em
 * "Ver detalhes da medição", como na tela 2.4 do protótipo — por isso a
 * jornada destes testes é a do modo Rápido.
 */

const networkInfoMock = vi.fn<() => NetworkInfo>();
vi.mock("@/hooks/useNetworkInfo", () => ({
  useNetworkInfo: () => networkInfoMock(),
}));

vi.mock("@/components/Velocimetro", () => ({
  Velocimetro: ({ children }: { children?: ReactNode }) => <div data-testid="velocimetro">{children}</div>,
}));

function buildResult(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    id: "medicao-isp-1",
    timestamp: Date.now(),
    mode: "rapido",
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
  return withDerivedJourneyState({
    phase: "concluido",
    liveValue: 0,
    result,
    isIdle: false,
    isRunning: false,
    isProblem: false,
    isResult: true,
    isAutoStarting: false,
    terminalOutcome: "complete",
    modo: "rapido",
    iniciarTesteDireto: vi.fn(),
    ...overrides,
  });
}

async function renderQuickResult(journey: SpeedTestJourney) {
  const { QuickResult } = await import("./QuickResult");
  return render(<QuickResult journey={journey} />);
}

describe("QuickResult — linha ISP/Região condicionada (#71 §3.1/§3.4.8)", () => {
  beforeEach(() => {
    networkInfoMock.mockReset();
  });

  afterEach(() => cleanup());

  it("mostra ISP e Região quando ambos os valores são conhecidos", async () => {
    networkInfoMock.mockReturnValue({ isp: "Provedor Exemplo", region: "Cidade Exemplo, UF", loading: false });
    await renderQuickResult(buildJourney());
    expect(screen.getByText("Provedor Exemplo")).toBeInTheDocument();
    expect(screen.getByText("Cidade Exemplo, UF")).toBeInTheDocument();
  });

  it("omite a linha inteira quando ainda está carregando", async () => {
    networkInfoMock.mockReturnValue({ isp: null, region: null, loading: true });
    await renderQuickResult(buildJourney());
    expect(screen.queryByText("Provedor Exemplo")).not.toBeInTheDocument();
  });

  it("omite a linha inteira quando ISP e Região falharam (nunca mostra placeholder 'Desconhecido')", async () => {
    networkInfoMock.mockReturnValue({ isp: null, region: null, loading: false });
    await renderQuickResult(buildJourney());
    expect(screen.queryByText("Desconhecido", { exact: false })).not.toBeInTheDocument();
  });

  it("omite a linha quando só um dos dois valores é conhecido", async () => {
    networkInfoMock.mockReturnValue({ isp: "Provedor Exemplo", region: null, loading: false });
    await renderQuickResult(buildJourney());
    expect(screen.queryByText("Provedor Exemplo")).not.toBeInTheDocument();
  });
});
