import { describe, expect, it } from "vitest";
import { ESTADO_INICIAL, diagnosticoReducer } from "./diagnosticoJornada";

describe("diagnosticoReducer", () => {
  it("começa em inicio_automatico", () => {
    expect(ESTADO_INICIAL.nome).toBe("inicio_automatico");
  });

  it("avança inicio_automatico -> resultado_rapido -> teste_completo -> resultado_completo", () => {
    let estado = ESTADO_INICIAL;
    estado = diagnosticoReducer(estado, { tipo: "resultado_rapido_pronto" });
    expect(estado.nome).toBe("resultado_rapido");

    estado = diagnosticoReducer(estado, { tipo: "iniciar_teste_completo" });
    expect(estado.nome).toBe("teste_completo");

    estado = diagnosticoReducer(estado, { tipo: "teste_completo_pronto", temDiagnostico: true });
    expect(estado.nome).toBe("resultado_completo");
    expect(estado.temDiagnostico).toBe(true);
  });

  it("reiniciar sempre volta ao estado inicial, mesmo a partir de resultado_completo", () => {
    const emResultadoCompleto = diagnosticoReducer(ESTADO_INICIAL, {
      tipo: "teste_completo_pronto",
      temDiagnostico: true,
    });
    expect(diagnosticoReducer(emResultadoCompleto, { tipo: "reiniciar" })).toEqual(ESTADO_INICIAL);
  });
});
