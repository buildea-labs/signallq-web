import { describe, expect, it } from "vitest";
import { adaptRecordForResultView } from "./historyResultView";
import type { MedicaoRegistro } from "./measurementRepository";

/**
 * Mapper puro do #74: adapta `MedicaoRegistro` para o subconjunto que
 * `UseCaseSummary`/`ResultTechnicalDetails` leem, sem inventar campos que o
 * Histórico nunca gravou.
 */
function record(overrides: Partial<MedicaoRegistro> = {}): MedicaoRegistro {
  return {
    id: "r1",
    timestamp: 1_700_000_000_000,
    download: 87.3,
    upload: 12.6,
    latency: 18.4,
    jitter: 3.2,
    connectionType: null,
    connectionKind: "wifi",
    server: "Cloudflare",
    mode: "completo",
    ...overrides,
  };
}

describe("adaptRecordForResultView", () => {
  it("mapeia as métricas medidas diretamente", () => {
    const view = adaptRecordForResultView(record());
    expect(view.download.mbps).toBe(87.3);
    expect(view.upload.mbps).toBe(12.6);
    expect(view.latency.ms).toBe(18.4);
    expect(view.jitter).toEqual({ ms: 3.2 });
    expect(view.server).toBe("Cloudflare");
    expect(view.timestamp).toBe(1_700_000_000_000);
  });

  it("mapeia jitter null como null, nunca 0", () => {
    expect(adaptRecordForResultView(record({ jitter: null })).jitter).toBeNull();
  });

  it("nunca fabrica duração nem latência de DNS (ausência permanente de schema)", () => {
    const view = adaptRecordForResultView(record());
    expect(view.durationMs).toBeUndefined();
    expect(view.dns).toEqual({ latencyMs: null });
  });

  it("nunca fabrica status: fica ausente para todo registro do Histórico", () => {
    expect(adaptRecordForResultView(record()).status).toBeUndefined();
  });

  it("omite bufferbloat quando bufferbloatMs não foi salvo", () => {
    expect(adaptRecordForResultView(record()).bufferbloat).toBeUndefined();
  });

  it("reclassifica a severidade do bufferbloat a partir do ms salvo, sem novo corte", () => {
    const leve = adaptRecordForResultView(record({ bufferbloatMs: 8 }));
    expect(leve.bufferbloat).toEqual({ ms: 8, severity: "mild" });

    const severo = adaptRecordForResultView(record({ bufferbloatMs: 500 }));
    expect(severo.bufferbloat?.severity).toBe("severe");
  });

  it("omite stabilityScore quando ausente, nunca mostra 0 fabricado", () => {
    expect(adaptRecordForResultView(record()).stabilityScore).toBeUndefined();
    expect(adaptRecordForResultView(record({ stabilityScore: 82 })).stabilityScore).toBe(82);
  });

  it("preserva mode ausente (registro legado), sem inventar 'rapido'", () => {
    expect(adaptRecordForResultView(record({ mode: undefined })).mode).toBeUndefined();
  });

  it("sinaliza presença de perda de pacotes via validSamples sintético (0/1), sem inventar contagem real", () => {
    expect(adaptRecordForResultView(record()).latency.validSamples).toBe(0);
    const withLoss = adaptRecordForResultView(record({ packetLossPercent: 0 }));
    expect(withLoss.latency.validSamples).toBe(1);
    expect(withLoss.packetLoss.percent).toBe(0);
  });
});
