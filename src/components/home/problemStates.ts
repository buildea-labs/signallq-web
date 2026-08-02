import type { ProblemPhase } from "@/hooks/useSpeedTest";

// Mapa de dados dos 6 estados de problema — 1:1 com `PROBLEMAS` de
// `ScreenHome.dc.html`, §7.1 do Guia de Implementação.
export const PROBLEMAS: Record<
  ProblemPhase,
  { icon: string; title: string; message: string; actionIcon: string; actionLabel: string; color: string }
> = {
  "sem-conexao": {
    icon: "wifi_off",
    title: "Sem conexão",
    message: "Não conseguimos detectar uma conexão com a internet neste aparelho.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--error)",
  },
  cancelado: {
    icon: "cancel",
    title: "Teste cancelado",
    message: "Você cancelou a medição antes do fim.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--text-secondary)",
  },
  "bloqueado-outra-aba": {
    icon: "tab",
    title: "Teste em andamento em outra aba",
    message:
      "Evitamos rodar duas medições ao mesmo tempo no mesmo navegador. Você pode iniciar mesmo assim, se preferir.",
    actionIcon: "play_arrow",
    actionLabel: "Iniciar mesmo assim",
    color: "var(--text-secondary)",
  },
  "conexao-interrompida": {
    icon: "sync_problem",
    title: "Conexão interrompida",
    message: "A conexão caiu no meio da medição e não foi possível concluir com confiança.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--error)",
  },
  "endpoint-indisponivel": {
    icon: "cloud_off",
    title: "Servidor indisponível",
    message: "Não foi possível contatar o servidor de medição agora. Tente novamente em instantes.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--error)",
  },
  "erro-inesperado": {
    icon: "error",
    title: "Erro inesperado",
    message: "Algo deu errado durante a medição.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--error)",
  },
};
