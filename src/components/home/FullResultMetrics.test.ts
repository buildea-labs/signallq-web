import { describe, expect, it } from "vitest";
import { createSpeedTestResultFixture } from "@/test/fixtures/speedTestResults";
import { buildFullResultMetrics } from "./FullResultMetrics";

/**
 * Hierarquia de métricas da tela 2.4 do protótipo: download e upload lideram;
 * a segunda linha traz a leitura de latência. Quando o motor não produziu
 * latência sob carga nesta rodada, o jitter ocupa o lugar — nunca um campo
 * vazio nem um valor de outra rodada.
 */
describe("métricas do resultado completo", () => {
  it("destaca download e upload e traz ping/latência sob carga em seguida", () => {
    const { primary, secondary } = buildFullResultMetrics(
      createSpeedTestResultFixture({
        download: { mbps: 479.6, peakMbps: 500 },
        upload: { mbps: 210.4, peakMbps: 220 },
        latency: { ms: 11, samples: 10, validSamples: 10, timeouts: 0, maxMs: 20, p95Ms: 15, peaks: 0 },
        loadedLatency: { downloadMs: 86, uploadMs: 40 },
      })
    );

    expect(primary.map((metric) => [metric.label, metric.value, metric.unit])).toEqual([
      ["Download", "480", "Mbps"],
      ["Upload", "210", "Mbps"],
    ]);
    expect(secondary.map((metric) => [metric.label, metric.value])).toEqual([
      ["Ping", "11"],
      ["Sob carga", "86"],
    ]);
  });

  it("usa a pior das duas latências sob carga, não a média", () => {
    const { secondary } = buildFullResultMetrics(
      createSpeedTestResultFixture({ loadedLatency: { downloadMs: 40, uploadMs: 120 } })
    );
    expect(secondary[1]).toMatchObject({ label: "Sob carga", value: "120" });
  });

  it("cai para jitter quando não houve latência sob carga na rodada", () => {
    // `createSpeedTestResultFixture` normaliza `null` para o padrão da
    // fixture; a ausência precisa ser montada aqui, sobre o resultado pronto.
    const { secondary } = buildFullResultMetrics({
      ...createSpeedTestResultFixture(),
      loadedLatency: null,
      jitter: { ms: 3.4 },
    });
    expect(secondary[1]).toMatchObject({ label: "Jitter", value: "3", unit: "ms" });
  });

  it("não inventa jitter quando o motor não mediu nenhum dos dois", () => {
    const { secondary } = buildFullResultMetrics({
      ...createSpeedTestResultFixture(),
      loadedLatency: null,
      jitter: null,
    });
    expect(secondary[1]).toMatchObject({ label: "Jitter", value: "—", unit: "" });
  });
});
