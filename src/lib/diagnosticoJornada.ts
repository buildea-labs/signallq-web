export type DiagnosticoEstadoNome =
  | "inicio_automatico"
  | "resultado_rapido"
  | "teste_completo"
  | "resultado_completo";

export interface DiagnosticoEstado {
  nome: DiagnosticoEstadoNome;
  temDiagnostico: boolean;
}

export type DiagnosticoAcao =
  | { tipo: "resultado_rapido_pronto" }
  | { tipo: "iniciar_teste_completo" }
  | { tipo: "teste_completo_pronto"; temDiagnostico: boolean }
  | { tipo: "reiniciar" };

export const ESTADO_INICIAL: DiagnosticoEstado = {
  nome: "inicio_automatico",
  temDiagnostico: false,
};

export function diagnosticoReducer(estado: DiagnosticoEstado, acao: DiagnosticoAcao): DiagnosticoEstado {
  switch (acao.tipo) {
    case "resultado_rapido_pronto":
      return { ...estado, nome: "resultado_rapido" };
    case "iniciar_teste_completo":
      return { ...estado, nome: "teste_completo" };
    case "teste_completo_pronto":
      return { nome: "resultado_completo", temDiagnostico: acao.temDiagnostico };
    case "reiniciar":
      return ESTADO_INICIAL;
    default:
      return estado;
  }
}
