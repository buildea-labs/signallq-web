import { describe, expect, it } from "vitest";

import type { SpeedTestResult } from "../../lib/speedEngine";
import { buildTechnicalDetailGroups } from "./resultTechnicalDetailsRows";

function baseResult(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    id: "r1",
    timestamp: 1_700_000_000_000,
    mode: "completo",
    status: "complete",
    download: { mbps: 87.3, peakMbps: 95 },
    upload: { mbps: 12.6, peakMbps: 14 },
    latency: { ms: 18.4, samples: 20, validSamples: 20, timeouts: 0, maxMs: 30, p95Ms: 25, peaks: 0 },
    jitter: { ms: 3.2 },
    packetLoss: { percent: 0 },
    loadedLatency: { downloadMs: 22, uploadMs: 19 },
    bufferbloat: { ms: 8.4, severity: "mild" },
    stabilityScore: 96,
    dns: { latencyMs: 14, resolverIp: "1.1.1.1", provider: "cloudflare" },
    connectionType: null,
    server: "Borda Cloudflare (roteamento automático)",
    durationMs: 42_000,
    partial: false,
    ...overrides,
  };
}

function findRow(groups: ReturnType<typeof buildTechnicalDetailGroups>, id: string) {
  return groups.flatMap((g) => g.rows).find((r) => r.id === id);
}

describe("buildTechnicalDetailGroups", () => {
  it("returns exactly 3 groups with the required titles", () => {
    const groups = buildTechnicalDetailGroups(baseResult());
    expect(groups.map((g) => g.title)).toEqual(["Velocidade", "Resposta da conexão", "Sobre o teste"]);
  });

  it("omits Upload in modo rápido, never by numeric value", () => {
    const rapido = buildTechnicalDetailGroups(baseResult({ mode: "rapido", upload: { mbps: 0, peakMbps: 0 } }));
    expect(findRow(rapido, "upload")).toBeUndefined();

    // Upload real igual a zero em modo Completo é dado válido: deve aparecer.
    const completo = buildTechnicalDetailGroups(baseResult({ mode: "completo", upload: { mbps: 0, peakMbps: 0 } }));
    expect(findRow(completo, "upload")?.value).toBe("0.0 Mbps");
  });

  it("omits jitter row entirely when jitter is null, not as 0 or dash", () => {
    const groups = buildTechnicalDetailGroups(baseResult({ jitter: null }));
    expect(findRow(groups, "jitter")).toBeUndefined();
  });

  it("shows perda de pacotes at 0% when there are valid latency samples", () => {
    const groups = buildTechnicalDetailGroups(baseResult({ packetLoss: { percent: 0 }, latency: { ms: 18, samples: 20, validSamples: 20, timeouts: 0, maxMs: 30, p95Ms: 25, peaks: 0 } }));
    expect(findRow(groups, "perdaDePacotes")?.value).toBe("0.0%");
  });

  it("omits perda de pacotes when there are no valid latency samples", () => {
    const groups = buildTechnicalDetailGroups(baseResult({ latency: { ms: 18, samples: 20, validSamples: 0, timeouts: 20, maxMs: 30, p95Ms: 25, peaks: 0 } }));
    expect(findRow(groups, "perdaDePacotes")).toBeUndefined();
  });

  it("omits DNS row when latencyMs is null", () => {
    const groups = buildTechnicalDetailGroups(baseResult({ dns: { latencyMs: null, resolverIp: null, provider: null } }));
    expect(findRow(groups, "dns")).toBeUndefined();
  });

  it("omits duração row when durationMs is undefined", () => {
    const groups = buildTechnicalDetailGroups(baseResult({ durationMs: undefined }));
    expect(findRow(groups, "duracao")).toBeUndefined();
  });

  it("classifies estabilidade in Alta/Média/Baixa using the same cuts as before", () => {
    expect(findRow(buildTechnicalDetailGroups(baseResult({ stabilityScore: 95 })), "estabilidade")?.value).toBe("95% · Alta");
    expect(findRow(buildTechnicalDetailGroups(baseResult({ stabilityScore: 80 })), "estabilidade")?.value).toBe("80% · Média");
    expect(findRow(buildTechnicalDetailGroups(baseResult({ stabilityScore: 40 })), "estabilidade")?.value).toBe("40% · Baixa");
  });

  it("labels 'Latência sob carga' (not the jargon 'Bufferbloat') with its severity", () => {
    const row = findRow(buildTechnicalDetailGroups(baseResult()), "latenciaSobCarga");
    expect(row?.label).toBe("Latência sob carga");
    expect(row?.value).toBe("8.4 ms · Leve");
  });

  it("labels 'Servidor' (not 'Infraestrutura') and 'Resolução DNS' (not 'DNS (DoH)')", () => {
    const groups = buildTechnicalDetailGroups(baseResult());
    expect(findRow(groups, "servidor")?.label).toBe("Servidor");
    expect(findRow(groups, "dns")?.label).toBe("Resolução DNS");
  });

  it("renders a safe label for mode 'triplo' even though the current journey never produces it", () => {
    const groups = buildTechnicalDetailGroups(baseResult({ mode: "triplo" }));
    expect(findRow(groups, "modo")?.value).toBe("Completo (3 rodadas)");
  });

  it("attaches help text only to Jitter, Latência sob carga, Estabilidade and Resolução DNS", () => {
    const groups = buildTechnicalDetailGroups(baseResult());
    const withHelp = groups.flatMap((g) => g.rows).filter((r) => r.help).map((r) => r.id).sort();
    expect(withHelp).toEqual(["dns", "estabilidade", "jitter", "latenciaSobCarga"].sort());
  });
});
