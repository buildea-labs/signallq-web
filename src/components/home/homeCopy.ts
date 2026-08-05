import type { Nivel } from "../../lib/classification";
import type { SpeedTestResult } from "../../lib/speedEngine";
import { SPEEDOMETER_OUTCOME } from "../../lib/speedometerIdentity";

export const MODOS = [
  { value: "rapido" as const, label: "Rápido" },
  { value: "completo" as const, label: "Completo" },
];

export const MODO_EXPLICACAO = {
  rapido: "Triagem curta: mede velocidade, latência e resposta sob carga para orientar o próximo passo.",
  completo: "Mais amostras e mais tempo sob carga: produz evidência mais estável para a avaliação oficial.",
} as const;

// Ferramentas exibidas abaixo do resultado (protótipo, seção "Ferramentas").
// O protótipo mostra quatro cartões — o quarto é "Ping", que não tem rota
// própria neste repositório e não pode ser criada nesta rodada; a grade
// responde ao número real de ferramentas em vez de reservar um espaço vazio.
export const DIAG_ITEMS = [
  { icon: "dns", label: "DNS", description: "Resolução de domínio", href: "/dns" },
  { icon: "sports_esports", label: "Jogos", description: "Portas para jogos", href: "/jogos" },
  { icon: "language", label: "Meu IP", description: "Endereço público", href: "/meu-ip" },
];

// Cor por nível de classificação — mesmo vocabulário de 3 valores
// (Boa/Aceitável/Ruim) já em produção no app Android, ver `lib/classification.ts`.
export const NIVEL_COR: Record<Nivel, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  error: "var(--error)",
  indisponivel: "var(--text-tertiary)",
};

export const USE_CASE_ICONS = {
  navegacao: "travel_explore",
  streaming: "movie",
  videochamada: "videocam",
  jogosOnline: "sports_esports",
} as const;

export const USE_CASE_LABELS: Record<keyof typeof USE_CASE_ICONS, string> = {
  navegacao: "Navegação",
  streaming: "Streaming",
  videochamada: "Videochamadas",
  jogosOnline: "Jogos online",
};

export const BUFFERBLOAT_LABEL: Record<SpeedTestResult["bufferbloat"]["severity"], string> = {
  none: "Nenhum",
  mild: "Leve",
  moderate: "Moderado",
  severe: "Severo",
};

// Rótulo de exibição do modo do resultado no bloco "Sobre o teste" (#70).
// Cobre 'triplo' mesmo que a jornada web atual (rapido/completo) nunca o
// produza diretamente — SpeedTestResult["mode"] inclui o valor e um resultado
// legado/histórico pode carregá-lo; sem rótulo aqui a tela quebraria (risco
// registrado na spec de UX, seção 3.5).
export const MODE_LABEL: Record<SpeedTestResult["mode"], string> = {
  rapido: "Rápido",
  completo: "Completo",
  triplo: "Completo (3 rodadas)",
};

export const STATUS_LABEL: Record<SpeedTestResult["status"], string> = {
  complete: SPEEDOMETER_OUTCOME.complete.label,
  partial: SPEEDOMETER_OUTCOME.partial.label,
  inconclusive: SPEEDOMETER_OUTCOME.inconclusive.label,
  contaminated: SPEEDOMETER_OUTCOME.contaminated.label,
  cancelled: SPEEDOMETER_OUTCOME.cancelled.label,
};

export const STATUS_MESSAGE: Partial<Record<SpeedTestResult["status"], string>> = {
  partial: "Alguma fase não terminou. Use apenas as métricas disponíveis.",
  inconclusive: "Não houve amostras de latência suficientes. Repita o teste.",
  contaminated: "A conexão mudou durante a medição; repita para obter um resultado confiável.",
};
