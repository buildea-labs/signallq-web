import { describe, expect, it } from "vitest";
import { SPEEDOMETER_ERROR, SPEEDOMETER_OUTCOME, SPEEDOMETER_PHASE } from "./speedometerIdentity";

describe("speedometer identity", () => {
  it("keeps the Android phase labels, narratives, and semantic tokens", () => {
    expect(SPEEDOMETER_PHASE.latencia).toEqual({ label: "LATÊNCIA", narrative: "Verificando a resposta do servidor…", color: "var(--phase-latencia)" });
    expect(SPEEDOMETER_PHASE.download.narrative).toBe("Medindo a velocidade de download…");
    expect(SPEEDOMETER_PHASE.upload.color).toBe("var(--phase-upload)");
  });

  it("gives every terminal outcome distinct copy and a non-success state token", () => {
    expect(SPEEDOMETER_OUTCOME.complete.label).toBe("Completo");
    expect(SPEEDOMETER_OUTCOME.partial.color).toBe("var(--warning)");
    expect(SPEEDOMETER_OUTCOME.inconclusive.label).toBe("Inconclusivo");
    expect(SPEEDOMETER_OUTCOME.contaminated.color).toBe("var(--warning)");
    expect(SPEEDOMETER_OUTCOME.cancelled.color).toBe("var(--text-secondary)");
    expect(SPEEDOMETER_ERROR.color).toBe("var(--error)");
  });
});
