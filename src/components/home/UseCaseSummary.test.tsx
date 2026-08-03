import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { UseCaseSummary } from "./UseCaseSummary";

/**
 * Cobertura de componente da claim estrutural de #71 (§3.1): o selo de
 * status só aparece aqui quando a medição é "complete" — para os demais
 * status, a barra de aviso de `CompleteDiagnosis` já é a fonte única, então
 * `UseCaseSummary` não deve duplicar o dado.
 */

function buildResult(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    id: "medicao-1",
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

describe("UseCaseSummary — ausência de duplicação do selo de status (#71 §3.1)", () => {
  afterEach(() => cleanup());

  it("exibe o selo de status quando a medição está completa", () => {
    render(<UseCaseSummary result={buildResult({ status: "complete" })} />);
    expect(screen.getByText("check_circle")).toBeInTheDocument();
    expect(screen.getByText("Completo")).toBeInTheDocument();
  });

  it("omite o selo de status quando a medição não está completa, para não duplicar a barra de CompleteDiagnosis", () => {
    render(<UseCaseSummary result={buildResult({ status: "partial" })} />);
    expect(screen.queryByText("check_circle")).not.toBeInTheDocument();
    expect(screen.queryByText("Completo")).not.toBeInTheDocument();

    // A leitura por caso de uso continua presente independentemente do selo.
    expect(screen.getByText("Navegação")).toBeInTheDocument();
    expect(screen.getByText("Streaming")).toBeInTheDocument();
  });
});
